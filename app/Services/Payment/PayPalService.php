<?php

namespace App\Services\Payment;

use App\Models\Booking;
use App\Models\Credential;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    /**
     * Get active PayPal Client ID.
     */
    public function getClientId(): ?string
    {
        $dbKey = Credential::getValue('paypal', 'client_id');
        if (filled($dbKey)) {
            return trim($dbKey);
        }

        $configKey = config('services.paypal.client_id');
        if (filled($configKey)) {
            return trim($configKey);
        }

        $envKey = env('PAYPAL_CLIENT_ID');
        return filled($envKey) ? trim($envKey) : null;
    }

    /**
     * Get active PayPal Client Secret.
     */
    public function getClientSecret(): ?string
    {
        $dbKey = Credential::getValue('paypal', 'client_secret');
        if (filled($dbKey)) {
            return trim($dbKey);
        }

        $configKey = config('services.paypal.client_secret');
        if (filled($configKey)) {
            return trim($configKey);
        }

        $envKey = env('PAYPAL_CLIENT_SECRET');
        return filled($envKey) ? trim($envKey) : null;
    }

    /**
     * Get PayPal environment mode: 'sandbox' or 'live'.
     */
    public function getMode(): string
    {
        $mode = Credential::getValue('paypal', 'mode') ?? config('services.paypal.mode') ?? env('PAYPAL_MODE', 'sandbox');
        return strtolower(trim($mode)) === 'live' ? 'live' : 'sandbox';
    }

    /**
     * Get PayPal API Base URL based on mode.
     */
    public function getBaseUrl(): string
    {
        return $this->getMode() === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    /**
     * Check if PayPal credentials are configured.
     */
    public function isConfigured(): bool
    {
        return filled($this->getClientId()) && filled($this->getClientSecret());
    }

    /**
     * Generate an OAuth 2.0 access token from PayPal.
     */
    public function getAccessToken(): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        $clientId = $this->getClientId();
        $clientSecret = $this->getClientSecret();
        $cacheKey = "paypal_access_token_" . md5($clientId . $this->getMode());

        return Cache::remember($cacheKey, 28800, function () use ($clientId, $clientSecret) {
            $baseUrl = $this->getBaseUrl();

            try {
                $response = Http::asForm()
                    ->withBasicAuth($clientId, $clientSecret)
                    ->timeout(15)
                    ->post("{$baseUrl}/v1/oauth2/token", [
                        'grant_type' => 'client_credentials',
                    ]);

                if (!$response->successful()) {
                    Log::error('PayPal OAuth token request failed', [
                        'status' => $response->status(),
                        'body' => $response->json(),
                    ]);
                    return null;
                }

                $json = $response->json();
                return $json['access_token'] ?? null;
            } catch (\Throwable $e) {
                Log::error('PayPal OAuth token exception', ['error' => $e->getMessage()]);
                return null;
            }
        });
    }

    /**
     * Create a PayPal order for a booking.
     *
     * @param Booking $booking
     * @param array $options Optional return_url and cancel_url
     * @return array{success: bool, order_id: ?string, approve_url: ?string, message: ?string, raw: ?array}
     */
    public function createOrder(Booking $booking, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'order_id' => null,
                'approve_url' => null,
                'message' => 'PayPal is not configured. Please add Client ID and Secret in settings or .env file.',
                'raw' => null,
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return [
                'success' => false,
                'order_id' => null,
                'approve_url' => null,
                'message' => 'Unable to authenticate with PayPal API.',
                'raw' => null,
            ];
        }

        $baseUrl = config('app.url', 'http://localhost:8000');
        $returnUrl = $options['return_url'] ?? "{$baseUrl}/booking/confirmation?payment_method=paypal&booking_number={$booking->booking_number}";
        $cancelUrl = $options['cancel_url'] ?? "{$baseUrl}/booking/cancelled?booking_number={$booking->booking_number}";

        $propertyName = $booking->property->name ?? 'Property Booking';
        $formattedAmount = number_format((float) $booking->total, 2, '.', '');
        $currency = strtoupper($booking->currency ?: 'USD');

        $payload = [
            'intent' => 'CAPTURE',
            'purchase_units' => [
                [
                    'reference_id' => $booking->booking_number,
                    'description' => "Booking #{$booking->booking_number}: {$propertyName}",
                    'custom_id' => (string) $booking->id,
                    'amount' => [
                        'currency_code' => $currency,
                        'value' => $formattedAmount,
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => $currency,
                                'value' => $formattedAmount,
                            ],
                        ],
                    ],
                    'items' => [
                        [
                            'name' => "Booking #{$booking->booking_number}",
                            'description' => "{$booking->nights} nights ({$booking->check_in->format('Y-m-d')} to {$booking->check_out->format('Y-m-d')})",
                            'unit_amount' => [
                                'currency_code' => $currency,
                                'value' => $formattedAmount,
                            ],
                            'quantity' => '1',
                            'category' => 'DIGITAL_GOODS',
                        ],
                    ],
                ],
            ],
            'application_context' => [
                'brand_name' => config('app.name', 'Hotel & Resort'),
                'landing_page' => 'BILLING',
                'user_action' => 'PAY_NOW',
                'return_url' => $returnUrl,
                'cancel_url' => $cancelUrl,
            ],
        ];

        try {
            $response = Http::withToken($token)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Prefer' => 'return=representation',
                ])
                ->timeout(20)
                ->post("{$this->getBaseUrl()}/v2/checkout/orders", $payload);

            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->json();
                $errorMsg = $body['message'] ?? $body['error_description'] ?? "PayPal responded with status {$status}.";

                Log::error('PayPal Order creation failed', [
                    'status' => $status,
                    'response' => $body,
                    'booking_number' => $booking->booking_number,
                ]);

                return [
                    'success' => false,
                    'order_id' => null,
                    'approve_url' => null,
                    'message' => "PayPal Error: {$errorMsg}",
                    'raw' => $body,
                ];
            }

            $order = $response->json();
            $orderId = $order['id'] ?? null;

            $approveUrl = null;
            foreach ($order['links'] ?? [] as $link) {
                if (($link['rel'] ?? '') === 'approve') {
                    $approveUrl = $link['href'];
                    break;
                }
            }

            return [
                'success' => true,
                'order_id' => $orderId,
                'approve_url' => $approveUrl,
                'message' => 'PayPal order created successfully.',
                'raw' => $order,
            ];

        } catch (\Throwable $e) {
            Log::error('PayPal Order creation exception', [
                'booking_number' => $booking->booking_number,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'order_id' => null,
                'approve_url' => null,
                'message' => 'Unable to create PayPal order: ' . $e->getMessage(),
                'raw' => null,
            ];
        }
    }

    /**
     * Capture an approved PayPal order.
     *
     * @param string $orderId
     * @return array{success: bool, completed: bool, booking_number: ?string, order: ?array, message: ?string}
     */
    public function captureOrder(string $orderId): array
    {
        $token = $this->getAccessToken();
        if (!$token) {
            return [
                'success' => false,
                'completed' => false,
                'booking_number' => null,
                'order' => null,
                'message' => 'Unable to authenticate with PayPal API.',
            ];
        }

        try {
            $response = Http::withToken($token)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Prefer' => 'return=representation',
                ])
                ->timeout(20)
                ->post("{$this->getBaseUrl()}/v2/checkout/orders/{$orderId}/capture", (object)[]);

            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->json();
                $errorMsg = $body['message'] ?? "PayPal capture returned status {$status}.";

                Log::error('PayPal Order capture failed', [
                    'order_id' => $orderId,
                    'status' => $status,
                    'body' => $body,
                ]);

                return [
                    'success' => false,
                    'completed' => false,
                    'booking_number' => null,
                    'order' => $body,
                    'message' => "PayPal Capture Error: {$errorMsg}",
                ];
            }

            $order = $response->json();
            $orderStatus = $order['status'] ?? '';
            $isCompleted = strtoupper($orderStatus) === 'COMPLETED';

            // Find booking number from purchase units
            $bookingNumber = null;
            if (!empty($order['purchase_units'][0]['reference_id'])) {
                $bookingNumber = $order['purchase_units'][0]['reference_id'];
            }

            return [
                'success' => true,
                'completed' => $isCompleted,
                'booking_number' => $bookingNumber,
                'order' => $order,
                'message' => $isCompleted ? 'PayPal payment captured successfully.' : "Order status is {$orderStatus}.",
            ];

        } catch (\Throwable $e) {
            Log::error('PayPal Order capture exception', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'completed' => false,
                'booking_number' => null,
                'order' => null,
                'message' => 'Unable to capture PayPal payment: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get details of a PayPal order.
     */
    public function getOrder(string $orderId): ?array
    {
        $token = $this->getAccessToken();
        if (!$token) {
            return null;
        }

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->get("{$this->getBaseUrl()}/v2/checkout/orders/{$orderId}");

            return $response->successful() ? $response->json() : null;
        } catch (\Throwable $e) {
            Log::error('PayPal get order exception', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
