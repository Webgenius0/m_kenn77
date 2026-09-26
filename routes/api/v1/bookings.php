<?php

use App\Http\Controllers\API\Booking\BookingApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('bookings')->controller(BookingApiController::class)->group(function () {
    Route::post('/calculate', 'calculate');
    Route::post('/', 'store');
    Route::get('/user', 'userBookings')->middleware('auth:sanctum');
    Route::get('/{bookingNumber}', 'show');
});
