<?php

namespace App\Http\Controllers\API\Payment;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\Backend\HospitableService;
use App\Services\Payment\PayPalService;
use App\Services\Payment\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentApiController extends Controller
{
    use ApiResponse;

    protected StripeService $stripeService;
    protected PayPalService $payPalService;
    protected HospitableService $hospitableService;

    public function __construct(
        StripeService $stripeService,
        PayPalService $payPalService,
        HospitableService $hospitableService
    ) {
        $this->stripeService = $stripeService;
        $this->payPalService = $payPalService;
        $this->hospitableService = $hospitableService;
    }

    /**
     * Verify Stripe Checkout Session and finalize booking.
     */
    public function verifyStripe(Request $request): JsonResponse
    {
        $sessionId = $request->input('session_id') ?? $request->query('session_id');

        if (blank($sessionId)) {
            return $this->errorResponse('Missing session_id parameter.', 422);
        }

        try {
            $verification = $this->stripeService->verifySession($sessionId);

            if (!$verification['verified']) {
                return $this->errorResponse($verification['message'], 400);
            }

            if (!$verification['paid']) {
                return $this->errorResponse('Payment has not been completed yet.', 400, [
                    'session_id' => $sessionId,
                    'paid'       => false,
                ]);
            }

            // Find payment or booking
            $payment = Payment::with('booking.property')
                ->where('transaction_id', $sessionId)
                ->first();

            $booking = $payment?->booking;

            if (!$booking && filled($verification['booking_number'])) {
                $booking = Booking::with('property')
                    ->where('booking_number', $verification['booking_number'])
                    ->first();
            }

            if (!$booking) {
                return $this->errorResponse('Associated booking not found for this session.', 404);
            }

            // Complete booking & payment and sync with Hospitable
            $this->finalizeBookingPayment($booking, $payment, 'stripe', $sessionId, $verification['session']);

            return $this->successResponse('Payment verified and booking confirmed successfully.', [
                'booking_number'    => $booking->booking_number,
                'status'            => 'confirmed',
                'payment_status'    => 'completed',
                'hospitable_synced' => (bool) $booking->hospitable_synced,
                'booking'           => $booking->fresh(['property', 'payment']),
            ]);

        } catch (\Throwable $e) {
            Log::error('Stripe verification error', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to verify Stripe payment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Capture PayPal Order and finalize booking.
     */
    public function capturePayPal(Request $request): JsonResponse
    {
        $orderId = $request->input('order_id') ?? $request->query('order_id') ?? $request->input('token');

        if (blank($orderId)) {
            return $this->errorResponse('Missing order_id parameter.', 422);
        }

        try {
            $captureResult = $this->payPalService->captureOrder($orderId);

            if (!$captureResult['success'] || !$captureResult['completed']) {
                return $this->errorResponse($captureResult['message'], 400, [
                    'order_id'  => $orderId,
                    'completed' => false,
                ]);
            }

            // Find payment or booking
            $payment = Payment::with('booking.property')
                ->where('transaction_id', $orderId)
                ->first();

            $booking = $payment?->booking;

            if (!$booking && filled($captureResult['booking_number'])) {
                $booking = Booking::with('property')
                    ->where('booking_number', $captureResult['booking_number'])
                    ->first();
            }

            if (!$booking) {
                return $this->errorResponse('Associated booking not found for this PayPal order.', 404);
            }

            // Complete booking & payment and sync with Hospitable
            $this->finalizeBookingPayment($booking, $payment, 'paypal', $orderId, $captureResult['order']);

            return $this->successResponse('PayPal payment captured and booking confirmed successfully.', [
                'booking_number'    => $booking->booking_number,
                'status'            => 'confirmed',
                'payment_status'    => 'completed',
                'hospitable_synced' => (bool) $booking->hospitable_synced,
                'booking'           => $booking->fresh(['property', 'payment']),
            ]);

        } catch (\Throwable $e) {
            Log::error('PayPal capture error', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to capture PayPal payment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Stripe Webhook handler.
     */
    public function stripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $event = $payload['type'] ?? '';

        Log::info('Stripe Webhook received', ['type' => $event]);

        if ($event === 'checkout.session.completed') {
            $session = $payload['data']['object'] ?? [];
            $sessionId = $session['id'] ?? null;
            $bookingNumber = $session['client_reference_id'] ?? ($session['metadata']['booking_number'] ?? null);

            if ($sessionId || $bookingNumber) {
                $payment = Payment::with('booking.property')->where('transaction_id', $sessionId)->first();
                $booking = $payment?->booking ?: Booking::with('property')->where('booking_number', $bookingNumber)->first();

                if ($booking) {
                    $this->finalizeBookingPayment($booking, $payment, 'stripe', $sessionId, $session);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * PayPal Webhook handler.
     */
    public function paypalWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $eventType = $payload['event_type'] ?? '';

        Log::info('PayPal Webhook received', ['type' => $eventType]);

        if ($eventType === 'CHECKOUT.ORDER.APPROVED' || $eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            $resource = $payload['resource'] ?? [];
            $orderId = $resource['id'] ?? null;

            if ($orderId) {
                $payment = Payment::with('booking.property')->where('transaction_id', $orderId)->first();
                $booking = $payment?->booking;

                if ($booking && $booking->status !== 'confirmed') {
                    $this->finalizeBookingPayment($booking, $payment, 'paypal', $orderId, $resource);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Mark booking confirmed, update payment record, and synchronize date blocking with Hospitable API.
     */
    protected function finalizeBookingPayment(
        Booking $booking,
        ?Payment $payment,
        string $paymentMethod,
        string $transactionId,
        ?array $rawPayload = null
    ): void {
        DB::transaction(function () use ($booking, $payment, $paymentMethod, $transactionId, $rawPayload) {
            // Update or create payment record
            if ($payment) {
                $payment->update([
                    'status'         => 'completed',
                    'paid_at'        => now(),
                    'payload'        => $rawPayload,
                    'transaction_id' => $transactionId,
                ]);
            } else {
                Payment::create([
                    'booking_id'     => $booking->id,
                    'transaction_id' => $transactionId,
                    'amount'         => $booking->total,
                    'currency'       => $booking->currency,
                    'payment_method' => $paymentMethod,
                    'status'         => 'completed',
                    'paid_at'        => now(),
                    'payload'        => $rawPayload,
                ]);
            }

            // Update booking status
            $booking->update([
                'status' => 'confirmed',
            ]);
        });

        // Sync with Hospitable API to block reserved dates
        $this->syncHospitableBookingDates($booking);
    }

    /**
     * Block dates on Hospitable API to avoid double-booking conflicts.
     */
    protected function syncHospitableBookingDates(Booking $booking): void
    {
        $property = $booking->property;

        if (!$property || blank($property->hospitable_property_id)) {
            Log::info("Booking #{$booking->booking_number}: Property has no Hospitable ID, skipping Hospitable block.");
            return;
        }

        try {
            $hospitableId = $property->hospitable_property_id;
            $checkIn = $booking->check_in->format('Y-m-d');
            $checkOut = $booking->check_out->format('Y-m-d');

            Log::info("Syncing dates with Hospitable for booking #{$booking->booking_number}", [
                'hospitable_property_id' => $hospitableId,
                'check_in'               => $checkIn,
                'check_out'              => $checkOut,
            ]);

            $syncResult = $this->hospitableService->blockDates(
                $hospitableId,
                $checkIn,
                $checkOut,
                "Website Booking #{$booking->booking_number}",
                (float) ($booking->price_per_night ?? $property->price_per_night ?? 0)
            );

            if ($syncResult['success']) {
                $booking->update([
                    'hospitable_synced'     => true,
                    'hospitable_sync_error' => null,
                ]);
                Log::info("Successfully blocked dates on Hospitable for booking #{$booking->booking_number}");
            } elseif ($syncResult['channel_restricted'] ?? false) {
                // Property is connected to a channel (Airbnb, Booking.com, etc.)
                // that restricts API calendar writes — this is expected, not an error.
                $booking->update([
                    'hospitable_synced'     => false,
                    'hospitable_sync_error' => 'Calendar sync skipped: property is channel-managed (Airbnb/Booking.com).',
                ]);
                Log::info("Hospitable calendar sync skipped for booking #{$booking->booking_number} — property is channel restricted.");
            } else {
                $booking->update([
                    'hospitable_synced'     => false,
                    'hospitable_sync_error' => $syncResult['message'],
                ]);
                Log::warning("Failed to block dates on Hospitable for booking #{$booking->booking_number}: " . $syncResult['message']);
            }

        } catch (\Throwable $e) {
            $booking->update([
                'hospitable_synced'     => false,
                'hospitable_sync_error' => $e->getMessage(),
            ]);
            Log::error("Exception syncing booking dates with Hospitable: " . $e->getMessage());
        }
    }
}
