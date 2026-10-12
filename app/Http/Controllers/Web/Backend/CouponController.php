<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CouponController extends Controller
{
    public function index(Request $request)
    {
        $coupons = Coupon::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->boolean('status')))
            ->latest()
            ->get();

        return Inertia::render('backend/coupons/index', [
            'coupons' => $coupons,
            'filters' => $request->only('search', 'status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('backend/coupons/create');
    }

    public function store(Request $request)
    {
        Coupon::create($this->validatedData($request));

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon created successfully.');
    }

    public function edit(Coupon $coupon)
    {
        return Inertia::render('backend/coupons/edit', [
            'coupon' => $coupon,
        ]);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $data = $this->validatedData($request, $coupon);
        $coupon->update($data);

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon updated successfully.');
    }

    public function destroy(Coupon $coupon)
    {
        if ($coupon->getRawOriginal('coupon_image')) {
            Storage::disk('public')->delete($coupon->getRawOriginal('coupon_image'));
        }

        $coupon->delete();

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon deleted successfully.');
    }

    private function validatedData(Request $request, ?Coupon $coupon = null): array
    {
        $request->merge([
            'code' => strtoupper(trim((string) $request->input('code', ''))),
        ]);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'coupon_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'type' => ['required', 'in:general,early_bird,long_stay,last_minute,day_based'],
            'discount_type' => ['required', 'in:percentage,fixed'],
            'code' => ['required', 'string', 'max:100'],
            'discount_value' => [
                'required',
                'numeric',
                'min:0',
                ...($request->input('discount_type') === 'percentage' ? ['max:100'] : []),
            ],
            'minimum_nights' => ['nullable', 'integer', 'min:0'],
            'minimum_booking_amount' => ['nullable', 'numeric', 'min:0'],
            'advance_booking_days' => [
                'required_if:type,early_bird,last_minute',
                'nullable',
                'integer',
                'min:0',
            ],
            'applicable_days' => ['nullable', 'array'],
            'applicable_days.*' => ['string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['required', 'boolean'],
        ]);

        $duplicateCode = Coupon::query()
            ->whereRaw('UPPER(TRIM(code)) = ?', [$validated['code']])
            ->when($coupon, fn ($query) => $query->whereKeyNot($coupon->id))
            ->exists();

        if ($duplicateCode) {
            throw ValidationException::withMessages([
                'code' => 'The code has already been taken.',
            ]);
        }

        if ($request->hasFile('coupon_image')) {
            if ($coupon?->getRawOriginal('coupon_image')) {
                Storage::disk('public')->delete($coupon->getRawOriginal('coupon_image'));
            }
            $validated['coupon_image'] = $request->file('coupon_image')->store('coupons', 'public');
        } else {
            unset($validated['coupon_image']);
        }

        if (empty($validated['applicable_days'])) {
            $validated['applicable_days'] = null;
        }

        if (! in_array($validated['type'], ['early_bird', 'last_minute'], true)) {
            $validated['advance_booking_days'] = null;
        }

        return $validated;
    }
}
