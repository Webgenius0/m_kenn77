<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'Bedroom', 'icon' => '/icons/Bed.svg', 'is_active' => true],
            ['name' => 'Bathroom', 'icon' => '/icons/Bathtub.svg', 'is_active' => true],
            ['name' => 'Air Conditioner', 'icon' => '/icons/tabler-icon-air-conditioning-disabled.svg', 'is_active' => true],
            ['name' => 'Wi-Fi', 'icon' => '/icons/WifiHigh.svg', 'is_active' => true],
            ['name' => 'Kitchen', 'icon' => '/icons/tabler-icon-tools-kitchen-3.svg', 'is_active' => true],
            ['name' => 'Washing Machine', 'icon' => '/icons/WashingMachine.svg', 'is_active' => true],
            ['name' => 'Oven', 'icon' => '/icons/hugeicons_oven.svg', 'is_active' => true],
            ['name' => 'Refrigerator', 'icon' => '/icons/tabler-icon-fridge.svg', 'is_active' => true],
            ['name' => 'Television', 'icon' => '/icons/TelevisionSimple.svg', 'is_active' => true],
            ['name' => 'Gym', 'icon' => '/icons/iconsax-ai-weight.svg', 'is_active' => true],
            ['name' => 'Swimming Pool', 'icon' => '/icons/SwimmingPool.svg', 'is_active' => true],
            ['name' => 'Parking Area', 'icon' => '/icons/LetterCircleP.svg', 'is_active' => true],
        ];

        foreach ($amenities as $amenity) {
            Amenity::updateOrCreate(
                ['name' => $amenity['name']],
                [
                    'icon' => $amenity['icon'],
                    'is_active' => $amenity['is_active'],
                ]
            );
        }
    }
}
