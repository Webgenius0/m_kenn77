<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AmenitiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_amenities_index(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($user)->get(route('admin.amenities.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_an_amenity(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($user)->post(route('admin.amenities.store'), [
            'name' => 'Wi-Fi',
            'icon' => 'wifi',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('admin.amenities.index'));
        $this->assertDatabaseHas('amenities', ['name' => 'Wi-Fi', 'icon' => 'wifi', 'is_active' => true]);
    }
}
