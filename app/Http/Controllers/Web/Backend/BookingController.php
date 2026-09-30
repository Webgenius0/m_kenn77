<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    /**
     * Display a listing of all bookings.
     */
    public function index(Request $request)
    {
        $query = Booking::with(['property', 'user', 'payment'])
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_number', 'like', "%{$search}%")
                    ->orWhere('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('check_in', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('check_out', '<=', $request->date_to);
        }

        $bookings = $query->paginate(15)->withQueryString();

        // Statistics
        $stats = [
            'total'     => Booking::count(),
            'pending'   => Booking::where('status', 'pending')->count(),
            'confirmed' => Booking::where('status', 'confirmed')->count(),
            'cancelled' => Booking::where('status', 'cancelled')->count(),
            'completed' => Booking::where('status', 'completed')->count(),
            'revenue'   => (float) Booking::whereIn('status', ['confirmed', 'completed'])->sum('total'),
            'this_month_revenue' => (float) Booking::whereIn('status', ['confirmed', 'completed'])
                ->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
                ->sum('total'),
        ];

        return Inertia::render('backend/bookings/index', [
            'bookings' => $bookings,
            'stats'    => $stats,
            'filters'  => $request->only(['status', 'search', 'property_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display the specified booking.
     */
    public function show(Booking $booking)
    {
        $booking->load(['property.images', 'property.destinationType', 'user', 'payments', 'coupon']);

        return Inertia::render('backend/bookings/show', [
            'booking' => $booking,
        ]);
    }

    /**
     * Update the booking status.
     */
    public function updateStatus(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,confirmed,cancelled,completed,refunded'],
        ]);

        $booking->update(['status' => $validated['status']]);

        return back()->with('success', 'Booking status updated successfully.');
    }

    /**
     * Delete a booking.
     */
    public function destroy(Booking $booking)
    {
        $booking->delete();

        return redirect()->route('admin.bookings.index')->with('success', 'Booking deleted successfully.');
    }
}
