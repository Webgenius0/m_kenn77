<?php

use App\Http\Controllers\API\Coupon\CouponApiController;
use Illuminate\Support\Facades\Route;

Route::controller(CouponApiController::class)->prefix('coupons')->group(function () {
    Route::get('/', 'index');
});
