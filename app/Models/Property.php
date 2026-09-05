<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $fillable = [
        'destination_type_id',
        'hospitable_property_id',
        'name',
        'slug',
        'title',
        'description',
        'property_type',
        'country',
        'state',
        'city',
        'address',
        'postal_code',
        'latitude',
        'longitude',
        'price_per_night',
        'max_guests',
        'bedrooms',
        'bathrooms',
        'is_active',
        'is_featured',
        'airbnb_property_url',
    ];

    public function amenities()
    {
        return $this->belongsToMany(Amenity::class)->withPivot('quantity')
            ->withTimestamps();
    }

    public function rules()
    {
        return $this->hasMany(PropertyRule::class);
    }

}
