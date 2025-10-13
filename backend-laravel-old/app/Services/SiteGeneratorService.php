<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\Template;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class SiteGeneratorService
{
    protected $tenant;
    protected $template;
    protected $customizations;

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
        $this->template = $tenant->activeTemplate();
        $this->customizations = $tenant->templates()
            ->wherePivot('is_active', true)
            ->first()?->pivot->customizations ?? [];
    }

    /**
     * Générer le site complet du tenant
     */
    public function generate(): string
    {
        if (!$this->template) {
            throw new \Exception('Aucun template actif pour ce tenant');
        }

        // Créer le dossier de sortie
        $outputPath = $this->getOutputPath();
        $this->ensureDirectoryExists($outputPath);

        // Copier les fichiers du template
        $this->copyTemplateFiles($outputPath);

        // Remplacer les variables
        $this->replaceVariables($outputPath);

        // Générer les pages personnalisées
        $this->generatePages($outputPath);

        // Générer le fichier de configuration
        $this->generateConfig($outputPath);

        return $outputPath;
    }

    /**
     * Obtenir le chemin de sortie
     */
    protected function getOutputPath(): string
    {
        return storage_path("app/sites/{$this->tenant->slug}");
    }

    /**
     * S'assurer que le dossier existe
     */
    protected function ensureDirectoryExists(string $path): void
    {
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
    }

    /**
     * Copier les fichiers du template
     */
    protected function copyTemplateFiles(string $outputPath): void
    {
        $templatePath = base_path("public-site/templates/{$this->template->slug}");
        
        if (!File::exists($templatePath)) {
            throw new \Exception("Template directory not found: {$templatePath}");
        }

        File::copyDirectory($templatePath, $outputPath);
    }

    /**
     * Remplacer les variables dans les fichiers
     */
    protected function replaceVariables(string $outputPath): void
    {
        $variables = $this->getTemplateVariables();

        // Fichiers à traiter
        $files = ['index.html', 'style.css', 'script.js'];

        foreach ($files as $file) {
            $filePath = "$outputPath/$file";
            
            if (File::exists($filePath)) {
                $content = File::get($filePath);
                
                foreach ($variables as $key => $value) {
                    $content = str_replace("{{" . $key . "}}", $value, $content);
                }
                
                File::put($filePath, $content);
            }
        }
    }

    /**
     * Obtenir les variables du template
     */
    protected function getTemplateVariables(): array
    {
        $settings = $this->tenant->settings ?? [];
        $customizations = json_decode($this->customizations, true) ?? [];

        return [
            // Site Info
            'site_name' => $this->tenant->name,
            'site_description' => $settings['description'] ?? 'Service VTC professionnel',
            'logo_url' => $this->tenant->logo ?? '/assets/logo-default.png',
            
            // Colors
            'primary_color' => $customizations['primary_color'] ?? $this->tenant->primary_color,
            'secondary_color' => $customizations['secondary_color'] ?? $this->tenant->secondary_color,
            
            // Contact
            'phone' => $settings['phone'] ?? '',
            'email' => $this->tenant->email,
            'address' => $settings['address'] ?? '',
            
            // Hero
            'hero_title' => $customizations['hero_title'] ?? 'Votre Service VTC de Confiance',
            'hero_subtitle' => $customizations['hero_subtitle'] ?? 'Transport premium à Paris et Île-de-France',
            
            // Other
            'current_year' => date('Y'),
        ];
    }

    /**
     * Générer les pages personnalisées
     */
    protected function generatePages(string $outputPath): void
    {
        $pages = $this->tenant->pages()->published()->get();

        foreach ($pages as $page) {
            $pageHtml = $this->generatePageHtml($page);
            $filename = $page->is_homepage ? 'index.html' : "{$page->slug}.html";
            File::put("$outputPath/$filename", $pageHtml);
        }
    }

    /**
     * Générer le HTML d'une page
     */
    protected function generatePageHtml($page): string
    {
        $template = File::get($this->getOutputPath() . '/index.html');
        
        // Remplacer le contenu principal
        $content = $page->content ?? '';
        $template = preg_replace(
            '/<main[^>]*>.*?<\/main>/s',
            "<main class=\"page-content\">$content</main>",
            $template
        );

        // Remplacer le title et meta
        $template = str_replace(
            '<title>{{site_name}} - Service VTC Premium</title>',
            "<title>{$page->meta_title}</title>",
            $template
        );

        $template = str_replace(
            '<meta name="description" content="{{site_description}}">',
            "<meta name=\"description\" content=\"{$page->meta_description}\">",
            $template
        );

        return $template;
    }

    /**
     * Générer le fichier de configuration
     */
    protected function generateConfig(string $outputPath): void
    {
        $config = [
            'tenant_id' => $this->tenant->id,
            'tenant_slug' => $this->tenant->slug,
            'template' => $this->template->slug,
            'generated_at' => now()->toIso8601String(),
            'domain' => $this->tenant->domain,
            'subdomain' => $this->tenant->subdomain,
        ];

        File::put(
            "$outputPath/config.json",
            json_encode($config, JSON_PRETTY_PRINT)
        );
    }

    /**
     * Obtenir l'URL publique du site généré
     */
    public function getSiteUrl(): string
    {
        if ($this->tenant->domain) {
            return "https://{$this->tenant->domain}";
        }

        if ($this->tenant->subdomain) {
            $baseDomain = config('app.domain', 'vtcbuilder.com');
            return "https://{$this->tenant->subdomain}.{$baseDomain}";
        }

        return '';
    }

    /**
     * Publier le site (déploiement)
     */
    public function publish(): bool
    {
        // TODO: Implémenter le déploiement réel
        // - Upload vers serveur de production
        // - Configuration DNS
        // - Activation SSL

        return true;
    }
}

