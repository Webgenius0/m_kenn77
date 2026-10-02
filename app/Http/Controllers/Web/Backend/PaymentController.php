<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentController extends Controller
{
    /**
     * Display a listing of all payments with metrics and filtering.
     */
    public function index(Request $request)
    {
        $query = Payment::with([
            'booking.property',
            'booking.user',
        ])->latest();

        // Status filter
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'completed') {
                $query->whereIn('status', ['completed', 'paid']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Method filter
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('booking', function ($bq) use ($search) {
                      $bq->where('booking_number', 'like', "%{$search}%")
                         ->orWhere('guest_name', 'like', "%{$search}%")
                         ->orWhere('guest_email', 'like', "%{$search}%");
                  });
            });
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->paginate(15)->withQueryString();

        // Calculate comprehensive financial statistics
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $thisMonthEnd = $now->copy()->endOfMonth();
        $prevMonthStart = $now->copy()->subMonth()->startOfMonth();
        $prevMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $totalCompleted = Payment::whereIn('status', ['completed', 'paid']);
        $totalPending = Payment::where('status', 'pending');
        $totalRefunded = Payment::where('status', 'refunded');
        $totalFailed = Payment::whereIn('status', ['failed', 'cancelled']);

        $thisMonthRevenue = (float) Payment::whereIn('status', ['completed', 'paid'])
            ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
            ->sum('amount');

        $prevMonthRevenue = (float) Payment::whereIn('status', ['completed', 'paid'])
            ->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])
            ->sum('amount');

        $revenueGrowth = $prevMonthRevenue > 0
            ? round((($thisMonthRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100, 1)
            : ($thisMonthRevenue > 0 ? 100.0 : 0.0);

        $stats = [
            'total_count'       => Payment::count(),
            'total_amount'      => (float) Payment::sum('amount'),
            'completed_count'   => (clone $totalCompleted)->count(),
            'completed_amount'  => (float) (clone $totalCompleted)->sum('amount'),
            'pending_count'     => (clone $totalPending)->count(),
            'pending_amount'    => (float) (clone $totalPending)->sum('amount'),
            'refunded_count'    => (clone $totalRefunded)->count(),
            'refunded_amount'   => (float) (clone $totalRefunded)->sum('amount'),
            'failed_count'      => (clone $totalFailed)->count(),
            'failed_amount'     => (float) (clone $totalFailed)->sum('amount'),
            'stripe_count'      => Payment::where('payment_method', 'stripe')->count(),
            'stripe_amount'     => (float) Payment::where('payment_method', 'stripe')->whereIn('status', ['completed', 'paid'])->sum('amount'),
            'paypal_count'      => Payment::where('payment_method', 'paypal')->count(),
            'paypal_amount'     => (float) Payment::where('payment_method', 'paypal')->whereIn('status', ['completed', 'paid'])->sum('amount'),
            'this_month_amount' => $thisMonthRevenue,
            'prev_month_amount' => $prevMonthRevenue,
            'growth_rate'       => $revenueGrowth,
            'is_positive'       => $revenueGrowth >= 0,
        ];

        return Inertia::render('backend/payments/index', [
            'payments' => $payments,
            'stats'    => $stats,
            'filters'  => $request->only(['status', 'payment_method', 'search', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display a specific payment for in-depth tracking and payload audit.
     */
    public function show(Payment $payment)
    {
        $payment->load([
            'booking.property.images',
            'booking.user',
            'booking.coupon',
            'booking.payments',
        ]);

        return Inertia::render('backend/payments/show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Update the payment status manually by admin.
     */
    public function updateStatus(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,completed,paid,refunded,failed,cancelled'],
            'notes'  => ['nullable', 'string', 'max:500'],
        ]);

        $updates = [
            'status' => $validated['status'],
        ];

        if (in_array($validated['status'], ['completed', 'paid']) && blank($payment->paid_at)) {
            $updates['paid_at'] = Carbon::now();
        }

        if (!empty($validated['notes'])) {
            $payload = $payment->payload ?? [];
            $payload['admin_notes'][] = [
                'note'       => $validated['notes'],
                'updated_by' => auth()->user()?->name ?? 'Admin',
                'timestamp'  => Carbon::now()->toIso8601String(),
                'status'     => $validated['status'],
            ];
            $updates['payload'] = $payload;
        }

        $payment->update($updates);

        // Optionally update booking status if refunded or completed
        if ($payment->booking) {
            if ($validated['status'] === 'refunded') {
                $payment->booking->update(['status' => 'cancelled']);
            } elseif (in_array($validated['status'], ['completed', 'paid']) && $payment->booking->status === 'pending') {
                $payment->booking->update(['status' => 'confirmed']);
            }
        }

        return back()->with('success', 'Payment status updated successfully.');
    }

    /**
     * Delete a payment record.
     */
    public function destroy(Payment $payment)
    {
        $payment->delete();

        return redirect()->route('admin.payments.index')->with('success', 'Payment transaction deleted successfully.');
    }

    /**
     * Export payment transactions to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Payment::with(['booking.property', 'booking.user'])->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'completed') {
                $query->whereIn('status', ['completed', 'paid']);
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('booking', function ($bq) use ($search) {
                      $bq->where('booking_number', 'like', "%{$search}%")
                         ->orWhere('guest_name', 'like', "%{$search}%")
                         ->orWhere('guest_email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="payments-export-' . date('Y-m-d_His') . '.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->stream(function () use ($payments) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'ID',
                'Transaction ID',
                'Booking Number',
                'Guest Name',
                'Guest Email',
                'Property',
                'Amount',
                'Currency',
                'Payment Method',
                'Status',
                'Paid At',
                'Created At',
            ]);

            foreach ($payments as $payment) {
                fputcsv($file, [
                    $payment->id,
                    $payment->transaction_id ?? 'N/A',
                    $payment->booking?->booking_number ?? 'N/A',
                    $payment->booking?->guest_name ?? $payment->booking?->user?->name ?? 'Guest',
                    $payment->booking?->guest_email ?? $payment->booking?->user?->email ?? 'N/A',
                    $payment->booking?->property?->title ?? $payment->booking?->property?->name ?? 'N/A',
                    number_format((float) $payment->amount, 2, '.', ''),
                    $payment->currency ?? 'USD',
                    ucfirst($payment->payment_method ?? 'Unknown'),
                    ucfirst($payment->status),
                    $payment->paid_at ? $payment->paid_at->toDateTimeString() : 'N/A',
                    $payment->created_at ? $payment->created_at->toDateTimeString() : 'N/A',
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }
}
