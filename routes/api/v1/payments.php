<?php

use App\Http\Controllers\API\Payment\PaymentApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('payments')->controller(PaymentApiController::class)->group(function () {
    // Stripe verification & webhook
    Route::match(['get', 'post'], '/stripe/verify', 'verifyStripe');
    Route::post('/stripe/webhook', 'stripeWebhook');

    // PayPal capture & webhook
    Route::match(['get', 'post'], '/paypal/capture', 'capturePayPal');
    Route::post('/paypal/webhook', 'paypalWebhook');
});
