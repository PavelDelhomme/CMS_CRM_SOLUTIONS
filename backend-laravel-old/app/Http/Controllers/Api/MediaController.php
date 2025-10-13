<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $media = Media::where('tenant_id', $request->user()->tenant_id)
            ->when($request->collection, function ($query, $collection) {
                $query->where('collection', $collection);
            })
            ->orderBy('order')
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($media);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'collection' => 'nullable|string',
            'alt_text' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('media/' . $request->user()->tenant_id, $filename, 'public');

        $media = Media::create([
            'tenant_id' => $request->user()->tenant_id,
            'user_id' => $request->user()->id,
            'name' => $file->getClientOriginalName(),
            'file_name' => $filename,
            'mime_type' => $file->getMimeType(),
            'path' => $path,
            'disk' => 'public',
            'size' => $file->getSize(),
            'collection' => $request->collection,
            'alt_text' => $request->alt_text,
        ]);

        return response()->json([
            'media' => $media,
            'url' => Storage::disk('public')->url($path),
            'message' => 'Fichier uploadé avec succès',
        ], 201);
    }

    public function show(Request $request, Media $media)
    {
        if ($media->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json([
            'media' => $media,
            'url' => Storage::disk($media->disk)->url($media->path),
        ]);
    }

    public function update(Request $request, Media $media)
    {
        if ($media->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'collection' => 'sometimes|nullable|string',
            'alt_text' => 'sometimes|nullable|string',
            'order' => 'sometimes|integer',
        ]);

        $media->update($validated);

        return response()->json([
            'media' => $media->fresh(),
            'message' => 'Média mis à jour avec succès',
        ]);
    }

    public function destroy(Request $request, Media $media)
    {
        if ($media->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Supprimer le fichier physique
        Storage::disk($media->disk)->delete($media->path);

        // Supprimer l'enregistrement
        $media->delete();

        return response()->json([
            'message' => 'Média supprimé avec succès',
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:media,id',
        ]);

        $media = Media::whereIn('id', $validated['ids'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->get();

        foreach ($media as $item) {
            Storage::disk($item->disk)->delete($item->path);
            $item->delete();
        }

        return response()->json([
            'message' => count($media) . ' médias supprimés avec succès',
        ]);
    }
}

