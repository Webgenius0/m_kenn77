<?php

use App\Http\Controllers\API\Auth\AuthApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::controller(AuthApiController::class)->prefix('auth')->middleware('throttle:auth-api')->group(function () {
    Route::post('register', 'register');
    Route::post('verify/register', 'verifyRegister');
    Route::post('resend-otp/register', 'registerResendOtp');
    Route::post('login', 'login');
    Route::post('social/login', 'socialLogin');
    Route::post('logout', 'logout')->middleware('auth:sanctum');
    Route::post('forgetpass', 'forgotPassword');
    Route::post('verify-email', 'verifyForgetPass');
    Route::post('resend-otp/forget-password', 'forgotPasswordResendOtp');
    Route::post('change-password', 'resetPassword');
});
