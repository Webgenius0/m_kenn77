<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function home(Request $request)
    {
        return redirect()->route('admin.dashboard.index');
    }

    public function index(Request $request)
    {
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $newTenants = User::query()
            ->where('role', 'user')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->latest()
            ->get(['id', 'name', 'avatar', 'created_at']);

        $featuredProperties = Property::query()
            ->where('is_featured', true)
            ->where('is_active', true)
            ->with(['images' => fn ($query) => $query->where('is_primary', true)->limit(1)])
            ->withCount(['bookings' => fn ($query) => $query->whereBetween('check_in', [
                $monthStart->toDateString(),
                $monthEnd->toDateString(),
            ])])
            ->withSum(['bookings' => fn ($query) => $query->whereBetween('check_in', [
                $monthStart->toDateString(),
                $monthEnd->toDateString(),
            ])], 'total')
            ->orderByDesc('bookings_count')
            ->limit(6)
            ->get(['id', 'name', 'title', 'location', 'price_per_night']);

        return Inertia::render('backend/dashboard/index', [
            'newTenants' => [
                'count' => $newTenants->count(),
                'users' => $newTenants,
            ],
            'featuredProperties' => $featuredProperties->map(fn ($property) => [
                'id' => $property->id,
                'name' => $property->title ?: $property->name,
                'location' => $property->location,
                'image' => $property->images->first()?->image_path,
                'bookings_count' => $property->bookings_count,
                'revenue' => (float) ($property->bookings_sum_total ?? 0),
                'price_per_night' => (float) ($property->price_per_night ?? 0),
            ]),
        ]);
    }
}
