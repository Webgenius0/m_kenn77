<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            ->when($request->filled('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->get();

        return Inertia::render('backend/coupons/index', [
            'coupons' => $coupons,
            'filters' => $request->only('search', 'is_active'),
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
        if ($coupon->getRawOriginal('image')) {
            Storage::disk('public')->delete($coupon->getRawOriginal('image'));
        }

        $coupon->delete();

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon deleted successfully.');
    }

    private function validatedData(Request $request, ?Coupon $coupon = null): array
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'type' => ['required', 'in:percentage,fixed'],
            'code' => ['required', 'string', 'max:100', 'unique:coupons,code,' . ($coupon?->id ?? 'NULL')],
            'value' => ['required', 'numeric', 'min:0'],
            'min_night' => ['required', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            if ($coupon?->getRawOriginal('image')) {
                Storage::disk('public')->delete($coupon->getRawOriginal('image'));
            }
            $validated['image'] = $request->file('image')->store('coupons', 'public');
        } else {
            unset($validated['image']);
        }

        return $validated;
    }
}
