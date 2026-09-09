<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\DestinationType;
use App\Models\Property;
use App\Models\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PropertyController extends Controller
{
    public function index()
    {
        return Inertia::render('backend/properties/index', [
            'properties' => Property::with(['destinationType', 'amenities', 'rules'])->latest()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('backend/properties/create', [
            'destinationTypes' => DestinationType::orderBy('name')->get(),
            'amenities' => Amenity::where('is_active', true)->orderBy('name')->get(),
            'rules' => Rule::orderBy('rule_type')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->validateChildData($request);
        $validated = $this->validatedData($request);
        $property = DB::transaction(fn () => Property::create($validated));

        if ($request->filled('amenity_ids')) {
            $amenities = [];
            foreach ($request->input('amenity_ids', []) as $index => $amenityId) {
                $amenities[$amenityId] = ['quantity' => (int) ($request->input('amenity_quantities.' . $index, 1) ?: 1)];
            }
            $property->amenities()->sync($amenities);
        }

        $this->syncRules($request, $property);
        $this->syncRooms($request, $property);
        $this->syncImages($request, $property);

        return redirect()->route('admin.properties.index')->with('success', 'Property created successfully.');
    }

    public function edit(Property $property)
    {
        return Inertia::render('backend/properties/edit', [
            'property' => $property->load(['destinationType', 'amenities', 'rules', 'rooms', 'images']),
            'destinationTypes' => DestinationType::orderBy('name')->get(),
            'amenities' => Amenity::where('is_active', true)->orderBy('name')->get(),
            'rules' => Rule::orderBy('rule_type')->get(),
        ]);
    }

    public function update(Request $request, Property $property)
    {
        $this->validateChildData($request);
        $validated = $this->validatedData($request, $property);
        $property->update($validated);

        if ($request->filled('amenity_ids')) {
            $amenities = [];
            foreach ($request->input('amenity_ids', []) as $index => $amenityId) {
                $amenities[$amenityId] = ['quantity' => (int) ($request->input('amenity_quantities.' . $index, 1) ?: 1)];
            }
            $property->amenities()->sync($amenities);
        } else {
            $property->amenities()->detach();
        }

        $this->syncRules($request, $property);
        $this->syncRooms($request, $property);
        $this->syncImages($request, $property);

        return redirect()->route('admin.properties.index')->with('success', 'Property updated successfully.');
    }

    public function destroy(Property $property)
    {
        $property->delete();

        return redirect()->route('admin.properties.index')->with('success', 'Property deleted successfully.');
    }

    private function validatedData(Request $request, ?Property $property = null): array
    {
        $validated = $request->validate([
            'destination_type_id' => ['nullable', 'exists:destination_types,id'],
            'hospitable_property_id' => ['nullable', 'string', 'max:255', 'unique:properties,hospitable_property_id,' . ($property?->id ?? 'NULL')],
            'name' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'property_type' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'price_per_night' => ['nullable', 'numeric', 'min:0'],
            'max_guests' => ['nullable', 'integer', 'min:1'],
            'bedrooms' => ['nullable', 'integer', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'airbnb_property_url' => ['nullable', 'url', 'max:255'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if (Property::where('slug', $validated['slug'])
            ->when($property, fn ($query) => $query->where('id', '!=', $property->id))
            ->exists()) {
            $validated['slug'] = $validated['slug'] . '-' . (string) now()->timestamp;
        }

        return $validated;
    }

    private function syncRules(Request $request, Property $property): void
    {
        $ruleIds = $request->input('rule_ids', []);
        $values = $request->input('rule_values', []);
        $rules = [];

        foreach ($ruleIds as $index => $ruleId) {
            $rules[$ruleId] = ['value' => $values[$index] ?? null];
        }

        $property->rules()->sync($rules);
    }

    private function validateChildData(Request $request): void
    {
        $request->validate([
            'rooms' => ['nullable', 'array'],
            'rooms.*.id' => ['nullable', 'integer'],
            'rooms.*.name' => ['required', 'string', 'max:255'],
            'rooms.*.bed_type' => ['required', 'string', 'max:100'],
            'rooms.*.quantity' => ['required', 'integer', 'min:1'],
            'rooms.*.image' => ['nullable', 'image', 'max:5120'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:10240'],
            'image_ids' => ['nullable', 'array'],
            'image_ids.*' => ['integer'],
            'primary_image_id' => ['nullable', 'integer'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    private function syncRooms(Request $request, Property $property): void
    {
        $rooms = $request->input('rooms', []);
        $keptIds = [];

        foreach ($rooms as $index => $roomData) {
            $room = ! empty($roomData['id']) ? $property->rooms()->find($roomData['id']) : null;
            $attributes = [
                'name' => $roomData['name'] ?? '',
                'bed_type' => $roomData['bed_type'] ?? '',
                'quantity' => (int) ($roomData['quantity'] ?? 1),
            ];

            $image = $request->file("rooms.$index.image");
            if ($image) {
                if ($room?->getRawOriginal('image')) {
                    Storage::disk('public')->delete($room->getRawOriginal('image'));
                }
                $attributes['image'] = $image->store('property-rooms', 'public');
            }

            if ($room) {
                $room->update($attributes);
                $keptIds[] = $room->id;
            } else {
                $keptIds[] = $property->rooms()->create($attributes)->id;
            }
        }

        $property->rooms()->whereNotIn('id', $keptIds ?: [0])->get()->each(function ($room) {
            if ($room->getRawOriginal('image')) {
                Storage::disk('public')->delete($room->getRawOriginal('image'));
            }
            $room->delete();
        });
    }

    private function syncImages(Request $request, Property $property): void
    {
        $keptIds = collect($request->input('image_ids', []))->map(fn ($id) => (int) $id)->all();

        $property->images()->whereNotIn('id', $keptIds ?: [0])->get()->each(function ($image) {
            if ($image->getRawOriginal('image_path')) {
                Storage::disk('public')->delete($image->getRawOriginal('image_path'));
            }
            $image->delete();
        });

        foreach ($request->file('images', []) as $index => $file) {
            $property->images()->create([
                'image_path' => $file->store('property-images', 'public'),
                'is_primary' => (string) $index === (string) $request->input('primary_image_index'),
            ]);
        }

        $primaryId = $request->input('primary_image_id');
        if ($primaryId) {
            $property->images()->update(['is_primary' => false]);
            $property->images()->whereKey($primaryId)->update(['is_primary' => true]);
        }
    }
}
