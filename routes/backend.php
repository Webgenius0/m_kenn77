<?php

// use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Web\Backend\ContactController;
use App\Http\Controllers\Web\Backend\AboutUsController;
use App\Http\Controllers\Web\Backend\AmenityController;
use App\Http\Controllers\Web\Backend\CouponController;
use App\Http\Controllers\Web\Backend\DashboardController;
use App\Http\Controllers\Web\Backend\DestinationTypeController;
use App\Http\Controllers\Web\Backend\DynamicPageController;
use App\Http\Controllers\Web\Backend\FaqController;
use App\Http\Controllers\Web\Backend\GalleryController;
use App\Http\Controllers\Web\Backend\LogController;
use App\Http\Controllers\Web\Backend\ProfileController;
use App\Http\Controllers\Web\Backend\PropertyController;
use App\Http\Controllers\Web\Backend\RuleController;
use App\Http\Controllers\Web\Backend\QueueController;
use App\Http\Controllers\Web\Backend\SystemSettingsController;
use App\Http\Controllers\Web\Backend\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard.index');

    // Destination type management routes
    Route::get('/destination-types', [DestinationTypeController::class, 'index'])->name('admin.destination-types.index');
    Route::get('/destination-types/create', [DestinationTypeController::class, 'create'])->name('admin.destination-types.create');
    Route::post('/destination-types', [DestinationTypeController::class, 'store'])->name('admin.destination-types.store');
    Route::get('/destination-types/{destinationType}/edit', [DestinationTypeController::class, 'edit'])->name('admin.destination-types.edit');
    Route::put('/destination-types/{destinationType}', [DestinationTypeController::class, 'update'])->name('admin.destination-types.update');
    Route::delete('/destination-types/{destinationType}', [DestinationTypeController::class, 'destroy'])->name('admin.destination-types.destroy');

    // Amenity management routes
    Route::get('/amenities', [AmenityController::class, 'index'])->name('admin.amenities.index');
    Route::get('/amenities/create', [AmenityController::class, 'create'])->name('admin.amenities.create');
    Route::post('/amenities', [AmenityController::class, 'store'])->name('admin.amenities.store');
    Route::get('/amenities/{amenity}/edit', [AmenityController::class, 'edit'])->name('admin.amenities.edit');
    Route::put('/amenities/{amenity}', [AmenityController::class, 'update'])->name('admin.amenities.update');
    Route::delete('/amenities/{amenity}', [AmenityController::class, 'destroy'])->name('admin.amenities.destroy');

    // Rule management routes
    Route::get('/rules', [RuleController::class, 'index'])->name('admin.rules.index');
    Route::get('/rules/create', [RuleController::class, 'create'])->name('admin.rules.create');
    Route::post('/rules', [RuleController::class, 'store'])->name('admin.rules.store');
    Route::get('/rules/{rule}/edit', [RuleController::class, 'edit'])->name('admin.rules.edit');
    Route::put('/rules/{rule}', [RuleController::class, 'update'])->name('admin.rules.update');
    Route::delete('/rules/{rule}', [RuleController::class, 'destroy'])->name('admin.rules.destroy');

    // Property management routes
    Route::get('/properties', [PropertyController::class, 'index'])->name('admin.properties.index');
    Route::get('/properties/create', [PropertyController::class, 'create'])->name('admin.properties.create');
    Route::post('/properties', [PropertyController::class, 'store'])->name('admin.properties.store');
    Route::get('/properties/{property}/edit', [PropertyController::class, 'edit'])->name('admin.properties.edit');
    Route::put('/properties/{property}', [PropertyController::class, 'update'])->name('admin.properties.update');
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy'])->name('admin.properties.destroy');

    // User APIs controller
    Route::get('/users', [UserController::class, 'index'])->name('admin.user.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('admin.users.create');
    Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::get('/user/edit/{id}', [UserController::class, 'edit'])->name('admin.users.edit');
    Route::get('/user/show/{id}', [UserController::class, 'show'])->name('admin.users.show');
    Route::put('/users/{id}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    Route::get('users/{user}/sessions', [UserController::class, 'sessions'])->name('admin.users.sessions');

    // Contact Management routes and controller
    Route::get('/contacts', [ContactController::class, 'index'])->name('admin.contacts.index');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->name('admin.contacts.show');
    Route::put('/contacts/{contact}', [ContactController::class, 'update'])->name('admin.contacts.update');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->name('admin.contacts.destroy');
    Route::get('/contacts/export/csv', [ContactController::class, 'export'])->name('admin.contacts.export');

    // System setting here
    Route::get('/settings/system', [SystemSettingsController::class, 'index'])->name('admin.settings.system.index');
    Route::post('/settings/system/update', [SystemSettingsController::class, 'update'])->name('admin.settings.system.update');

    Route::get('/settings/smtp', [SystemSettingsController::class, 'smtp'])->name('admin.settings.smtp');
    Route::post('/settings/smtp/update', [SystemSettingsController::class, 'updateSmtp'])->name('admin.settings.smtp.update');
    Route::get('/settings/stripe', [SystemSettingsController::class, 'stripe'])->name('admin.settings.stripe');
    Route::post('/settings/stripe/update', [SystemSettingsController::class, 'updateStripe'])->name('admin.settings.stripe.update');

    // profile routes and controller
    Route::get('/profile', [ProfileController::class, 'index'])->name('admin.profile.index');
    Route::put('/profile', [ProfileController::class, 'update'])->name('admin.profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('admin.profile.password.update');

    // Dynamic Pages routes and controller
    Route::get('/page/{slug}', [DynamicPageController::class, 'dynamicPage'])->name('admin.page.index');
    Route::post('/page/update/{slug}', [DynamicPageController::class, 'updatePage'])->name('admin.page.update');

    // About Us content management
    Route::get('/about-us', [AboutUsController::class, 'index'])->name('admin.about-us.index');
    Route::match(['post', 'put'], '/about-us', [AboutUsController::class, 'update'])->name('admin.about-us.update');

    // profile routes and controller
    Route::get('/faq/list', [FaqController::class, 'index'])->name('admin.faq.index');
    Route::get('/faq/create', [FaqController::class, 'create'])->name('admin.faq.create');
    Route::post('/faq/store', [FaqController::class, 'store'])->name('admin.faq.store');
    Route::get('/faq/edit/{id}', [FaqController::class, 'edit'])->name('admin.faq.edit');
    Route::post('/faq/update/{id}', [FaqController::class, 'update'])->name('admin.faq.update');
    Route::delete('/faq/delete/{id}', [FaqController::class, 'destroy'])->name('admin.faq.delete');

    // Gallery management routes and controller
    Route::get('/galleries', [GalleryController::class, 'index'])->name('admin.galleries.index');
    Route::get('/galleries/create', [GalleryController::class, 'create'])->name('admin.galleries.create');
    Route::post('/galleries', [GalleryController::class, 'store'])->name('admin.galleries.store');
    Route::get('/galleries/{gallery}/edit', [GalleryController::class, 'edit'])->name('admin.galleries.edit');
    Route::put('/galleries/{gallery}', [GalleryController::class, 'update'])->name('admin.galleries.update');
    Route::delete('/galleries/{gallery}', [GalleryController::class, 'destroy'])->name('admin.galleries.destroy');

    // Coupon management routes
    Route::get('/coupons', [CouponController::class, 'index'])->name('admin.coupons.index');
    Route::get('/coupons/create', [CouponController::class, 'create'])->name('admin.coupons.create');
    Route::post('/coupons', [CouponController::class, 'store'])->name('admin.coupons.store');
    Route::get('/coupons/{coupon}/edit', [CouponController::class, 'edit'])->name('admin.coupons.edit');
    Route::put('/coupons/{coupon}', [CouponController::class, 'update'])->name('admin.coupons.update');
    Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy'])->name('admin.coupons.destroy');

    // Logs controller
    Route::get('/logs', [LogController::class, 'index'])->name('admin.log.index');
    Route::delete('/logs', [LogController::class, 'clear'])->name('admin.log.clear');

    Route::get('/queues', [QueueController::class, 'index'])->name('admin.queues.index');
    Route::get('/failed-jobs', [QueueController::class, 'failed'])->name('admin.failed-jobs.index');
    Route::post('/failed-jobs/{id}/retry', [QueueController::class, 'retry'])->name('admin.failed-jobs.retry');
    Route::delete('/failed-jobs/{id}', [QueueController::class, 'destroy'])->name('admin.failed-jobs.destroy');
});
