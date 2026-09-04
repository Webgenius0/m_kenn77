<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AboutUs extends Model
{
    protected $fillable = [
        'title',
        'description',
        'place_one_image',
        'place_one_title',
        'place_one_number',
        'place_two_image',
        'place_two_title',
        'place_two_number',
        'place_three_image',
        'place_three_title',
        'place_three_number',
        'banner_image',
        'story',
        'our_mission',
        'house_difference',
        'our_promise',
    ];

    public function getPlaceOneImageAttribute($value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function getPlaceTwoImageAttribute($value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function getPlaceThreeImageAttribute($value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function getBannerImageAttribute($value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }
}
