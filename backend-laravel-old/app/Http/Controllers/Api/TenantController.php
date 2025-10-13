<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $tenants = Tenant::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->plan, function ($query, $plan) {
                $query->where('plan', $plan);
            })
            ->with('users')
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenants',
            'domain' => 'nullable|string|unique:tenants',
            'subdomain' => 'nullable|string|unique:tenants',
            'plan' => 'required|in:starter,business,enterprise',
            'primary_color' => 'nullable|string',
            'secondary_color' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['database'] = 'tenant_' . Str::slug($validated['name']);
        $validated['status'] = 'trial';
        $validated['trial_ends_at'] = now()->addDays(14);

        $tenant = Tenant::create($validated);

        return response()->json([
            'tenant' => $tenant,
            'message' => 'Tenant créé avec succès',
        ], 201);
    }

    public function show(Tenant $tenant)
    {
        return response()->json([
            'tenant' => $tenant->load(['users', 'pages', 'services', 'bookings']),
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:tenants,email,' . $tenant->id,
            'domain' => 'sometimes|nullable|string|unique:tenants,domain,' . $tenant->id,
            'subdomain' => 'sometimes|nullable|string|unique:tenants,subdomain,' . $tenant->id,
            'plan' => 'sometimes|in:starter,business,enterprise',
            'status' => 'sometimes|in:active,suspended,trial,cancelled',
            'settings' => 'sometimes|array',
            'primary_color' => 'sometimes|string',
            'secondary_color' => 'sometimes|string',
        ]);

        $tenant->update($validated);

        return response()->json([
            'tenant' => $tenant->fresh(),
            'message' => 'Tenant mis à jour avec succès',
        ]);
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();

        return response()->json([
            'message' => 'Tenant supprimé avec succès',
        ]);
    }

    public function suspend(Tenant $tenant)
    {
        $tenant->update(['status' => 'suspended']);

        return response()->json([
            'tenant' => $tenant->fresh(),
            'message' => 'Tenant suspendu',
        ]);
    }

    public function activate(Tenant $tenant)
    {
        $tenant->update([
            'status' => 'active',
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'tenant' => $tenant->fresh(),
            'message' => 'Tenant activé',
        ]);
    }
}

