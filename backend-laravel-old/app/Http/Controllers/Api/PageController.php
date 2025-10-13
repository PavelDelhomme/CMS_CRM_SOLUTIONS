<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function index(Request $request)
    {
        $pages = Page::where('tenant_id', $request->user()->tenant_id)
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('order')
            ->get();

        return response()->json($pages);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Page::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'blocks' => 'nullable|array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'status' => 'required|in:draft,published,scheduled',
            'published_at' => 'nullable|date',
            'is_homepage' => 'boolean',
        ]);

        $validated['tenant_id'] = $request->user()->tenant_id;
        $validated['slug'] = Str::slug($validated['title']);

        // Si cette page devient la homepage, retirer le flag des autres
        if ($validated['is_homepage'] ?? false) {
            Page::where('tenant_id', $validated['tenant_id'])
                ->update(['is_homepage' => false]);
        }

        $page = Page::create($validated);

        return response()->json([
            'page' => $page,
            'message' => 'Page créée avec succès',
        ], 201);
    }

    public function show(Request $request, Page $page)
    {
        $this->authorize('view', $page);

        return response()->json(['page' => $page]);
    }

    public function update(Request $request, Page $page)
    {
        $this->authorize('update', $page);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'blocks' => 'nullable|array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'status' => 'sometimes|in:draft,published,scheduled',
            'published_at' => 'nullable|date',
            'is_homepage' => 'sometimes|boolean',
            'order' => 'sometimes|integer',
        ]);

        if (isset($validated['title'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        if ($validated['is_homepage'] ?? false) {
            Page::where('tenant_id', $page->tenant_id)
                ->where('id', '!=', $page->id)
                ->update(['is_homepage' => false]);
        }

        $page->update($validated);

        return response()->json([
            'page' => $page->fresh(),
            'message' => 'Page mise à jour avec succès',
        ]);
    }

    public function destroy(Request $request, Page $page)
    {
        $this->authorize('delete', $page);

        $page->delete();

        return response()->json([
            'message' => 'Page supprimée avec succès',
        ]);
    }

    public function publish(Request $request, Page $page)
    {
        $this->authorize('update', $page);

        $page->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'page' => $page->fresh(),
            'message' => 'Page publiée avec succès',
        ]);
    }

    public function duplicate(Request $request, Page $page)
    {
        $this->authorize('create', Page::class);

        $newPage = $page->replicate();
        $newPage->title = $page->title . ' (Copie)';
        $newPage->slug = Str::slug($newPage->title);
        $newPage->status = 'draft';
        $newPage->is_homepage = false;
        $newPage->published_at = null;
        $newPage->save();

        return response()->json([
            'page' => $newPage,
            'message' => 'Page dupliquée avec succès',
        ], 201);
    }
}

