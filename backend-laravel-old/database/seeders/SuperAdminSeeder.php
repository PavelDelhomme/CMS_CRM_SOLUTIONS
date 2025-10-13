<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => env('SUPER_ADMIN_EMAIL', 'admin@vtcbuilder.local'),
            'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'admin123')),
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $superAdmin->assignRole('super-admin');
    }
}

