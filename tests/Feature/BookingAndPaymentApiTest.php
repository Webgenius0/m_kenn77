<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Credential;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingAndPaymentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Configure dummy credentials for testing
        Credential::setValue('hospitable', 'api_key', 'test_hospitable_key');
        Credential::setValue('stripe', 'secret_key', 'sk_test_123456');
        Credential::setValue('paypal', 'client_id', 'test_paypal_client_id');
        Credential::setValue('paypal', 'client_secret', 'test_paypal_client_secret');
    }

    public function test_property_details_and_calendar_endpoints_return_availability(): void
    {
        $property = Property::create([
            'name'                   => 'Kuala Lumpur Luxury Suite',
            'slug'                   => 'kuala-lumpur-luxury-suite',
            'price_per_night'        => 620.00,
            'max_guests'             => 10,
            'bedrooms'               => 4,
            'bathrooms'              => 3,
            'hospitable_property_id' => 'hosp-uuid-kl-1',
            'is_active'              => true,
        ]);

        // Mock Hospitable API calendar
        Http::fake([
            'https://public.api.hospitable.com/v2/properties/hosp-uuid-kl-1/calendar*' => Http::response([
                'data' => [
                    'days' => [
                        [
                            'date'   => '2026-07-15',
                            'status' => ['available' => false, 'reason' => 'reserved'],
                            'price'  => ['amount' => 62000],
                        ],
                        [
                            'date'   => '2026-07-16',
                            'status' => ['available' => true],
                            'price'  => ['amount' => 62000],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // 1. Property show endpoint
        $showResponse = $this->getJson("/api/v1/properties/{$property->slug}");
        $showResponse->assertOk()
            ->assertJsonPath('data.availability.hospitable_connected', true)
            ->assertJsonPath('data.availability.hospitable_property_id', 'hosp-uuid-kl-1');

        $this->assertContains('2026-07-15', $showResponse->json('data.availability.booked_dates'));

        // 2. Dedicated calendar endpoint
        $calResponse = $this->getJson("/api/v1/properties/{$property->slug}/calendar?start_date=2026-07-01&end_date=2026-07-31");
        $calResponse->assertOk()
            ->assertJsonPath('data.hospitable_connected', true);

        $this->assertContains('2026-07-15', $calResponse->json('data.booked_dates'));
    }

    public function test_calculate_booking_quote(): void
    {
        $property = Property::create([
            'name'            => 'Beachfront Bungalow',
            'slug'            => 'beachfront-bungalow',
            'price_per_night' => 200.00,
            'max_guests'      => 4,
            'is_active'       => true,
        ]);

        $checkIn = now()->addDays(10)->format('Y-m-d');
        $checkOut = now()->addDays(14)->format('Y-m-d');

        $response = $this->postJson('/api/v1/bookings/calculate', [
            'property_id' => $property->id,
            'check_in'    => $checkIn,
            'check_out'   => $checkOut,
            'adults'      => 2,
            'children'    => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.nights', 4)
            ->assertJsonPath('data.price_per_night', 200)
            ->assertJsonPath('data.subtotal', 800)
            ->assertJsonPath('data.total', 800)
            ->assertJsonPath('data.is_available', true);
    }

    public function test_stripe_booking_creation_and_verification_with_hospitable_sync(): void
    {
        $property = Property::create([
            'name'                   => 'Alpine Chalet',
            'slug'                   => 'alpine-chalet',
            'price_per_night'        => 300.00,
            'max_guests'             => 6,
            'hospitable_property_id' => 'hosp-chalet-77',
            'is_active'              => true,
        ]);

        $checkIn = now()->addDays(5)->format('Y-m-d');
        $checkOut = now()->addDays(8)->format('Y-m-d');

        // Mock Stripe API & Hospitable API
        Http::fake([
            'https://api.stripe.com/v1/checkout/sessions' => Http::response([
                'id'  => 'cs_test_session_123',
                'url' => 'https://checkout.stripe.com/pay/cs_test_session_123',
            ], 200),
            'https://api.stripe.com/v1/checkout/sessions/cs_test_session_123' => Http::response([
                'id'                   => 'cs_test_session_123',
                'payment_status'       => 'paid',
                'client_reference_id'  => null,
                'metadata'             => ['booking_number' => null],
            ], 200),
            'https://public.api.hospitable.com/v2/properties/hosp-chalet-77/calendar*' => Http::response([
                'status' => 'success',
            ], 200),
        ]);

        // 1. Create booking with Stripe
        $createResponse = $this->postJson('/api/v1/bookings', [
            'property_id'    => $property->id,
            'check_in'       => $checkIn,
            'check_out'      => $checkOut,
            'adults'         => 2,
            'payment_method' => 'stripe',
            'guest_name'     => 'Jane Doe',
            'guest_email'    => 'jane@example.com',
            'guest_phone'    => '+1234567890',
        ]);

        $createResponse->assertOk()
            ->assertJsonPath('data.payment_method', 'stripe')
            ->assertJsonPath('data.session_id', 'cs_test_session_123')
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/pay/cs_test_session_123');

        $bookingNumber = $createResponse->json('data.booking.booking_number');
        $this->assertDatabaseHas('bookings', [
            'booking_number' => $bookingNumber,
            'status'         => 'pending',
        ]);

        // 2. Verify Stripe Session
        $verifyResponse = $this->postJson('/api/v1/payments/stripe/verify', [
            'session_id' => 'cs_test_session_123',
        ]);

        $verifyResponse->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'completed')
            ->assertJsonPath('data.hospitable_synced', true);

        $this->assertDatabaseHas('bookings', [
            'booking_number'    => $bookingNumber,
            'status'            => 'confirmed',
            'hospitable_synced' => true,
        ]);

        $this->assertDatabaseHas('payments', [
            'transaction_id' => 'cs_test_session_123',
            'status'         => 'completed',
        ]);
    }

    public function test_paypal_booking_creation_and_capture_with_hospitable_sync(): void
    {
        $property = Property::create([
            'name'                   => 'Sunset Villa',
            'slug'                   => 'sunset-villa',
            'price_per_night'        => 450.00,
            'max_guests'             => 8,
            'hospitable_property_id' => 'hosp-villa-99',
            'is_active'              => true,
        ]);

        $checkIn = now()->addDays(15)->format('Y-m-d');
        $checkOut = now()->addDays(18)->format('Y-m-d');

        // Mock PayPal OAuth, Order create, Capture, and Hospitable update
        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal_mock_access_token_123',
                'expires_in'   => 32400,
            ], 200),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id'     => 'ORDER-PAYPAL-777',
                'status' => 'CREATED',
                'links'  => [
                    [
                        'rel'  => 'approve',
                        'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER-PAYPAL-777',
                    ],
                ],
            ], 200),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-PAYPAL-777/capture' => Http::response([
                'id'             => 'ORDER-PAYPAL-777',
                'status'         => 'COMPLETED',
                'purchase_units' => [
                    [
                        'reference_id' => 'BK-REF-TEST',
                    ],
                ],
            ], 200),
            'https://public.api.hospitable.com/v2/properties/hosp-villa-99/calendar*' => Http::response([
                'status' => 'success',
            ], 200),
        ]);

        // 1. Create booking with PayPal
        $createResponse = $this->postJson('/api/v1/bookings', [
            'property_id'    => $property->id,
            'check_in'       => $checkIn,
            'check_out'      => $checkOut,
            'adults'         => 4,
            'payment_method' => 'paypal',
            'guest_name'     => 'John Smith',
            'guest_email'    => 'john@example.com',
        ]);

        $createResponse->assertOk()
            ->assertJsonPath('data.payment_method', 'paypal')
            ->assertJsonPath('data.order_id', 'ORDER-PAYPAL-777')
            ->assertJsonPath('data.approve_url', 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER-PAYPAL-777');

        $bookingNumber = $createResponse->json('data.booking.booking_number');

        // 2. Capture PayPal Order
        $captureResponse = $this->postJson('/api/v1/payments/paypal/capture', [
            'order_id' => 'ORDER-PAYPAL-777',
        ]);

        $captureResponse->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'completed')
            ->assertJsonPath('data.hospitable_synced', true);

        $this->assertDatabaseHas('bookings', [
            'booking_number'    => $bookingNumber,
            'status'            => 'confirmed',
            'hospitable_synced' => true,
        ]);
    }
}
