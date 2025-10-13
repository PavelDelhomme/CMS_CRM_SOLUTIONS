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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('image')->nullable();
            
            // Tarification
            $table->decimal('base_price', 10, 2)->nullable();
            $table->decimal('price_per_km', 10, 2)->nullable();
            $table->decimal('price_per_minute', 10, 2)->nullable();
            $table->integer('min_price')->nullable();
            
            // Caractéristiques
            $table->integer('max_passengers')->default(4);
            $table->integer('max_luggage')->default(2);
            $table->json('features')->nullable(); // wifi, climatisation, etc.
            
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['tenant_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};

