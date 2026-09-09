<?php

namespace Database\Seeders;

use App\Models\Rule;
use Illuminate\Database\Seeder;

class RuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['rule_type' => 'Check-in', 'icon' => '/SVG Icons/iconsax-clock.svg'],
            ['rule_type' => 'Check-out', 'icon' => '/SVG Icons/iconsax-clock.svg'],
            ['rule_type' => 'Maximum Guests', 'icon' => '/SVG Icons/iconsax-profile.svg'],
            ['rule_type' => '18+', 'icon' => '/SVG Icons/iconsax-forbidden.svg'],
            ['rule_type' => 'No Smoking', 'icon' => '/SVG Icons/iconsax-forbidden.svg'],
            ['rule_type' => 'No Party', 'icon' => '/SVG Icons/iconsax-forbidden.svg'],
        ];

        foreach ($rules as $rule) {
            Rule::updateOrCreate(['rule_type' => $rule['rule_type']], ['icon' => $rule['icon']]);
        }
    }
}