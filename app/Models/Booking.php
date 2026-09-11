<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'booking_number',
        'user_id',
        'property_id',
        'check_in',
        'check_out',
        'adults',
        'children',
        'pets',
        'nights',
        'price_per_night',
        'subtotal',
        'discount',
        'total',
        'currency',
        'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
