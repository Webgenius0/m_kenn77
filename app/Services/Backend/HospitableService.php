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
}
