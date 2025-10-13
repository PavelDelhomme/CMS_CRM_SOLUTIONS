<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained()->onDelete('set null');
            
            // Informations client
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            
            // Trajet
            $table->string('pickup_address');
            $table->string('pickup_lat')->nullable();
            $table->string('pickup_lng')->nullable();
            $table->string('dropoff_address');
            $table->string('dropoff_lat')->nullable();
            $table->string('dropoff_lng')->nullable();
            
            // Date & Heure
            $table->dateTime('pickup_datetime');
            $table->integer('estimated_duration')->nullable(); // en minutes
            $table->decimal('estimated_distance', 10, 2)->nullable(); // en km
            
            // Tarification
            $table->decimal('estimated_price', 10, 2);
            $table->decimal('final_price', 10, 2)->nullable();
            $table->string('currency')->default('EUR');
            
            // Paiement
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('stripe_payment_id')->nullable();
            
            // Statut réservation
            $table->enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

