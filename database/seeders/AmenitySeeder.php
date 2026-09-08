<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'Bedroom', 'icon' => '/SVG Icons/Bed.svg', 'is_active' => true],
            ['name' => 'Bathroom', 'icon' => '/SVG Icons/Bathtub.svg', 'is_active' => true],
            ['name' => 'Air Conditioner', 'icon' => '/SVG Icons/tabler-icon-air-conditioning-disabled.svg', 'is_active' => true],
            ['name' => 'Wi-Fi', 'icon' => '/SVG Icons/WifiHigh.svg', 'is_active' => true],
            ['name' => 'Kitchen', 'icon' => '/SVG Icons/tabler-icon-tools-kitchen-3.svg', 'is_active' => true],
            ['name' => 'Washing Machine', 'icon' => '/SVG Icons/WashingMachine.svg', 'is_active' => true],
            ['name' => 'Oven', 'icon' => '/SVG Icons/hugeicons_oven.svg', 'is_active' => true],
            ['name' => 'Refrigerator', 'icon' => '/SVG Icons/tabler-icon-fridge.svg', 'is_active' => true],
            ['name' => 'Television', 'icon' => '/SVG Icons/TelevisionSimple.svg', 'is_active' => true],
            ['name' => 'Gym', 'icon' => '/SVG Icons/iconsax-ai-weight.svg', 'is_active' => true],
            ['name' => 'Swimming Pool', 'icon' => '/SVG Icons/SwimmingPool.svg', 'is_active' => true],
            ['name' => 'Parking Area', 'icon' => '/SVG Icons/LetterCircleP.svg', 'is_active' => true],
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
