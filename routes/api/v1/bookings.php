<?php

use App\Http\Controllers\API\Booking\BookingApiController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('booking')->controller(BookingApiController::class)->group(function () {
    Route::post('/', 'store');
    Route::get('/my-bookings', 'userBookings');
    Route::get('/{bookingNumber}', 'show');
});
