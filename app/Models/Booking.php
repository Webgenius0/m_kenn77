<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'booking_number',
        'user_id',
        'property_id',
        'coupon_id',
        'coupon_code',
        'guest_name',
        'guest_email',
        'guest_phone',
        'special_requests',
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
        'status',
        'hospitable_synced',
        'hospitable_sync_error',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'hospitable_synced' => 'boolean',
        'price_per_night' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
