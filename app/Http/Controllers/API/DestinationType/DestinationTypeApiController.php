<?php

namespace App\Http\Controllers\API\DestinationType;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\DestinationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DestinationTypeApiController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        try {
            $destinationTypes = DestinationType::query()
                ->withCount('properties')
                ->orderBy('name')
                ->get()
                ->map(function (DestinationType $destinationType) {
                    return [
                        'id' => $destinationType->id,
                        'name' => $destinationType->name,
                        'slug' => $destinationType->slug,
                        'image' => $destinationType->image,
                        'property_count' => (int) $destinationType->properties_count,
                    ];
                });

            return $this->successResponse('Destination types list', $destinationTypes);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch destination types', 500, ['error' => $e->getMessage()]);
        }
    }

    public function show(string $slug): JsonResponse
    {
        try {
            $destinationType = DestinationType::query()
                ->where('slug', $slug)
                ->with(['properties' => function ($query) {
                    $query->where('is_active', true)->latest();
                }])
                ->firstOrFail();

            return $this->successResponse('Destination type details', [
                'id'                => $destinationType->id,
                'name'              => $destinationType->name,
                'slug'              => $destinationType->slug,
                'title'             => $destinationType->title,
                'description'       => $destinationType->description,
                'image'             => $destinationType->image,
                'property_count'    => $destinationType->properties->count(),
                'properties'        => $destinationType->properties->map(function ($property) {
                    return [
                        'id'                => $property->id,
                        'name'              => $property->name,
                        'slug'              => $property->slug,
                        'title'             => $property->title,
                        'description'       => $property->description,
                        'property_type'     => $property->property_type,
                        'location'          => $property->location,
                        'address'           => $property->address,
                        'price_per_night'   => $property->price_per_night,
                        'max_guests'        => $property->max_guests,
                        'bedrooms'          => $property->bedrooms,
                        'bathrooms'         => $property->bathrooms,
                        'avg_rating'        => 4.5,
                        'review_count'      => 14,
                        'images'            => $property->images
                            ->map(function ($image) {
                                return [
                                    'image_path' => $image->image_path,
                                    'is_primary' => (bool) $image->is_primary,
                                ];
                            })
                            ->values(),
                    ];
                })->values(),
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch destination type details', 500, ['error' => $e->getMessage()]);
        }
    }
}
