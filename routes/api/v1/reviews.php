<?php

use App\Http\Controllers\API\Review\ReviewApiController;
use Illuminate\Support\Facades\Route;

Route::controller(ReviewApiController::class)->prefix('reviews')->group(function () {
    Route::get('/', 'index');
});
