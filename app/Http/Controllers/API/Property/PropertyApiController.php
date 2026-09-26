<?php

namespace App\Http\Controllers\API\Property;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Property;
use App\Services\Backend\HospitableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PropertyApiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        try {
            $properties = Property::query()
                ->with('images')
                ->where('is_active', true)
                ->when($request->filled('location'), function ($query) use ($request) {
                    $location = $request->input('location');
                    $query->where('location', $location);
                })
                ->when($request->filled('destination_type'), function ($query) use ($request) {
                    $type = $request->input('destination_type');
                    $query->whereHas('destinationType', function ($q) use ($type) {
                        $q->where('slug', $type)->orWhere('id', $type);
                    });
                })
                ->latest()
                ->paginate($request->input('per_page', 12));

            $properties->getCollection()->transform(function (Property $property) {
                return [
                    'id'                => $property->id,
                    'name'              => $property->name,
                    'slug'              => $property->slug,
                    'location'          => $property->location,
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
                        'location'        => $property->location,
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

            $availability = $this->getPropertyAvailability($property);

            return $this->successResponse('Property details', $this->transformProperty($property, $availability));
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch property details', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Retrieve calendar availability and booked dates for a property.
     */
    public function calendar(Request $request, $slug): JsonResponse
    {
        try {
            $property = Property::where('slug', $slug)->orWhere('id', $slug)->firstOrFail();
            $startDate = $request->query('start_date', now()->format('Y-m-d'));
            $endDate = $request->query('end_date', now()->addMonths(6)->format('Y-m-d'));

            $availability = $this->getPropertyAvailability($property, $startDate, $endDate);
            

            return $this->successResponse('Property calendar', $availability);
        } catch (\Throwable $e) {
            return $this->errorResponse('Failed to fetch property calendar', 500, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Merge Hospitable calendar and local database bookings to identify booked dates.
     */
    public function getPropertyAvailability(Property $property, ?string $startDate = null, ?string $endDate = null): array
    {
        $startDate = $startDate ?: now()->format('Y-m-d');
        $endDate = $endDate ?: now()->addMonths(6)->format('Y-m-d');

        $bookedDates = [];
        $calendarDays = [];
        $hospitableConnected = false;

        // 1. Fetch from Hospitable API if hospitable_property_id is set
        if (filled($property->hospitable_property_id)) {
            $hospitableService = app(HospitableService::class);
            $hospitableResult = $hospitableService->getCalendar(
                $property->hospitable_property_id,
                $startDate,
                $endDate
            );

            if ($hospitableResult['connected']) {
                $hospitableConnected = true;
                $bookedDates = $hospitableResult['booked_dates'] ?? [];
                $calendarDays = $hospitableResult['days'] ?? [];
            }
        }

        // 2. Query local database bookings for this property
        $localBookings = Booking::where('property_id', $property->id)
            ->whereIn('status', ['confirmed', 'paid', 'pending'])
            ->where('check_out', '>=', $startDate)
            ->where('check_in', '<=', $endDate)
            ->get(['check_in', 'check_out']);

        foreach ($localBookings as $booking) {
            $checkIn = Carbon::parse($booking->check_in);
            $checkOut = Carbon::parse($booking->check_out);

            // Night stays are from check_in to check_out - 1 day
            $curr = $checkIn->copy();
            while ($curr->lessThan($checkOut)) {
                $dateStr = $curr->format('Y-m-d');
                if ($dateStr >= $startDate && $dateStr <= $endDate) {
                    $bookedDates[] = $dateStr;
                }
                $curr->addDay();
            }
        }

        $bookedDates = array_values(array_unique($bookedDates));
        sort($bookedDates);
        $bookedMap = array_flip($bookedDates);

        // 3. Normalize calendar days list
        $daysByDate = [];
        foreach ($calendarDays as $day) {
            $daysByDate[$day['date']] = $day;
        }

        $finalDays = [];
        $periodStart = Carbon::parse($startDate);
        $periodEnd = Carbon::parse($endDate);
        $dayCursor = $periodStart->copy();

        while ($dayCursor->lessThanOrEqualTo($periodEnd)) {
            $dStr = $dayCursor->format('Y-m-d');
            $isBooked = isset($bookedMap[$dStr]);

            if (isset($daysByDate[$dStr])) {
                $dayItem = $daysByDate[$dStr];
                if ($isBooked) {
                    $dayItem['available'] = false;
                    $dayItem['reason'] = $dayItem['reason'] ?: 'booked';
                }
                $finalDays[] = $dayItem;
            } else {
                $finalDays[] = [
                    'date' => $dStr,
                    'available' => !$isBooked,
                    'price' => (float) ($property->price_per_night ?? 0),
                    'min_stay' => 1,
                    'reason' => $isBooked ? 'booked' : null,
                ];
            }

            $dayCursor->addDay();
        }

        return [
            'hospitable_connected'   => $hospitableConnected,
            'hospitable_property_id' => $property->hospitable_property_id,
            'start_date'             => $startDate,
            'end_date'               => $endDate,
            'booked_dates'           => $bookedDates,
            'days'                   => $finalDays,
        ];
    }

    protected function transformProperty(Property $property, ?array $availability = null): array
    {
        return [
            'id' => $property->id,
            'destination_type'  => $property->destinationType ? [
                'id'            => $property->destinationType->id,
                'name'          => $property->destinationType->name,
            ] : null,
            'hospitable_property_id' => $property->hospitable_property_id,
            'name'              => $property->name,
            'slug'              => $property->slug,
            'title'             => $property->title,
            'description'       => $property->description,
            'property_type'     => $property->property_type,
            'location'          => $property->location,
            'address'           => $property->address,
            'latitude'          => $property->latitude,
            'longitude'         => $property->longitude,
            'price_per_night'   => $property->price_per_night,
            'max_guests'        => $property->max_guests,
            'bedrooms'          => $property->bedrooms,
            'bathrooms'         => $property->bathrooms,
            'avg_rating'        => 4.5,
            'review_count'      => 14,
            'is_active'         => (bool) $property->is_active,
            'is_featured'       => (bool) $property->is_featured,
            'airbnb_property_url' => $property->airbnb_property_url,
            'availability'      => $availability,
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
            'reviews' => [
                [
                    'rating' => 4.5,
                    'name' => 'Marcus Westervelt',
                    'comment' => 'Booked direct and saved almost $200 versus Airbnb. The house was even brighter than the photos and check-in took thirty seconds.',
                    'date' => '1 month ago',
                    'image' => null,
                ],
                [
                    'rating' => 4.8,
                    'name' => 'Marcus Westervelt',
                    'comment' => 'The plunge pool at sunset is worth the trip alone. The team answered every message within minutes no middleman, no hold music.',
                    'date' => '10 days ago',
                    'image' => null,
                ]

            ],
        ];
    }
}
