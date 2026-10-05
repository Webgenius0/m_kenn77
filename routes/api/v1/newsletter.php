<?php

use App\Http\Controllers\API\Newsletter\NewsletterApiController;
use Illuminate\Support\Facades\Route;

Route::controller(NewsletterApiController::class)->prefix('newsletter')->group(function () {
    // Public endpoint – subscribe an email
    Route::post('/subscribe', 'store');
});
