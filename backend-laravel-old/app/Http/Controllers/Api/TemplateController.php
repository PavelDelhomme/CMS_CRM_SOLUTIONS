<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        $templates = Template::active()
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->is_premium !== null, function ($query) use ($request) {
                $query->where('is_premium', $request->is_premium);
            })
            ->get();

        return response()->json($templates);
    }

    public function show(Template $template)
    {
        if (!$template->is_active) {
            return response()->json(['message' => 'Template non disponible'], 404);
        }

        return response()->json(['template' => $template]);
    }

    public function apply(Request $request, Template $template)
    {
        $tenantId = $request->user()->tenant_id;

        // Vérifier si le template est premium et si le tenant a accès
        if ($template->is_premium) {
            $tenant = $request->user()->tenant;
            if (!in_array($tenant->plan, ['business', 'enterprise'])) {
                return response()->json([
                    'message' => 'Template premium réservé aux plans Business et Enterprise'
                ], 403);
            }
        }

        // Désactiver les autres templates pour ce tenant
        DB::table('tenant_template')
            ->where('tenant_id', $tenantId)
            ->update(['is_active' => false]);

        // Vérifier si le template est déjà lié
        $exists = DB::table('tenant_template')
            ->where('tenant_id', $tenantId)
            ->where('template_id', $template->id)
            ->exists();

        if ($exists) {
            // Activer le template existant
            DB::table('tenant_template')
                ->where('tenant_id', $tenantId)
                ->where('template_id', $template->id)
                ->update(['is_active' => true]);
        } else {
            // Créer une nouvelle relation
            DB::table('tenant_template')->insert([
                'tenant_id' => $tenantId,
                'template_id' => $template->id,
                'customizations' => json_encode($template->default_settings),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Incrémenter le compteur d'utilisation
            $template->increment('usage_count');
        }

        return response()->json([
            'template' => $template->fresh(),
            'message' => 'Template appliqué avec succès',
        ]);
    }

    public function updateCustomizations(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'customizations' => 'required|array',
            'customizations.primary_color' => 'sometimes|string',
            'customizations.secondary_color' => 'sometimes|string',
            'customizations.font_family' => 'sometimes|string',
            'customizations.logo' => 'sometimes|string',
            'customizations.sections' => 'sometimes|array',
        ]);

        $tenantId = $request->user()->tenant_id;

        DB::table('tenant_template')
            ->where('tenant_id', $tenantId)
            ->where('template_id', $validated['template_id'])
            ->update([
                'customizations' => json_encode($validated['customizations']),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Customisations sauvegardées avec succès',
        ]);
    }
}

