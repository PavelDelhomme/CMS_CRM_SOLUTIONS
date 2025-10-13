<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::where('tenant_id', $request->user()->tenant_id)
            ->when($request->is_active !== null, function ($query) use ($request) {
                $query->where('is_active', $request->is_active);
            })
            ->orderBy('order')
            ->get();

        return response()->json($services);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'image' => 'nullable|string',
            'base_price' => 'nullable|numeric|min:0',
            'price_per_km' => 'nullable|numeric|min:0',
            'price_per_minute' => 'nullable|numeric|min:0',
            'min_price' => 'nullable|numeric|min:0',
            'max_passengers' => 'nullable|integer|min:1',
            'max_luggage' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $validated['tenant_id'] = $request->user()->tenant_id;
        $validated['slug'] = Str::slug($validated['name']);

        $service = Service::create($validated);

        return response()->json([
            'service' => $service,
            'message' => 'Service créé avec succès',
        ], 201);
    }

    public function show(Request $request, Service $service)
    {
        if ($service->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json(['service' => $service]);
    }

    public function update(Request $request, Service $service)
    {
        if ($service->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'image' => 'nullable|string',
            'base_price' => 'nullable|numeric|min:0',
            'price_per_km' => 'nullable|numeric|min:0',
            'price_per_minute' => 'nullable|numeric|min:0',
            'min_price' => 'nullable|numeric|min:0',
            'max_passengers' => 'nullable|integer|min:1',
            'max_luggage' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
            'order' => 'sometimes|integer',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $service->update($validated);

        return response()->json([
            'service' => $service->fresh(),
            'message' => 'Service mis à jour avec succès',
        ]);
    }

    public function destroy(Request $request, Service $service)
    {
        if ($service->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $service->delete();

        return response()->json([
            'message' => 'Service supprimé avec succès',
        ]);
    }

    public function toggle(Request $request, Service $service)
    {
        if ($service->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $service->update(['is_active' => !$service->is_active]);

        return response()->json([
            'service' => $service->fresh(),
            'message' => $service->is_active ? 'Service activé' : 'Service désactivé',
        ]);
    }
}

