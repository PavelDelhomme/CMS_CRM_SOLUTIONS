<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'dropoff_address',
        'dropoff_lat',
        'dropoff_lng',
        'pickup_datetime',
        'estimated_duration',
        'estimated_distance',
        'estimated_price',
        'final_price',
        'currency',
        'payment_status',
        'payment_method',
        'stripe_payment_id',
        'status',
        'notes',
        'cancellation_reason',
    ];

    protected $casts = [
        'pickup_datetime' => 'datetime',
        'estimated_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'estimated_distance' => 'decimal:2',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}

