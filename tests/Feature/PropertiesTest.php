<?php

namespace Tests\Feature;

use App\Models\DestinationType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_the_properties_index(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($user)->get(route('admin.properties.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_a_property(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $destinationType = DestinationType::create([
            'name' => 'Island',
            'slug' => 'island',
            'title' => 'Island getaway',
            'description' => 'Private island escape.',
            'image' => null,
        ]);

        $response = $this->actingAs($user)->post(route('admin.properties.store'), [
            'destination_type_id' => $destinationType->id,
            'hospitable_property_id' => 'hosp-1001',
            'name' => 'Ocean Breeze Villa',
            'title' => 'Luxury coastal living',
            'description' => 'A beautiful villa by the sea.',
            'property_type' => 'entire_unit',
            'country' => 'United States',
            'state' => 'Florida',
            'city' => 'Miami',
            'address' => '123 Ocean Drive',
            'postal_code' => '33101',
            'price_per_night' => '250.00',
            'max_guests' => 6,
            'bedrooms' => 3,
            'bathrooms' => 2,
            'is_active' => true,
            'is_featured' => false,
            'airbnb_property_url' => 'https://example.com/listing',
        ]);

        $response->assertRedirect(route('admin.properties.index'));
        $this->assertDatabaseHas('properties', [
            'name' => 'Ocean Breeze Villa',
            'slug' => 'ocean-breeze-villa',
            'city' => 'Miami',
            'is_active' => true,
        ]);
    }
}
