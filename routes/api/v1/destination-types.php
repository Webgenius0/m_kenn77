<?php

use App\Http\Controllers\API\DestinationType\DestinationTypeApiController;
use Illuminate\Support\Facades\Route;

Route::controller(DestinationTypeApiController::class)->prefix('destination-types')->group(function () {
    Route::get('/', 'index');
    Route::get('/{slug}', 'show');
});
