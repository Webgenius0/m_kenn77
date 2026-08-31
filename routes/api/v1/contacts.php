<?php

use App\Http\Controllers\API\Contact\ContactApiController;
use Illuminate\Support\Facades\Route;

Route::controller(ContactApiController::class)->prefix('contacts')->group(function () {
    // Public endpoint - store contact form submission
    Route::post('/', 'store');
});
