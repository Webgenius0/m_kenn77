<?php

namespace App\Services\Backend;

use App\Models\Credential;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HospitableService
{
    protected const CACHE_KEY = 'hospitable_properties_cache';
    protected const CACHE_TTL_SECONDS = 300;
    /**
     * Get the active Hospitable API key.
     */
    public function getApiKey(): ?string
    {
        $dbKey = Credential::getValue('hospitable', 'api_key');
        if (filled($dbKey)) {
            return trim($dbKey);
        }

        $configKey = config('services.hospitable.api_key');
        if (filled($configKey)) {
            return trim($configKey);
        }

        $envKey = env('HOSPITABLE_API_KEY');
        return filled($envKey) ? trim($envKey) : null;
    }

    /**
     * Get the Hospitable Base API URL.
     */
    public function getBaseUrl(): string
    {
        $dbUrl = Credential::getValue('hospitable', 'base_url');
        if (filled($dbUrl)) {
            return rtrim(trim($dbUrl), '/');
        }

        return rtrim(config('services.hospitable.base_url', 'https://public.api.hospitable.com/v2'), '/');
    }

    /**
     * Check if the API key is configured.
     */
    public function isConfigured(): bool
    {
        return filled($this->getApiKey());
    }

    /**
     * Clear cached property list.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Retrieve the list of properties from Hospitable API.
     *
     * @param bool $refresh Force bypass cache
     * @return array{connected: bool, properties: array, message: ?string}
     */
    public function getProperties(bool $refresh = false): array
    {
        if (!$this->isConfigured()) {
            return [
                'connected' => false,
                'properties' => [],
                'message' => 'Hospitable API key is not configured. Add it in Settings > Hospitable Settings or in the .env file (HOSPITABLE_API_KEY).',
            ];
        }

        if ($refresh) {
            $this->clearCache();
        }

        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return $this->fetchPropertiesFromApi();
        });
    }

    /**
     * Perform the actual HTTP request to Hospitable API.
     */
    protected function fetchPropertiesFromApi(): array
    {
        $apiKey = $this->getApiKey();
        $baseUrl = $this->getBaseUrl();

        $requestUrl = "{$baseUrl}/properties";

        Log::info('Hospitable API request', ['url' => $requestUrl]);

        try {
            $response = Http::withToken($apiKey)
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->timeout(15)
                ->get($requestUrl);

            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->json();
                $errorMsg = $body['message'] ?? $body['error'] ?? "Hospitable API responded with status {$status}.";

                Log::warning('Hospitable API request failed', [
                    'url' => $requestUrl,
                    'status' => $status,
                    'response' => substr($response->body(), 0, 500),
                ]);

                return [
                    'connected' => false,
                    'properties' => [],
                    'message' => "Hospitable API Error ({$status}): {$errorMsg}",
                ];
            }

            $json = $response->json();
            $items = $json['data'] ?? (isset($json[0]) ? $json : []);

            $properties = [];
            foreach ($items as $item) {
                $properties[] = $this->normalizeProperty($item);
            }

            return [
                'connected' => true,
                'properties' => $properties,
                'message' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('Hospitable API exception', [
                'error' => $e->getMessage(),
            ]);

            return [
                'connected' => false,
                'properties' => [],
                'message' => 'Unable to connect to Hospitable API: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Normalize a single Hospitable property response.
     */
    protected function normalizeProperty(array $item): array
    {
        $address = null;
        $city = null;
        $state = null;
        $country = null;

        if (isset($item['address']) && is_array($item['address'])) {
            $street = $item['address']['street'] ?? $item['address']['address1'] ?? '';
            $city = $item['address']['city'] ?? null;
            $state = $item['address']['state'] ?? $item['address']['region'] ?? null;
            $country = $item['address']['country'] ?? null;
            $parts = array_filter([$street, $city, $state, $country]);
            $address = implode(', ', $parts);
        } elseif (isset($item['address']) && is_string($item['address'])) {
            $address = $item['address'];
        }

        $picture = $item['picture'] ?? $item['picture_url'] ?? $item['image'] ?? null;
        if (is_array($picture)) {
            $picture = $picture['url'] ?? $picture['thumbnail'] ?? null;
        }

        $airbnbUrl = null;
        if (!empty($item['listings']) && is_array($item['listings'])) {
            foreach ($item['listings'] as $listing) {
                if (isset($listing['platform']) && strtolower($listing['platform']) === 'airbnb') {
                    $airbnbUrl = $listing['url'] ?? null;
                    break;
                }
            }
        }

        return [
            'id' => (string) ($item['id'] ?? ''),
            'name' => (string) ($item['name'] ?? 'Unnamed Property'),
            'title' => (string) ($item['public_name'] ?? ''),
            'description' => (string) ($item['description'] ?? $item['summary'] ?? ''),
            'picture' => $picture,
            'address' => $address,
            'city' => $city,
            'state' => $state,
            'country' => $country,
            'latitude' => $item['address']['coordinates']['latitude'] ?? null,
            'longitude' => $item['address']['coordinates']['longitude'] ?? null,
            'property_type' => $item['property_type'] ?? null,
            'max_guests' => $item['capacity']['max'] ?? $item['max_guests'] ?? null,
            'bedrooms' => $item['capacity']['bedrooms'] ?? $item['bedrooms'] ?? null,
            'bathrooms' => $item['capacity']['bathrooms'] ?? $item['bathrooms'] ?? null,
            'airbnb_property_url' => $airbnbUrl ?? ($item['airbnb_url'] ?? null),
        ];
    }

    /**
     * Clear cached calendar for a specific property.
     */
    public function clearCalendarCache(string $propertyId): void
    {
        Cache::forget("hospitable_calendar_{$propertyId}");
    }

    /**
     * Retrieve calendar availability and pricing from Hospitable API.
     *
     * URL: https://public.api.hospitable.com/v2/properties/{uuid}/calendar
     *
     * @param string $propertyId Hospitable property UUID/ID
     * @param string|null $startDate YYYY-MM-DD
     * @param string|null $endDate YYYY-MM-DD
     * @param bool $refresh Force bypass cache
     * @return array{connected: bool, days: array, booked_dates: array, message: ?string}
     */
    public function getCalendar(string $propertyId, ?string $startDate = null, ?string $endDate = null, bool $refresh = false): array
    {
        if (!$this->isConfigured()) {
            return [
                'connected' => false,
                'days' => [],
                'booked_dates' => [],
                'message' => 'Hospitable API key is not configured.',
            ];
        }

        $startDate = $startDate ?: now()->format('Y-m-d');
        $endDate = $endDate ?: now()->addMonths(6)->format('Y-m-d');

        $cacheKey = "hospitable_calendar_{$propertyId}_{$startDate}_{$endDate}";

        if ($refresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($propertyId, $startDate, $endDate) {
            return $this->fetchCalendarFromApi($propertyId, $startDate, $endDate);
        });
    }

    /**
     * Fetch calendar data from Hospitable API via HTTP request.
     */
    protected function fetchCalendarFromApi(string $propertyId, string $startDate, string $endDate): array
    {
        $apiKey = $this->getApiKey();
        $baseUrl = $this->getBaseUrl();
        $requestUrl = "{$baseUrl}/properties/{$propertyId}/calendar";

        Log::info('Hospitable Calendar API request', [
            'url' => $requestUrl,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        try {
            $response = Http::withToken($apiKey)
                ->withHeaders([
                    'Accept' => 'application/json',
                ])
                ->timeout(15)
                ->get($requestUrl, [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]);

            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->json();
                $errorMsg = $body['message'] ?? $body['error'] ?? "Hospitable Calendar API responded with status {$status}.";

                Log::warning('Hospitable Calendar API request failed', [
                    'url' => $requestUrl,
                    'status' => $status,
                    'response' => substr($response->body(), 0, 500),
                ]);

                return [
                    'connected' => false,
                    'days' => [],
                    'booked_dates' => [],
                    'message' => "Hospitable API Error ({$status}): {$errorMsg}",
                ];
            }

            $json = $response->json();
            $rawDays = $json['data']['days'] ?? $json['data'] ?? (isset($json[0]) ? $json : []);

            $days = [];
            $bookedDates = [];

            foreach ($rawDays as $item) {
                $date = $item['date'] ?? null;
                if (!$date) {
                    continue;
                }

                $isAvailable = true;
                if (isset($item['status']['available'])) {
                    $isAvailable = (bool) $item['status']['available'];
                } elseif (isset($item['available'])) {
                    $isAvailable = (bool) $item['available'];
                } elseif (isset($item['status']) && is_string($item['status'])) {
                    $isAvailable = strtolower($item['status']) === 'available';
                }

                $reason = $item['status']['reason'] ?? $item['reason'] ?? null;

                $price = null;
                if (isset($item['price']['amount'])) {
                    $rawAmount = (float) $item['price']['amount'];
                    $price = $rawAmount > 1000 ? $rawAmount / 100 : $rawAmount;
                } elseif (isset($item['price']) && is_numeric($item['price'])) {
                    $price = (float) $item['price'];
                }

                $minStay = $item['min_stay'] ?? $item['minimum_stay'] ?? 1;

                $days[] = [
                    'date' => $date,
                    'available' => $isAvailable,
                    'price' => $price,
                    'min_stay' => (int) $minStay,
                    'reason' => $reason,
                ];

                if (!$isAvailable) {
                    $bookedDates[] = $date;
                }
            }

            return [
                'connected' => true,
                'days' => $days,
                'booked_dates' => array_values(array_unique($bookedDates)),
                'message' => null,
            ];

        } catch (\Throwable $e) {
            Log::error('Hospitable Calendar API exception', [
                'property_id' => $propertyId,
                'error' => $e->getMessage(),
            ]);

            return [
                'connected' => false,
                'days' => [],
                'booked_dates' => [],
                'message' => 'Unable to connect to Hospitable Calendar API: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update calendar dates on Hospitable API.
     *
     * URL: PUT https://public.api.hospitable.com/v2/properties/{uuid}/calendar
     *
     * Payload format:
     * {
     *   "note": "optional top-level note",
     *   "dates": [
     *     {
     *       "date": "YYYY-MM-DD",
     *       "price": { "amount": 1000 },
     *       "available": false,
     *       "min_stay": 1,
     *       "closed_for_checkout": true,
     *       "closed_for_checkin": true,
     *       "note": "per-date note"
     *     }
     *   ]
     * }
     *
     * @param string $propertyId Hospitable property UUID/ID
     * @param array $dates Array of date payloads
     * @param string|null $note Top-level note for the calendar update
     * @return array{success: bool, message: string, response: ?array}
     */
    public function updateCalendar(string $propertyId, array $dates, ?string $note = null): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Hospitable API key is not configured.',
                'response' => null,
            ];
        }

        $apiKey = $this->getApiKey();
        $baseUrl = $this->getBaseUrl();
        $requestUrl = "{$baseUrl}/properties/{$propertyId}/calendar";

        $payload = ['dates' => $dates];
        if (!empty($note)) {
            $payload['note'] = $note;
        }

        Log::info('Hospitable Calendar Update request', [
            'url'         => $requestUrl,
            'dates_count' => count($dates),
            'note'        => $note,
        ]);

        try {
            $response = Http::withToken($apiKey)
                ->withHeaders([
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(20)
                ->put($requestUrl, $payload);

            if (!$response->successful() && $response->status() === 405) {
                $response = Http::withToken($apiKey)
                    ->withHeaders([
                        'Accept'       => 'application/json',
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(20)
                    ->patch($requestUrl, $payload);
            }

            if (!$response->successful()) {
                $status   = $response->status();
                $body     = $response->json();
                $rawBody  = $response->body();

                // Hospitable v2 may return validation details in various keys
                $errorMsg = $body['message']
                    ?? $body['error']
                    ?? $body['reason_phrase']
                    ?? null;

                // 422 validation errors are often nested under 'errors' or 'data'
                $validationErrors = $body['errors'] ?? $body['data']['errors'] ?? null;
                if ($validationErrors) {
                    $errorMsg = json_encode($validationErrors);
                }

                $errorMsg = $errorMsg ?? "Hospitable Calendar Update responded with status {$status}.";

                // Known Hospitable limitation: property is connected to a channel (Airbnb,
                // Booking.com, etc.) that restricts direct calendar writes via API.
                // This is expected and non-actionable — log as info, not a warning.
                $isChannelRestricted = $status === 422
                    && str_contains($body['reason_phrase'] ?? '', 'calendar restricted');

                if ($isChannelRestricted) {
                    Log::info('Hospitable Calendar Update skipped — property is channel restricted', [
                        'url'        => $requestUrl,
                        'reason'     => $errorMsg,
                    ]);
                } else {
                    Log::warning('Hospitable Calendar Update failed', [
                        'url'           => $requestUrl,
                        'status'        => $status,
                        'payload'       => $payload,
                        'response_body' => $body,
                        'response_raw'  => $rawBody,
                    ]);
                }

                return [
                    'success'            => false,
                    'channel_restricted' => $isChannelRestricted,
                    'message'            => $errorMsg,
                    'response'           => $body,
                ];
            }


            $this->clearCalendarCache($propertyId);

            return [
                'success' => true,
                'message' => 'Calendar successfully updated in Hospitable.',
                'response' => $response->json(),
            ];

        } catch (\Throwable $e) {
            Log::error('Hospitable Calendar Update exception', [
                'property_id' => $propertyId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Unable to update Hospitable Calendar: ' . $e->getMessage(),
                'response' => null,
            ];
        }
    }

    /**
     * Block dates for a reservation on Hospitable API.
     *
     * Sends the Hospitable v2 calendar format:
     * {
     *   "note": "top-level note",
     *   "dates": [
     *     {
     *       "date": "YYYY-MM-DD",
     *       "price": { "amount": 20000 },   // required for Hospitable to persist the update
     *       "available": false,
     *       "closed_for_checkin": false,
     *       "closed_for_checkout": false,
     *       "note": "per-date note"
     *     }
     *   ]
     * }
     *
     * @param string $propertyId Hospitable property UUID
     * @param string $checkIn Check-in date (YYYY-MM-DD)
     * @param string $checkOut Check-out date (YYYY-MM-DD)
     * @param string|null $note Top-level reason or booking reference note
     * @param float|null $pricePerNight Nightly price in the property currency (used to populate price.amount)
     * @return array{success: bool, message: string, response: ?array}
     */
    public function blockDates(string $propertyId, string $checkIn, string $checkOut, ?string $note = null, ?float $pricePerNight = null): array
    {
        $start = \Illuminate\Support\Carbon::parse($checkIn);
        $end   = \Illuminate\Support\Carbon::parse($checkOut);

        if ($end->lessThanOrEqualTo($start)) {
            return [
                'success'  => false,
                'message'  => 'Check-out date must be after check-in date.',
                'response' => null,
            ];
        }

        $dates   = [];
        $current = $start->copy();

        while ($current->lessThan($end)) {
            $dateEntry = [
                'date'                => $current->format('Y-m-d'),
                'available'           => false,
                'closed_for_checkin'  => false,
                'closed_for_checkout' => false,
            ];

            // Hospitable requires price.amount to actually persist the availability update.
            // Convert decimal price to integer cents/smallest unit (multiply by 100).
            if ($pricePerNight !== null && $pricePerNight > 0) {
                $dateEntry['price'] = ['amount' => (int) round($pricePerNight * 100)];
            }

            if (!empty($note)) {
                $dateEntry['note'] = $note;
            }

            $dates[] = $dateEntry;
            $current->addDay();
        }

        return $this->updateCalendar($propertyId, $dates, $note);
    }

    /**
     * Unblock dates on Hospitable API (e.g. if reservation was cancelled).
     */
    public function unblockDates(string $propertyId, string $checkIn, string $checkOut): array
    {
        $start = \Illuminate\Support\Carbon::parse($checkIn);
        $end   = \Illuminate\Support\Carbon::parse($checkOut);

        $dates   = [];
        $current = $start->copy();

        while ($current->lessThan($end)) {
            $dates[] = [
                'date'                => $current->format('Y-m-d'),
                'available'           => true,
                'closed_for_checkin'  => false,
                'closed_for_checkout' => false,
            ];
            $current->addDay();
        }

        return $this->updateCalendar($propertyId, $dates);
    }

    /**
     * Clear cached reviews for a specific property.
     */
    public function clearReviewsCache(string $propertyId): void
    {
        Cache::forget("hospitable_reviews_{$propertyId}");
    }

    /**
     * Retrieve reviews for a property from Hospitable API.
     *
     * URL: GET https://public.api.hospitable.com/v2/properties/{uuid}/reviews
     *
     * @param string $propertyId Hospitable property UUID
     * @param bool   $refresh    Force bypass cache
     * @return array{connected: bool, reviews: array, avg_rating: float|null, review_count: int, message: ?string}
     */
    public function getReviews(string $propertyId, bool $refresh = false): array
    {
        if (!$this->isConfigured()) {
            return [
                'connected'    => false,
                'reviews'      => [],
                'avg_rating'   => null,
                'review_count' => 0,
                'message'      => 'Hospitable API key is not configured.',
            ];
        }

        $cacheKey = "hospitable_reviews_{$propertyId}";

        if ($refresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($propertyId) {
            return $this->fetchReviewsFromApi($propertyId);
        });
    }

    /**
     * Fetch reviews data from Hospitable API via HTTP request.
     */
    protected function fetchReviewsFromApi(string $propertyId): array
    {
        $apiKey     = $this->getApiKey();
        $baseUrl    = $this->getBaseUrl();
        $requestUrl = "{$baseUrl}/properties/{$propertyId}/reviews";

        Log::info('Hospitable Reviews API request', ['url' => $requestUrl]);

        try {
            $response = Http::withToken($apiKey)
                ->withHeaders(['Accept' => 'application/json'])
                ->timeout(15)
                ->get($requestUrl);

            if (!$response->successful()) {
                $status   = $response->status();
                $body     = $response->json();
                $errorMsg = $body['message'] ?? $body['error'] ?? "Hospitable Reviews API responded with status {$status}.";

                Log::warning('Hospitable Reviews API request failed', [
                    'url'      => $requestUrl,
                    'status'   => $status,
                    'response' => substr($response->body(), 0, 500),
                ]);

                return [
                    'connected'    => false,
                    'reviews'      => [],
                    'avg_rating'   => null,
                    'review_count' => 0,
                    'message'      => "Hospitable API Error ({$status}): {$errorMsg}",
                ];
            }

            $json  = $response->json();
            $items = $json['data'] ?? (isset($json[0]) ? $json : []);

            $reviews = [];
            $ratingSum   = 0;
            $ratingCount = 0;

            foreach ($items as $item) {
                // Rating and review text are nested under the 'public' key
                $public = $item['public'] ?? [];
                $rating = isset($public['rating']) ? (float) $public['rating'] : null;

                // Exclude reviews below 3.5 rating
                if ($rating !== null && $rating < 3.5) {
                    continue;
                }

                if ($rating !== null) {
                    $ratingSum += $rating;
                    $ratingCount++;
                }

                // $reviews[] = [
                //     'id'              => $item['id'] ?? null,
                //     'rating'          => $rating,
                //     'rating_original' => $public['rating_platform_original'] ?? null,
                //     'name'            => $item['reviewer']['name'] ?? $item['guest_name'] ?? null,
                //     'comment'         => $public['review'] ?? null,
                //     'response'        => $public['response'] ?? null,
                //     'date'            => $item['reviewed_at'] ?? $item['submitted_at'] ?? $item['created_at'] ?? null,
                //     'responded_at'    => $item['responded_at'] ?? null,
                //     'image'           => $item['reviewer']['picture'] ?? $item['reviewer']['avatar'] ?? null,
                //     'platform'        => $item['platform'] ?? null,
                //     'detailed_ratings' => $item['private']['detailed_ratings'] ?? null,
                // ];

                $reviews[] = [
                    'rating'  => $rating,
                    'name'    => !empty($item['guest']) ? $item['guest']['first_name'] . ' ' . $item['guest']['last_name'] : 'Anonymous',
                    'comment' => $public['review'] ?? null,
                    'date'    => \Carbon\Carbon::parse($item['reviewed_at'])->diffForHumans()
                ];
            }

            $avgRating = $ratingCount > 0
                ? round($ratingSum / $ratingCount, 2)
                : null;

            return [
                'connected'    => true,
                'reviews'      => $reviews,
                'avg_rating'   => $avgRating,
                'review_count' => count($reviews),
                'message'      => null,
            ];

        } catch (\Throwable $e) {
            Log::error('Hospitable Reviews API exception', [
                'property_id' => $propertyId,
                'error'       => $e->getMessage(),
            ]);

            return [
                'connected'    => false,
                'reviews'      => [],
                'avg_rating'   => null,
                'review_count' => 0,
                'message'      => 'Unable to connect to Hospitable Reviews API: ' . $e->getMessage(),
            ];
        }
    }
}
