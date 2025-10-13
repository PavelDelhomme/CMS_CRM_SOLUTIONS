<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Modern VTC',
                'slug' => 'modern-vtc',
                'description' => 'Template moderne et épuré pour chauffeurs VTC professionnels',
                'category' => 'modern',
                'is_premium' => false,
                'is_active' => true,
                'structure' => json_encode([
                    'header' => ['logo', 'menu', 'cta_button'],
                    'sections' => ['hero', 'services', 'about', 'pricing', 'contact'],
                    'footer' => ['info', 'social', 'legal']
                ]),
                'default_settings' => json_encode([
                    'primary_color' => '#3B82F6',
                    'secondary_color' => '#10B981',
                    'font_family' => 'Inter, sans-serif',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Luxury VTC',
                'slug' => 'luxury-vtc',
                'description' => 'Template premium pour service de luxe',
                'category' => 'luxury',
                'is_premium' => true,
                'price' => 49.00,
                'is_active' => true,
                'structure' => json_encode([
                    'header' => ['logo', 'menu', 'phone', 'booking_button'],
                    'sections' => ['hero_video', 'services', 'fleet', 'testimonials', 'booking', 'contact'],
                    'footer' => ['newsletter', 'info', 'social', 'legal']
                ]),
                'default_settings' => json_encode([
                    'primary_color' => '#1F2937',
                    'secondary_color' => '#D97706',
                    'font_family' => 'Playfair Display, serif',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Classic VTC',
                'slug' => 'classic-vtc',
                'description' => 'Template classique et professionnel',
                'category' => 'classic',
                'is_premium' => false,
                'is_active' => true,
                'structure' => json_encode([
                    'header' => ['logo', 'menu', 'contact_info'],
                    'sections' => ['hero', 'services', 'why_choose', 'pricing', 'contact'],
                    'footer' => ['info', 'social', 'legal']
                ]),
                'default_settings' => json_encode([
                    'primary_color' => '#1E40AF',
                    'secondary_color' => '#059669',
                    'font_family' => 'Roboto, sans-serif',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Minimal VTC',
                'slug' => 'minimal-vtc',
                'description' => 'Design minimaliste et élégant',
                'category' => 'minimal',
                'is_premium' => false,
                'is_active' => true,
                'structure' => json_encode([
                    'header' => ['logo', 'menu'],
                    'sections' => ['hero', 'services', 'about', 'contact'],
                    'footer' => ['info', 'legal']
                ]),
                'default_settings' => json_encode([
                    'primary_color' => '#000000',
                    'secondary_color' => '#6B7280',
                    'font_family' => 'Helvetica, Arial, sans-serif',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('templates')->insert($templates);
    }
}

