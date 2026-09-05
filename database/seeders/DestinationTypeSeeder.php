<?php

namespace Database\Seeders;

use App\Models\DestinationType;
use Illuminate\Database\Seeder;

class DestinationTypeSeeder extends Seeder
{
    /**
     * Seed the destination types used by the application.
     */
    public function run(): void
    {

        $destinationTypes = [
            [
                'name' => 'Island',
                'slug' => 'island',
                'title' => 'Where the sea meets silence.',
                'description' => 'Secluded island escapes with turquoise waters at your doorstep. Every stay is a private world of reef, palm, and open sky.',
                'image' => null,
            ],
            [
                'name' => 'Oceanview',
                'slug' => 'oceanview',
                'title' => 'Breathtaking ocean views.',
                'description' => 'Experience the beauty of the ocean from your accommodation. Wake up to the sound of waves and enjoy panoramic sea views from your balcony.',
                'image' => null,
            ],
            [
                'name' => 'Coastal City',
                'slug' => 'coastal-city',
                'title' => 'The energy of the city, the calm of the coast.',
                'description' => 'Premium urban rentals steps from beaches and harbours. Galleries, restaurants, and rooftop bars blended with salt-air mornings.',
                'image' => null,
            ],
            [
                'name' => 'Phenix City',
                'slug' => 'phenix-city',
                'title' => 'The vibrant energy of Phenix City.',
                'description' => 'Experience the vibrant energy of Phenix City with its bustling streets, cultural attractions, and diverse dining options.',
                'image' => null,
            ],
        ];

        foreach ($destinationTypes as $type) {
            DestinationType::updateOrCreate(
                ['slug' => str()->slug($type['name'])],
                [
                    'name' => $type['name'],
                    'title' => $type['title'],
                    'description' => $type['description'],
                    'image' => $type['image'],
                ],
            );
        }
    }
}
