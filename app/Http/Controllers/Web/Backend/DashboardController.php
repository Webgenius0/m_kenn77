<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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
        $now = Carbon::now();
        $today = Carbon::today();
        $todayStr = $today->toDateString();

        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $prevMonthStart = $now->copy()->subMonth()->startOfMonth();
        $prevMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        $prevWeekStart = $now->copy()->subWeek()->startOfWeek();
        $prevWeekEnd = $now->copy()->subWeek()->endOfWeek();

        // 1. Active Bookings Card
        $activeBookingsCount = Booking::whereIn('status', ['confirmed', 'completed'])->count();
        $newBookingsThisWeek = Booking::whereBetween('created_at', [$weekStart, $weekEnd])->count();
        $newBookingsLastWeek = Booking::whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])->count();
        $bookingsGrowth = $newBookingsLastWeek > 0
            ? round((($newBookingsThisWeek - $newBookingsLastWeek) / $newBookingsLastWeek) * 100, 2)
            : ($newBookingsThisWeek > 0 ? 100.0 : 0.0);

        // 2. Active Tenants Card
        $activeTenantsCount = User::where('role', 'user')->count();
        $newTenantsThisMonthCount = User::where('role', 'user')->whereBetween('created_at', [$monthStart, $monthEnd])->count();
        $newTenantsLastMonthCount = User::where('role', 'user')->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])->count();
        $tenantsGrowth = $newTenantsLastMonthCount > 0
            ? round((($newTenantsThisMonthCount - $newTenantsLastMonthCount) / $newTenantsLastMonthCount) * 100, 2)
            : ($newTenantsThisMonthCount > 0 ? 100.0 : 0.0);

        // 3. Monthly Rent / Revenue Card
        $monthlyRevenue = (float) Booking::whereIn('status', ['confirmed', 'completed'])
            ->where(function ($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('created_at', [$monthStart, $monthEnd])
                  ->orWhereBetween('check_in', [$monthStart->toDateString(), $monthEnd->toDateString()]);
            })
            ->sum('total');

        $prevMonthRevenue = (float) Booking::whereIn('status', ['confirmed', 'completed'])
            ->where(function ($q) use ($prevMonthStart, $prevMonthEnd) {
                $q->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])
                  ->orWhereBetween('check_in', [$prevMonthStart->toDateString(), $prevMonthEnd->toDateString()]);
            })
            ->sum('total');

        $revenueGrowth = $prevMonthRevenue > 0
            ? round((($monthlyRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100, 2)
            : ($monthlyRevenue > 0 ? 100.0 : 0.0);

        // 4. Property Overview Card
        $totalProperties = Property::where('is_active', true)->count();
        $occupiedUnits = Property::query()
            ->where('is_active', true)
            ->whereHas('bookings', function ($q) use ($todayStr) {
                $q->whereIn('status', ['confirmed', 'completed'])
                    ->whereDate('check_in', '<=', $todayStr)
                    ->whereDate('check_out', '>=', $todayStr);
            })
            ->count();
        $vacantUnits = max(0, $totalProperties - $occupiedUnits);
        $todaysSales = Booking::whereIn('status', ['confirmed', 'completed', 'pending'])
            ->whereDate('created_at', $todayStr)
            ->count();
        $occupancyRate = $totalProperties > 0 ? round(($occupiedUnits / $totalProperties) * 100) : 0;

        // 5. Top Property This Month
        $topPropertyModel = Property::query()
            ->where('is_active', true)
            ->with(['images' => fn ($query) => $query->where('is_primary', true)->limit(1)])
            ->withSum(['bookings' => fn ($query) => $query->whereIn('status', ['confirmed', 'completed'])
                ->where(function ($b) use ($monthStart, $monthEnd) {
                    $b->whereBetween('check_in', [$monthStart->toDateString(), $monthEnd->toDateString()])
                      ->orWhereBetween('created_at', [$monthStart, $monthEnd]);
                })
            ], 'total')
            ->orderByDesc('bookings_sum_total')
            ->first();

        $topProperty = null;
        if ($topPropertyModel) {
            $topProperty = [
                'id' => $topPropertyModel->id,
                'name' => $topPropertyModel->title ?: $topPropertyModel->name,
                'image' => $topPropertyModel->images->first()?->image_path,
                'revenue' => (float) ($topPropertyModel->bookings_sum_total ?? 0),
                'location' => $topPropertyModel->location,
            ];
        }

        // 6. New Tenants (users with role 'user')
        $newTenants = User::query()
            ->where('role', 'user')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->latest()
            ->get(['id', 'name', 'avatar', 'created_at']);

        $displayTenants = $newTenants->isNotEmpty()
            ? $newTenants
            : User::query()->where('role', 'user')->latest()->limit(5)->get(['id', 'name', 'avatar', 'created_at']);

        // 7. Featured Properties List
        $featuredPropertiesQuery = Property::query()
            ->where('is_active', true)
            ->where('is_featured', true);

        if (! (clone $featuredPropertiesQuery)->exists()) {
            $featuredPropertiesQuery = Property::query()->where('is_active', true);
        }

        $featuredProperties = $featuredPropertiesQuery
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

        // 8. Bookings Timeline Items
        $palette = ['#6258cc', '#13c296', '#3b82f6', '#ffab56', '#8b5cf6', '#e83e8c'];
        $timelineProperties = Property::query()
            ->where('is_active', true)
            ->with(['bookings' => function ($q) {
                $q->whereIn('status', ['confirmed', 'completed', 'pending'])
                    ->with('user:id,name')
                    ->orderBy('check_in');
            }])
            ->limit(6)
            ->get(['id', 'name', 'title']);

        $timelineItems = $timelineProperties->map(function ($property, $index) use ($palette) {
            $color = $palette[$index % count($palette)];
            return [
                'label' => $property->name ?: ($property->title ?: 'Property #' . $property->id),
                'color' => $color,
                'ranges' => $property->bookings->map(function ($booking) use ($property, $color) {
                    return [
                        'start' => $booking->check_in?->format('Y-m-d') ?? (string) $booking->check_in,
                        'end' => $booking->check_out?->format('Y-m-d') ?? (string) $booking->check_out,
                        'color' => $color,
                        'booking' => [
                            'bookingId' => $booking->booking_number ?: ('#BK-' . $booking->id),
                            'guest' => $booking->guest_name ?: $booking->user?->name ?: 'Guest',
                            'property' => $property->title ?: $property->name,
                            'status' => ucfirst($booking->status),
                            'amount' => '$' . number_format((float) $booking->total, 2),
                        ],
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        return Inertia::render('backend/dashboard/index', [
            'metrics' => [
                'activeBookings' => [
                    'count' => $activeBookingsCount,
                    'thisWeekCount' => $newBookingsThisWeek,
                    'growthRate' => $bookingsGrowth,
                    'isPositive' => $bookingsGrowth >= 0,
                ],
                'activeTenants' => [
                    'count' => $activeTenantsCount,
                    'thisMonthCount' => $newTenantsThisMonthCount,
                    'growthRate' => $tenantsGrowth,
                    'isPositive' => $tenantsGrowth >= 0,
                ],
                'monthlyRent' => [
                    'amount' => $monthlyRevenue,
                    'growthRate' => $revenueGrowth,
                    'isPositive' => $revenueGrowth >= 0,
                ],
                'propertyOverview' => [
                    'occupiedUnits' => $occupiedUnits,
                    'vacantUnits' => $vacantUnits,
                    'todaysSales' => $todaysSales,
                    'occupancyRate' => $occupancyRate,
                ],
            ],
            'topProperty' => $topProperty,
            'newTenants' => [
                'count' => $newTenants->count(),
                'growthRate' => $tenantsGrowth,
                'isPositive' => $tenantsGrowth >= 0,
                'users' => $displayTenants,
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
            'timelineItems' => $timelineItems,
        ]);
    }
}
