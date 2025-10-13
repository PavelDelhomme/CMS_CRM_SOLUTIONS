<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Statistiques globales
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::where('status', 'active')->count(),
            'trial_tenants' => Tenant::where('status', 'trial')->count(),
            'total_users' => User::count(),
            'total_bookings' => Booking::count(),
            'monthly_revenue' => $this->calculateMonthlyRevenue(),
        ];

        // Tenants récents
        $recent_tenants = Tenant::with('users')
            ->latest()
            ->limit(5)
            ->get();

        // Distribution par plan
        $plan_distribution = Tenant::select('plan', DB::raw('count(*) as count'))
            ->groupBy('plan')
            ->get();

        // Revenus par mois (6 derniers mois)
        $monthly_stats = $this->getMonthlyStats();

        return response()->json([
            'stats' => $stats,
            'recent_tenants' => $recent_tenants,
            'plan_distribution' => $plan_distribution,
            'monthly_stats' => $monthly_stats,
        ]);
    }

    private function calculateMonthlyRevenue()
    {
        $plans = [
            'starter' => 29,
            'business' => 49,
            'enterprise' => 99,
        ];

        $revenue = 0;
        foreach ($plans as $plan => $price) {
            $count = Tenant::where('plan', $plan)
                ->where('status', 'active')
                ->count();
            $revenue += $count * $price;
        }

        return $revenue;
    }

    private function getMonthlyStats()
    {
        $stats = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $month = $date->format('Y-m');
            
            $stats[] = [
                'month' => $date->format('M Y'),
                'tenants' => Tenant::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
                'revenue' => $this->calculateRevenueForMonth($date),
            ];
        }

        return $stats;
    }

    private function calculateRevenueForMonth($date)
    {
        $plans = [
            'starter' => 29,
            'business' => 49,
            'enterprise' => 99,
        ];

        $revenue = 0;
        foreach ($plans as $plan => $price) {
            $count = Tenant::where('plan', $plan)
                ->where('status', 'active')
                ->where('subscribed_at', '<=', $date->endOfMonth())
                ->count();
            $revenue += $count * $price;
        }

        return $revenue;
    }
}

