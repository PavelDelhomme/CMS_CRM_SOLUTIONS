<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'domain',
        'database',
        'plan',
        'status',
        'settings',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'settings' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the custom columns for the tenant.
     *
     * @return array<string, string>
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'email',
            'domain',
            'database',
            'plan',
            'status',
            'settings',
            'metadata',
        ];
    }

    /**
     * Check if tenant is active.
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if tenant is suspended.
     *
     * @return bool
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * Get the database name for the tenant.
     *
     * @return string
     */
    public function getDatabaseName(): string
    {
        return $this->database ?? config('tenancy.database.prefix') . $this->id;
    }

    /**
     * Relationships
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function pages()
    {
        return $this->hasMany(Page::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }

    public function templates()
    {
        return $this->belongsToMany(Template::class, 'tenant_template')
            ->withPivot('customizations', 'is_active')
            ->withTimestamps();
    }

    public function activeTemplate()
    {
        return $this->templates()->wherePivot('is_active', true)->first();
    }
}

