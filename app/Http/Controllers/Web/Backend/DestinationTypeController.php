<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\DestinationType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DestinationTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('backend/destination-types/index', [
            'destinationTypes' => DestinationType::latest()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('backend/destination-types/create');
    }

    public function store(Request $request)
    {
        DestinationType::create($this->validatedData($request));

        return redirect()->route('admin.destination-types.index')->with('success', 'Destination type created successfully.');
    }

    public function edit(DestinationType $destinationType)
    {
        return Inertia::render('backend/destination-types/edit', [
            'destinationType' => $destinationType,
        ]);
    }

    public function update(Request $request, DestinationType $destinationType)
    {
        $destinationType->update($this->validatedData($request, $destinationType));

        return redirect()->route('admin.destination-types.index')->with('success', 'Destination type updated successfully.');
    }

    public function destroy(DestinationType $destinationType)
    {
        if ($destinationType->getRawOriginal('image')) {
            Storage::disk('public')->delete($destinationType->getRawOriginal('image'));
        }

        $destinationType->delete();

        return redirect()->route('admin.destination-types.index')->with('success', 'Destination type deleted successfully.');
    }

    private function validatedData(Request $request, ?DestinationType $destinationType = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'image' => [$destinationType ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $baseSlug = Str::slug($validated['name']);

        if ($baseSlug === '') {
            throw ValidationException::withMessages([
                'name' => 'Name must contain at least one letter or number.',
            ]);
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (DestinationType::where('slug', $slug)
            ->when($destinationType, fn ($query) => $query->where('id', '!=', $destinationType->id))
            ->exists()) {
            $slug = $baseSlug . '-' . $suffix++;
        }

        $validated['slug'] = $slug;

        if ($request->hasFile('image')) {
            if ($destinationType?->getRawOriginal('image')) {
                Storage::disk('public')->delete($destinationType->getRawOriginal('image'));
            }

            $validated['image'] = $request->file('image')->store('destination-types', 'public');
        } else {
            unset($validated['image']);
        }

        return $validated;
    }
}
