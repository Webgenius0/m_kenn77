<?php

namespace App\Http\Controllers\API\Property;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyApiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        try {
            $properties = Property::query()
                ->with('images')
                ->where('is_active', true)
                ->when($request->filled('destination'), function ($query) use ($request) {
                    $destination = $request->input('destination');


                    $query->whereHas('destinationType', function ($destinationQuery) use ($destination) {
                        $destinationQuery->where(function ($subQuery) use ($destination) {
                            $subQuery->where('slug', $destination)
                                ->orWhere('name', $destination);
                        });
                    });
                })
                ->latest()
                ->paginate($request->input('per_page', 12));

            $properties->getCollection()->transform(function (Property $property) {
                return [
                    'id'                => $property->id,
                    'name'              => $property->name,
                    'slug'              => $property->slug,
                    'address'           => $property->address,
                    'price_per_night'   => $property->price_per_night,
                    'max_guests'        => $property->max_guests,
                    'bedrooms'          => $property->bedrooms,
                    'bathrooms'         => $property->bathrooms,
                    'avg_rating'        => 4.5,
                    'review_count'      => 14,
                    'images'            => $property->images->map(function ($image) {
                        return [
                            'image_path' => $image->image_path,
                            'is_primary' => (bool) $image->is_primary,
                        ];
                    })->values(),
                ];
            });

            return $this->successResponse('Properties list', $properties);

        } catch (\Throwable $e) {
            return $this->errorResponse(
                'Failed to fetch properties',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }


    public function featuredProperties(): JsonResponse
    {
        try {
            $properties = Property::query()
                ->with('images')
                ->where('is_active', true)
                ->where('is_featured', true)
                ->latest()
                ->get()
                ->map(function (Property $property) {
                    return [
                        'id'              => $property->id,
                        'name'            => $property->name,
                        'slug'            => $property->slug,
                        'address'         => $property->address,
                        'price_per_night' => $property->price_per_night,
                        'max_guests'      => $property->max_guests,
                        'bedrooms'        => $property->bedrooms,
                        'bathrooms'       => $property->bathrooms,
                        'avg_rating'      => 4.5,
                        'review_count'    => 14,
                        'images'          => $property->images
                            ->map(function ($image) {
                                return [
                                    'image_path' => $image->image_path,
                                    'is_primary' => (bool) $image->is_primary,
                                ];
                            })
                            ->values(),
                    ];
                })
                ->values();

            return $this->successResponse('Featured Properties list', $properties);

        } catch (\Throwable $e) {
            return $this->errorResponse(
                'Failed to fetch featured properties',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }



    public function show($slug): JsonResponse
    {
        try {
            $property = Property::where('slug', $slug)->firstOrFail();
            $property->load(['destinationType', 'amenities', 'rules', 'rooms', 'images']);

            return $this->successResponse('Property details', $this->transformProperty($property));
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch property details', 500, ['error' => $e->getMessage()]);
        }
    }

    protected function transformProperty(Property $property): array
    {
        return [
            'id' => $property->id,
            'destination_type'  => $property->destinationType ? [
                'id'            => $property->destinationType->id,
                'name'          => $property->destinationType->name,
            ] : null,
            'name'              => $property->name,
            'slug'              => $property->slug,
            'title'             => $property->title,
            'description'       => $property->description,
            'property_type'     => $property->property_type,
            'country'           => $property->country,
            'state'             => $property->state,
            'city'              => $property->city,
            'address'           => $property->address,
            'postal_code'       => $property->postal_code,
            'latitude'          => $property->latitude,
            'longitude'         => $property->longitude,
            'price_per_night'   => $property->price_per_night,
            'max_guests'        => $property->max_guests,
            'bedrooms'          => $property->bedrooms,
            'bathrooms'         => $property->bathrooms,
            'is_active'         => (bool) $property->is_active,
            'is_featured'       => (bool) $property->is_featured,
            'airbnb_property_url' => $property->airbnb_property_url,
            'amenities'         => $property->amenities->map(function ($amenity) {
                return [
                    'id'        => $amenity->id,
                    'name'      => $amenity->name,
                    'icon'      => $amenity->icon,
                    'quantity'  => $amenity->pivot->quantity ?? null,
                ];
            })->values(),
            'rules'             => $property->rules->map(function ($rule) {
                return [
                    'id'        => $rule->id,
                    'rule_type' => $rule->rule_type,
                    'icon'      => $rule->icon,
                    'value'     => $rule->pivot->value ?? null,
                ];
            })->values(),
            'rooms' => $property->rooms->map(function ($room) {
                return [
                    'id'        => $room->id,
                    'name'      => $room->name,
                    'bed_type'  => $room->bed_type,
                    'quantity'  => $room->quantity,
                    'image'     => $room->image ? asset('storage/' . $room->image) : null,
                ];
            })->values(),
            'images' => $property->images->map(function ($image) {
                return [
                    'id'        => $image->id,
                    'image_path' => $image->image_path,
                    'is_primary' => (bool) $image->is_primary,
                ];
            })->values(),
        ];
    }
}
