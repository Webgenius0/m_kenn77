<?php

namespace Database\Seeders;

use Database\Seeders\UserSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        $this->call(UserSeeder::class);
        $this->call(SettingSeeder::class);
        $this->call(FaqSeeder::class);
        $this->call(\Database\Seeders\DestinationTypeSeeder::class);
    }
}
