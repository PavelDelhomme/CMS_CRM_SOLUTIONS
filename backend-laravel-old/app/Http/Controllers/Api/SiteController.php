<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteGeneratorService;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function generate(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json([
                'message' => 'Tenant non trouvé'
            ], 404);
        }

        try {
            $generator = new SiteGeneratorService($tenant);
            $outputPath = $generator->generate();
            $siteUrl = $generator->getSiteUrl();

            return response()->json([
                'message' => 'Site généré avec succès',
                'output_path' => $outputPath,
                'site_url' => $siteUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    public function publish(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json([
                'message' => 'Tenant non trouvé'
            ], 404);
        }

        try {
            $generator = new SiteGeneratorService($tenant);
            $generator->generate();
            $published = $generator->publish();

            if ($published) {
                return response()->json([
                    'message' => 'Site publié avec succès',
                    'site_url' => $generator->getSiteUrl(),
                ]);
            } else {
                throw new \Exception('Échec de la publication');
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la publication: ' . $e->getMessage()
            ], 500);
        }
    }

    public function preview(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json([
                'message' => 'Tenant non trouvé'
            ], 404);
        }

        try {
            $generator = new SiteGeneratorService($tenant);
            $outputPath = $generator->generate();

            // Retourner le chemin du preview
            return response()->json([
                'preview_url' => "/preview/{$tenant->slug}",
                'message' => 'Preview généré avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la génération du preview: ' . $e->getMessage()
            ], 500);
        }
    }
}

