<?php

use App\Http\Controllers\Web\Backend\DashboardController;
use App\Http\Controllers\Web\Frontend\PageController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Artisan;

// Route::inertia('/', 'welcome')->name('home');
Route::get('/', [DashboardController::class, 'home'])->name('home');

Route::get('/privacy-policy', [PageController::class, 'privacyPolicy'])->name('frontend.privacy.policy');
Route::get('/terms-and-conditions', [PageController::class, 'termsAndConditions'])->name('frontend.terms.conditions');
Route::get('/logout', [PageController::class, 'logout'])->name('frontend.terms.logout');

require __DIR__ . '/backend.php';
require __DIR__ . '/settings.php';

Route::get('/run-npm-build', function () {
    $result = Process::path(base_path())->run('npm run build');

    return response()->json([
        'successful' => $result->successful(),
        'output' => $result->output(),
        'error' => $result->errorOutput(),
    ]);
});

Route::get('/run-migrate', function () {
    // Run the database migration
    Artisan::call('migrate');
    return 'Database migration successfully!';
});
// Run Migrate Fresh Route
Route::get('/run-migrate-fresh', function () {
    // Run the database migration
    Artisan::call('migrate:fresh');
    return 'Database migration fresh successfully!';
});
// Run Seeder Route
Route::get('/run-seed', function () {
    // Run the database seeding
    Artisan::call('db:seed');
    return 'Database seeding completed successfully!';
});
