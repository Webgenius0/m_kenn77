<?php

namespace App\Services\Payment;

use App\Models\Booking;
use App\Models\Credential;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StripeService
{
    /**
     * Get active Stripe secret key.
     */
    public function getSecretKey(): ?string
    {
        $dbKey = Credential::getValue('stripe', 'secret_key');
        if (filled($dbKey)) {
            return trim($dbKey);
        }

        $configKey = config('services.stripe.secret');
        if (filled($configKey)) {
            return trim($configKey);
        }

        $envKey = env('STRIPE_SECRET_KEY') ?? env('STRIPE_SECRET');
        return filled($envKey) ? trim($envKey) : null;
    }

    /**
     * Get active Stripe publishable key.
     */
    public function getPublishableKey(): ?string
    {
        $dbKey = Credential::getValue('stripe', 'publishable_key');
        if (filled($dbKey)) {
            return trim($dbKey);
        }

        $configKey = config('services.stripe.key');
        if (filled($configKey)) {
            return trim($configKey);
        }

        $envKey = env('STRIPE_PUBLISHABLE_KEY') ?? env('STRIPE_KEY');
        return filled($envKey) ? trim($envKey) : null;
    }

    /**
     * Get active Stripe webhook secret.
     */
    public function getWebhookSecret(): ?string
    {
        $dbSecret = Credential::getValue('stripe', 'webhook_secret');
        if (filled($dbSecret)) {
            return trim($dbSecret);
        }

        return env('STRIPE_WEBHOOK_SECRET');
    }

    /**
     * Check if Stripe secret key is configured.
     */
    public function isConfigured(): bool
    {
        return filled($this->getSecretKey());
    }

    /**
     * Create a Stripe Checkout Session for a booking.
     *
     * @param Booking $booking
     * @param array $options Optional overrides (success_url, cancel_url)
     * @return array{success: bool, session_id: ?string, checkout_url: ?string, message: ?string, raw: ?array}
     */
    public function createCheckoutSession(Booking $booking, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'session_id' => null,
                'checkout_url' => null,
                'message' => 'Stripe is not configured. Please add Stripe Secret Key in settings or .env file.',
                'raw' => null,
            ];
        }

        $secretKey = $this->getSecretKey();
        $propertyName = $booking->property->name ?? 'Property Booking';
        $datesDescription = "Check-in: {$booking->check_in->format('Y-m-d')} to {$booking->check_out->format('Y-m-d')} ({$booking->nights} nights)";

        // Amount in cents
        $unitAmount = (int) round((float) $booking->total * 100);
        $currency = strtolower($booking->currency ?: 'usd');

        // URL configuration
        $baseUrl = config('app.url', 'http://localhost:8000');
        $successUrl = $options['success_url'] ?? "{$baseUrl}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}&booking_number={$booking->booking_number}";
        $cancelUrl = $options['cancel_url'] ?? "{$baseUrl}/booking/cancelled?booking_number={$booking->booking_number}";

        // Ensure {CHECKOUT_SESSION_ID} placeholder is present for Stripe to fill if needed
        if (!str_contains($successUrl, '{CHECKOUT_SESSION_ID}')) {
            $separator = str_contains($successUrl, '?') ? '&' : '?';
            $successUrl .= "{$separator}session_id={CHECKOUT_SESSION_ID}";
        }

        $payload = [
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'client_reference_id' => $booking->booking_number,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => $currency,
                        'unit_amount' => $unitAmount,
                        'product_data' => [
                            'name' => "Booking #{$booking->booking_number}: {$propertyName}",
                            'description' => $datesDescription,
                        ],
                    ],
                    'quantity' => 1,
                ],
            ],
            'metadata' => [
                'booking_id' => (string) $booking->id,
                'booking_number' => $booking->booking_number,
                'property_id' => (string) $booking->property_id,
            ],
        ];

        $customerEmail = $booking->guest_email ?: ($booking->user?->email ?: null);
        if ($customerEmail) {
            $payload['customer_email'] = $customerEmail;
        }

        try {
            $response = Http::asForm()
                ->withToken($secretKey)
                ->timeout(20)
                ->post('https://api.stripe.com/v1/checkout/sessions', $payload);

            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->json();
                $errorMsg = $body['error']['message'] ?? "Stripe API responded with status {$status}.";

                Log::error('Stripe Checkout Session creation failed', [
                    'status' => $status,
                    'error' => $errorMsg,
                    'booking_number' => $booking->booking_number,
                ]);

                return [
                    'success' => false,
                    'session_id' => null,
                    'checkout_url' => null,
                    'message' => "Stripe Error: {$errorMsg}",
                    'raw' => $body,
                ];
            }

            $session = $response->json();

            return [
                'success' => true,
                'session_id' => $session['id'],
                'checkout_url' => $session['url'],
                'message' => 'Stripe session created successfully.',
                'raw' => $session,
            ];

        } catch (\Throwable $e) {
            Log::error('Stripe Checkout Session exception', [
                'booking_number' => $booking->booking_number,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'session_id' => null,
                'checkout_url' => null,
                'message' => 'Unable to initiate Stripe checkout: ' . $e->getMessage(),
                'raw' => null,
            ];
        }
    }

    /**
     * Retrieve a Stripe Checkout Session by ID.
     */
    public function retrieveSession(string $sessionId): ?array
    {
        $secretKey = $this->getSecretKey();
        if (!$secretKey) {
            return null;
        }

        try {
            $response = Http::withToken($secretKey)
                ->timeout(15)
                ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}");

            return $response->successful() ? $response->json() : null;
        } catch (\Throwable $e) {
            Log::error('Stripe session retrieval exception', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Verify payment status of a session.
     *
     * @return array{verified: bool, paid: bool, booking_number: ?string, session: ?array, message: ?string}
     */
    public function verifySession(string $sessionId): array
    {
        $session = $this->retrieveSession($sessionId);

        if (!$session) {
            return [
                'verified' => false,
                'paid' => false,
                'booking_number' => null,
                'session' => null,
                'message' => 'Unable to retrieve Stripe session.',
            ];
        }

        $isPaid = ($session['payment_status'] ?? '') === 'paid';
        $bookingNumber = $session['client_reference_id'] ?? ($session['metadata']['booking_number'] ?? null);

        return [
            'verified' => true,
            'paid' => $isPaid,
            'booking_number' => $bookingNumber,
            'session' => $session,
            'message' => $isPaid ? 'Payment confirmed.' : 'Payment has not been completed yet.',
        ];
    }
}
