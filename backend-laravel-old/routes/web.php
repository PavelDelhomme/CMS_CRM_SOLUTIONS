<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'app' => 'VTCBuilder API',
        'version' => '1.0.0',
        'message' => 'Welcome to VTCBuilder - Le WordPress des chauffeurs VTC',
        'docs' => '/api/documentation',
    ]);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});

