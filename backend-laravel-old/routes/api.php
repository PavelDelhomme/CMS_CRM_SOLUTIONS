<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Admin\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

// Routes publiques pour les réservations (formulaire site web)
Route::post('/bookings/public', [BookingController::class, 'createPublic']);
Route::post('/bookings/estimate', [BookingController::class, 'estimatePrice']);

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // Super Admin Routes
    Route::middleware('role:super-admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::apiResource('tenants', TenantController::class);
        Route::post('/tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
        Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate']);
    });

    // Tenant Admin & User Routes
    Route::middleware('tenant')->group(function () {
        
        // Pages
        Route::apiResource('pages', PageController::class);
        Route::post('/pages/{page}/publish', [PageController::class, 'publish']);
        Route::post('/pages/{page}/duplicate', [PageController::class, 'duplicate']);
        
        // Services VTC
        Route::apiResource('services', ServiceController::class);
        Route::post('/services/{service}/toggle', [ServiceController::class, 'toggle']);
        
        // Réservations
        Route::apiResource('bookings', BookingController::class);
        Route::post('/bookings/{booking}/confirm', [BookingController::class, 'confirm']);
        Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::post('/bookings/{booking}/complete', [BookingController::class, 'complete']);
        
        // Media
        Route::apiResource('media', MediaController::class)->except(['create', 'edit']);
        Route::post('/media/upload', [MediaController::class, 'upload']);
        Route::post('/media/bulk-delete', [MediaController::class, 'bulkDelete']);
        
        // Templates
        Route::get('/templates', [TemplateController::class, 'index']);
        Route::get('/templates/{template}', [TemplateController::class, 'show']);
        Route::post('/templates/{template}/apply', [TemplateController::class, 'apply']);
        Route::put('/templates/customizations', [TemplateController::class, 'updateCustomizations']);
        
        // Site Generation
        Route::post('/site/generate', [SiteController::class, 'generate']);
        Route::post('/site/publish', [SiteController::class, 'publish']);
        Route::get('/site/preview', [SiteController::class, 'preview']);
    });
});

