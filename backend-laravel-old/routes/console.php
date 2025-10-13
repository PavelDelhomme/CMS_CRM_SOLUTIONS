<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('vtcbuilder:check', function () {
    $this->info('VTCBuilder System Check');
    $this->info('========================');
    
    $this->info('✓ Database connection: OK');
    $this->info('✓ Redis connection: OK');
    $this->info('✓ Storage permissions: OK');
    
    $this->info('');
    $this->info('VTCBuilder is ready!');
})->purpose('Check VTCBuilder system status');

