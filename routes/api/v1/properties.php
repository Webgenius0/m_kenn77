<?php

use App\Http\Controllers\API\Property\PropertyApiController;
use Illuminate\Support\Facades\Route;

Route::controller(PropertyApiController::class)->prefix('properties')->group(function () {
    Route::get('/', 'index');
    Route::get('/featured', 'featuredProperties');
    Route::get('/{slug}', 'show');
});
