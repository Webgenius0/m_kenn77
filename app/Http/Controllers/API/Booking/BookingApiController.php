<?php

namespace App\Http\Controllers\API\Booking;

use App\Concerns\ApiResponse;
use App\Http\Controllers\API\Property\PropertyApiController;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use App\Services\Payment\PayPalService;
use App\Services\Payment\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BookingApiController extends Controller
{
    use ApiResponse;

    protected StripeService $stripeService;
    protected PayPalService $payPalService;

    public function __construct(StripeService $stripeService, PayPalService $payPalService)
    {
        $this->stripeService = $stripeService;
        $this->payPalService = $payPalService;
    }

    /**
     * Create a new booking and initiate payment session (Stripe or PayPal).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id'      => ['required'],
            'check_in'         => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'check_out'        => ['required', 'date_format:Y-m-d', 'after:check_in'],
            'payment_method'   => ['required', 'string', 'in:stripe,paypal'],
            'adults'           => ['nullable', 'integer', 'min:1'],
            'children'         => ['nullable', 'integer', 'min:0'],
            'pets'             => ['nullable', 'integer', 'min:0'],
            'coupon_code'      => ['nullable', 'string', 'max:50'],
            'guest_name'       => ['required_without:user_id', 'nullable', 'string', 'max:255'],
            'guest_email'      => ['required_without:user_id', 'nullable', 'email', 'max:255'],
            'guest_phone'      => ['nullable', 'string', 'max:50'],
        ]);

        try {
            $property = $this->resolveProperty($validated['property_id']);
            $checkIn = Carbon::parse($validated['check_in']);
            $checkOut = Carbon::parse($validated['check_out']);

            // 1. Resolve guest user (authenticated or guest account)
            $user = auth('sanctum')->user();
            if (!$user) {
                $guestEmail = trim(strtolower($validated['guest_email']));
                $guestName = trim($validated['guest_name']);
                $nameParts = explode(' ', $guestName, 2);

                $user = User::firstOrCreate(
                    ['email' => $guestEmail],
                    [
                        'name'         => $guestName,
                        'first_name'   => $nameParts[0] ?? $guestName,
                        'last_name'    => $nameParts[1] ?? '',
                        'phone_number' => $validated['guest_phone'] ?? null,
                        'password'     => bcrypt(Str::random(24)),
                        'role'         => 'user',
                    ]
                );
            }

            // 2. Strict availability check to prevent double bookings
            $propertyController = app(PropertyApiController::class);
            $availability = $propertyController->getPropertyAvailability(
                $property,
                $checkIn->format('Y-m-d'),
                $checkOut->format('Y-m-d')
            );

            $bookedDates = $availability['booked_dates'] ?? [];
            $conflicts = [];
            $cursor = $checkIn->copy();
            while ($cursor->lessThan($checkOut)) {
                $dStr = $cursor->format('Y-m-d');
                if (in_array($dStr, $bookedDates, true)) {
                    $conflicts[] = $dStr;
                }
                $cursor->addDay();
            }

            if (!empty($conflicts)) {
                return $this->errorResponse(
                    'The selected dates are no longer available. Conflicting dates: ' . implode(', ', $conflicts),
                    422,
                    ['conflicting_dates' => $conflicts]
                );
            }

            // 3. Calculate financial totals
            $nights = $checkIn->diffInDays($checkOut);
            $pricePerNight = (float) ($property->price_per_night ?? 0);
            $subtotal = round($nights * $pricePerNight, 2);

            $couponData = $this->calculateCouponDiscount(
                $validated['coupon_code'] ?? null,
                $subtotal,
                $nights
            );

            $discount = $couponData['discount'];
            $total = max(0, round($subtotal - $discount, 2));
            $bookingNumber = 'BK-' . strtoupper(Str::random(5)) . '-' . date('Ymd');

            // 4. Save Booking inside a transaction
            $booking = DB::transaction(function () use (
                $bookingNumber,
                $user,
                $property,
                $couponData,
                $validated,
                $checkIn,
                $checkOut,
                $nights,
                $pricePerNight,
                $subtotal,
                $discount,
                $total
            ) {
                return Booking::create([
                    'booking_number'   => $bookingNumber,
                    'user_id'          => $user->id,
                    'property_id'      => $property->id,
                    'coupon_id'        => $couponData['coupon']?->id ?? null,
                    'coupon_code'      => $couponData['coupon']?->code ?? null,
                    'guest_name'       => $validated['guest_name'] ?? $user->name,
                    'guest_email'      => $validated['guest_email'] ?? $user->email,
                    'guest_phone'      => $validated['guest_phone'] ?? $user->phone_number,
                    'special_requests' => $validated['special_requests'] ?? null,
                    'check_in'         => $checkIn->format('Y-m-d'),
                    'check_out'        => $checkOut->format('Y-m-d'),
                    'adults'           => (int) ($validated['adults'] ?? 1),
                    'children'         => (int) ($validated['children'] ?? 0),
                    'pets'             => (int) ($validated['pets'] ?? 0),
                    'nights'           => $nights,
                    'price_per_night'  => $pricePerNight,
                    'subtotal'         => $subtotal,
                    'discount'         => $discount,
                    'total'            => $total,
                    'currency'         => 'USD',
                    'status'           => 'pending',
                ]);
            });

            // 5. Initiate payment via Stripe or PayPal
            $paymentMethod = $validated['payment_method'];

            if ($paymentMethod === 'stripe') {
                $stripeResult = $this->stripeService->createCheckoutSession($booking);

                if (!$stripeResult['success']) {
                    return $this->errorResponse($stripeResult['message'], 400);
                }

                // Record initial pending payment
                Payment::create([
                    'booking_id'     => $booking->id,
                    'transaction_id' => $stripeResult['session_id'],
                    'amount'         => $booking->total,
                    'currency'       => $booking->currency,
                    'payment_method' => 'stripe',
                    'status'         => 'pending',
                    'payload'        => $stripeResult['raw'],
                ]);

                return $this->successResponse('Booking created. Redirect to Stripe to pay.', [
                    // 'booking'        => $this->transformBooking($booking),
                    'payment_method' => 'stripe',
                    'checkout_url'   => $stripeResult['checkout_url'],
                ]);

            } elseif ($paymentMethod === 'paypal') {
                $paypalResult = $this->payPalService->createOrder($booking, $urlOptions);

                if (!$paypalResult['success']) {
                    return $this->errorResponse($paypalResult['message'], 400);
                }

                // Record initial pending payment
                Payment::create([
                    'booking_id'     => $booking->id,
                    'transaction_id' => $paypalResult['order_id'],
                    'amount'         => $booking->total,
                    'currency'       => $booking->currency,
                    'payment_method' => 'paypal',
                    'status'         => 'pending',
                    'payload'        => $paypalResult['raw'],
                ]);

                return $this->successResponse('Booking created. Redirect to PayPal to pay.', [
                    // 'booking'        => $this->transformBooking($booking),
                    'payment_method' => 'paypal',
                    'order_id'       => $paypalResult['order_id'],
                    'approve_url'    => $paypalResult['approve_url'],
                ]);
            }

            return $this->errorResponse('Invalid payment method', 400);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation error', 422, $e->errors());
        } catch (\Throwable $e) {
            Log::error('Booking creation error', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to create booking: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get booking details by booking number.
     */
    public function show(string $bookingNumber): JsonResponse
    {
        try {
            $booking = Booking::with(['property.images', 'user', 'coupon', 'payment'])
                ->where('booking_number', $bookingNumber)
                ->orWhere('id', $bookingNumber)
                ->firstOrFail();

            return $this->successResponse('Booking details', $this->transformBooking($booking));
        } catch (\Throwable $e) {
            return $this->errorResponse('Booking not found', 404);
        }
    }

    /**
     * Get current authenticated user's bookings.
     */
    public function userBookings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->errorResponse('Unauthenticated', 401);
        }

        $bookings = Booking::with(['property.images', 'payment'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($request->input('per_page', 10));

        $bookings->getCollection()->transform(fn ($booking) => $this->transformBooking($booking));

        return $this->successResponse('User bookings', $bookings);
    }

    /**
     * Helper to resolve property by ID or slug.
     */
    protected function resolveProperty(mixed $identifier): Property
    {
        return is_numeric($identifier)
            ? Property::findOrFail($identifier)
            : Property::where('slug', $identifier)->orWhere('id', $identifier)->firstOrFail();
    }

    /**
     * Validate and calculate coupon discount.
     */
    protected function calculateCouponDiscount(?string $code, float $subtotal, int $nights): array
    {
        if (blank($code)) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        $coupon = Coupon::where('code', trim($code))->where('is_active', true)->first();

        if (!$coupon) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        // Check date validity
        $now = now();
        if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
            return ['discount' => 0.0, 'coupon' => null];
        }
        if ($coupon->ends_at && $now->gt($coupon->ends_at)) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        // Check minimum nights
        if ($coupon->min_night && $nights < $coupon->min_night) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        $discount = 0.0;
        $val = (float) $coupon->value;

        if (strtolower($coupon->type) === 'percent' || strtolower($coupon->type) === 'percentage') {
            $discount = round(($subtotal * $val) / 100, 2);
        } else {
            // Fixed discount
            $discount = min($val, $subtotal);
        }

        return [
            'discount' => $discount,
            'coupon'   => $coupon,
        ];
    }

    /**
     * Transform a booking model for API response.
     */
    protected function transformBooking(Booking $booking): array
    {
        return [
            'id'                => $booking->id,
            'booking_number'    => $booking->booking_number,
            'status'            => $booking->status,
            'check_in'          => $booking->check_in?->format('Y-m-d'),
            'check_out'         => $booking->check_out?->format('Y-m-d'),
            'nights'            => $booking->nights,
            'adults'            => $booking->adults,
            'children'          => $booking->children,
            'pets'              => $booking->pets,
            'price_per_night'   => (float) $booking->price_per_night,
            'subtotal'          => (float) $booking->subtotal,
            'discount'          => (float) $booking->discount,
            'total'             => (float) $booking->total,
            'currency'          => $booking->currency,
            'coupon_code'       => $booking->coupon_code,
            'guest_name'        => $booking->guest_name,
            'guest_email'       => $booking->guest_email,
            'guest_phone'       => $booking->guest_phone,
            'special_requests'  => $booking->special_requests,
            'hospitable_synced' => (bool) $booking->hospitable_synced,
            'created_at'        => $booking->created_at?->toIso8601String(),
            'property'          => $booking->property ? [
                'id'       => $booking->property->id,
                'name'     => $booking->property->name,
                'slug'     => $booking->property->slug,
                'location' => $booking->property->location,
                'address'  => $booking->property->address,
                'image'    => $booking->property->images->first()?->image_path,
            ] : null,
            'payment'           => $booking->payment ? [
                'id'             => $booking->payment->id,
                'transaction_id' => $booking->payment->transaction_id,
                'payment_method' => $booking->payment->payment_method,
                'amount'         => (float) $booking->payment->amount,
                'status'         => $booking->payment->status,
                'paid_at'        => $booking->payment->paid_at?->toIso8601String(),
            ] : null,
        ];
    }
}
