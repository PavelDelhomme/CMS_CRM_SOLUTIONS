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
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('preview_url')->nullable();
            
            // Structure du template
            $table->json('structure')->nullable(); // Header, sections, footer
            $table->json('default_settings')->nullable();
            
            // Catégorie & Type
            $table->enum('category', ['modern', 'classic', 'minimal', 'luxury'])->default('modern');
            $table->boolean('is_premium')->default(false);
            $table->decimal('price', 10, 2)->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0);
            
            $table->timestamps();
        });

        // Table pour lier tenants et templates
        Schema::create('tenant_template', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->json('customizations')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['tenant_id', 'template_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_template');
        Schema::dropIfExists('templates');
    }
};

