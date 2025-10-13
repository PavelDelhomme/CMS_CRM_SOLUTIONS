<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Créer les permissions
        $permissions = [
            // Tenants
            'view tenants',
            'create tenants',
            'edit tenants',
            'delete tenants',
            
            // Users
            'view users',
            'create users',
            'edit users',
            'delete users',
            
            // Pages
            'view pages',
            'create pages',
            'edit pages',
            'delete pages',
            
            // Services
            'view services',
            'create services',
            'edit services',
            'delete services',
            
            // Bookings
            'view bookings',
            'create bookings',
            'edit bookings',
            'delete bookings',
            
            // Media
            'view media',
            'upload media',
            'delete media',
            
            // Templates
            'view templates',
            'create templates',
            'edit templates',
            'delete templates',
            
            // Settings
            'manage settings',
            'manage billing',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Créer les rôles et assigner les permissions

        // Super Admin (vous)
        $superAdmin = Role::create(['name' => 'super-admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Tenant Admin (chauffeur VTC)
        $tenantAdmin = Role::create(['name' => 'tenant-admin']);
        $tenantAdmin->givePermissionTo([
            'view pages', 'create pages', 'edit pages', 'delete pages',
            'view services', 'create services', 'edit services', 'delete services',
            'view bookings', 'create bookings', 'edit bookings',
            'view media', 'upload media', 'delete media',
            'manage settings',
        ]);

        // Tenant User (employé du chauffeur)
        $tenantUser = Role::create(['name' => 'tenant-user']);
        $tenantUser->givePermissionTo([
            'view pages',
            'view services',
            'view bookings', 'create bookings', 'edit bookings',
            'view media',
        ]);
    }
}

