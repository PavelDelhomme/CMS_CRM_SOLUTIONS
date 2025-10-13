<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
        // Créer un tenant démo
        $tenant = Tenant::create([
            'name' => 'VTC Demo Paris',
            'slug' => 'vtc-demo-paris',
            'email' => 'demo@vtcbuilder.local',
            'subdomain' => 'demo',
            'database' => 'tenant_demo',
            'plan' => 'business',
            'status' => 'active',
            'subscribed_at' => now(),
            'settings' => [
                'company_name' => 'VTC Demo Paris',
                'phone' => '+33 1 23 45 67 89',
                'address' => '123 Avenue des Champs-Élysées, Paris',
                'email' => 'contact@vtcdemo.fr',
            ],
            'primary_color' => '#3B82F6',
            'secondary_color' => '#10B981',
        ]);

        // Créer un utilisateur admin pour ce tenant
        $tenantAdmin = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Jean Dupont',
            'email' => 'jean@vtcdemo.fr',
            'password' => Hash::make('demo123'),
            'phone' => '+33 6 12 34 56 78',
            'company_name' => 'VTC Demo Paris',
            'license_number' => 'VTC-2024-DEMO',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $tenantAdmin->assignRole('tenant-admin');

        // Assigner le template Modern VTC
        DB::table('tenant_template')->insert([
            'tenant_id' => $tenant->id,
            'template_id' => 1, // Modern VTC
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

