<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'thumbnail',
        'preview_url',
        'structure',
        'default_settings',
        'category',
        'is_premium',
        'price',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'structure' => 'array',
        'default_settings' => 'array',
        'is_premium' => 'boolean',
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function tenants()
    {
        return $this->belongsToMany(Tenant::class, 'tenant_template')
            ->withPivot('customizations', 'is_active')
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFree($query)
    {
        return $query->where('is_premium', false);
    }

    public function scopePremium($query)
    {
        return $query->where('is_premium', true);
    }
}

