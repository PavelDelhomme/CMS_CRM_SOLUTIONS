<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Service;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = Booking::where('tenant_id', $request->user()->tenant_id)
            ->with('service')
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->payment_status, function ($query, $status) {
                $query->where('payment_status', $status);
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json($bookings);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'nullable|exists:services,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
            'pickup_address' => 'required|string',
            'pickup_lat' => 'nullable|string',
            'pickup_lng' => 'nullable|string',
            'dropoff_address' => 'required|string',
            'dropoff_lat' => 'nullable|string',
            'dropoff_lng' => 'nullable|string',
            'pickup_datetime' => 'required|date',
            'estimated_duration' => 'nullable|integer',
            'estimated_distance' => 'nullable|numeric',
            'estimated_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['tenant_id'] = $request->user()->tenant_id;
        $validated['status'] = 'pending';
        $validated['payment_status'] = 'pending';

        $booking = Booking::create($validated);

        return response()->json([
            'booking' => $booking->load('service'),
            'message' => 'Réservation créée avec succès',
        ], 201);
    }

    public function createPublic(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'service_id' => 'nullable|exists:services,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
            'pickup_address' => 'required|string',
            'pickup_lat' => 'nullable|string',
            'pickup_lng' => 'nullable|string',
            'dropoff_address' => 'required|string',
            'dropoff_lat' => 'nullable|string',
            'dropoff_lng' => 'nullable|string',
            'pickup_datetime' => 'required|date',
            'estimated_distance' => 'nullable|numeric',
            'estimated_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = 'pending';
        $validated['payment_status'] = 'pending';

        $booking = Booking::create($validated);

        // TODO: Envoyer email de confirmation

        return response()->json([
            'booking' => $booking,
            'message' => 'Réservation enregistrée avec succès. Vous recevrez une confirmation par email.',
        ], 201);
    }

    public function estimatePrice(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'distance' => 'required|numeric|min:0',
            'duration' => 'nullable|integer|min:0',
        ]);

        $service = Service::find($validated['service_id']);

        $price = $service->base_price ?? 0;
        $price += ($validated['distance'] * ($service->price_per_km ?? 0));
        
        if (isset($validated['duration'])) {
            $price += ($validated['duration'] * ($service->price_per_minute ?? 0));
        }

        $price = max($price, $service->min_price ?? 0);

        return response()->json([
            'estimated_price' => round($price, 2),
            'service' => $service,
            'details' => [
                'base_price' => $service->base_price,
                'distance_cost' => $validated['distance'] * ($service->price_per_km ?? 0),
                'duration_cost' => isset($validated['duration']) ? $validated['duration'] * ($service->price_per_minute ?? 0) : 0,
                'min_price' => $service->min_price,
            ]
        ]);
    }

    public function show(Request $request, Booking $booking)
    {
        if ($booking->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json(['booking' => $booking->load('service')]);
    }

    public function update(Request $request, Booking $booking)
    {
        if ($booking->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'service_id' => 'sometimes|nullable|exists:services,id',
            'customer_name' => 'sometimes|string|max:255',
            'customer_email' => 'sometimes|email',
            'customer_phone' => 'sometimes|string',
            'pickup_address' => 'sometimes|string',
            'dropoff_address' => 'sometimes|string',
            'pickup_datetime' => 'sometimes|date',
            'final_price' => 'sometimes|numeric|min:0',
            'payment_status' => 'sometimes|in:pending,paid,failed,refunded',
            'status' => 'sometimes|in:pending,confirmed,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $booking->update($validated);

        return response()->json([
            'booking' => $booking->fresh()->load('service'),
            'message' => 'Réservation mise à jour avec succès',
        ]);
    }

    public function confirm(Request $request, Booking $booking)
    {
        if ($booking->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $booking->update(['status' => 'confirmed']);

        // TODO: Envoyer email de confirmation

        return response()->json([
            'booking' => $booking->fresh(),
            'message' => 'Réservation confirmée',
        ]);
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'cancellation_reason' => 'required|string',
        ]);

        $booking->update([
            'status' => 'cancelled',
            'cancellation_reason' => $validated['cancellation_reason'],
        ]);

        // TODO: Envoyer email d'annulation

        return response()->json([
            'booking' => $booking->fresh(),
            'message' => 'Réservation annulée',
        ]);
    }

    public function complete(Request $request, Booking $booking)
    {
        if ($booking->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'final_price' => 'sometimes|numeric|min:0',
        ]);

        $booking->update([
            'status' => 'completed',
            'final_price' => $validated['final_price'] ?? $booking->estimated_price,
        ]);

        return response()->json([
            'booking' => $booking->fresh(),
            'message' => 'Réservation terminée',
        ]);
    }
}

