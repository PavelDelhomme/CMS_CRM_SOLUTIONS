<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tenant Model
    |--------------------------------------------------------------------------
    |
    | The tenant model that will be used for multi-tenancy.
    |
    */
    'tenant_model' => \App\Models\Tenant::class,

    /*
    |--------------------------------------------------------------------------
    | Tenant Database Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for tenant database connections.
    |
    */
    'database' => [
        'based_on' => null,
        'prefix' => 'tenant_',
        'suffix' => '',
        
        'managers' => [
            'sqlite' => \Stancl\Tenancy\TenantDatabaseManagers\SQLiteDatabaseManager::class,
            'mysql' => \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'pgsql' => \Stancl\Tenancy\TenantDatabaseManagers\PostgreSQLDatabaseManager::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant Domain Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for tenant domains and subdomains.
    |
    */
    'domain' => [
        'enabled' => true,
        'allow_subdomains' => true,
        'central_domains' => explode(',', env('CENTRAL_DOMAINS', 'localhost')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    |
    | Features that can be enabled/disabled for tenants.
    |
    */
    'features' => [
        \Stancl\Tenancy\Features\UserImpersonation::class,
        \Stancl\Tenancy\Features\TelescopeTags::class,
        \Stancl\Tenancy\Features\TenantConfig::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage
    |--------------------------------------------------------------------------
    |
    | Storage configuration for tenant files.
    |
    */
    'storage' => [
        'root_override' => null,
        'suffix_base' => 'tenant',
    ],
];

