<?php

namespace Tests\Feature\Backend;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_profile_information_and_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'role' => 'admin',
            'name' => 'Old Name',
            'email' => 'old@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('admin.profile.update'), [
                '_method' => 'put',
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
                'avatar' => UploadedFile::fake()->image('avatar.png'),
            ]);

        $response->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertSame('Updated Name', $user->name);
        $this->assertSame('updated@example.com', $user->email);
        $this->assertStringStartsWith('storage/uploads/avatar/', $user->avatar);
        Storage::disk('public')->assertExists(substr($user->avatar, strlen('storage/')));
    }
}
