<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AmenityController extends Controller
{
    public function index()
    {
        return Inertia::render('backend/amenities/index', [
            'amenities' => Amenity::latest()->get()->map(function ($amenity) {
                $amenity->icon = $this->resolveIconUrl($amenity->icon);

                return $amenity;
            }),
        ]);
    }

    public function create()
    {
        return Inertia::render('backend/amenities/create');
    }

    public function store(Request $request)
    {
        Amenity::create($this->validatedData($request));

        return redirect()->route('admin.amenities.index')->with('success', 'Amenity created successfully.');
    }

    public function edit(Amenity $amenity)
    {
        return Inertia::render('backend/amenities/edit', [
            'amenity' => [
                'id' => $amenity->id,
                'name' => $amenity->name,
                'icon' => $this->resolveIconUrl($amenity->icon),
                'is_active' => (bool) $amenity->is_active,
            ],
        ]);
    }

    public function update(Request $request, Amenity $amenity)
    {
        $amenity->update($this->validatedData($request, $amenity));

        return redirect()->route('admin.amenities.index')->with('success', 'Amenity updated successfully.');
    }

    public function destroy(Amenity $amenity)
    {
        if ($amenity->icon && ! Str::startsWith($amenity->icon, '/icons/')) {
            Storage::disk('public')->delete($amenity->icon);
        }

        $amenity->delete();

        return redirect()->route('admin.amenities.index')->with('success', 'Amenity deleted successfully.');
    }

    private function resolveIconUrl(?string $icon): ?string
    {
        if (! $icon) {
            return null;
        }

        if (Str::startsWith($icon, '/icons/') || Str::startsWith($icon, 'http://') || Str::startsWith($icon, 'https://')) {
            return $icon;
        }

        return Storage::disk('public')->url($icon);
    }

    private function validatedData(Request $request, ?Amenity $amenity = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('amenities', 'name')->ignore($amenity?->id)],
            'icon' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($request->hasFile('icon')) {
            if ($amenity?->icon) {
                Storage::disk('public')->delete($amenity->icon);
            }

            $validated['icon'] = $request->file('icon')->store('amenities', 'public');
        } else {
            unset($validated['icon']);
        }

        return $validated;
    }
}
