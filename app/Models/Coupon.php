<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'coupon_image',
        'type',
        'code',
        'discount_type',
        'discount_value',
        'minimum_nights',
        'minimum_booking_amount',
        'advance_booking_days',
        'applicable_days',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'minimum_nights' => 'integer',
        'minimum_booking_amount' => 'decimal:2',
        'advance_booking_days' => 'integer',
        'applicable_days' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'status' => 'boolean',
    ];

    protected $appends = ['image', 'value', 'min_night', 'is_active'];

    public function setCodeAttribute(string $value): void
    {
        $this->attributes['code'] = strtoupper(trim($value));
    }

    public function getCouponImageAttribute(?string $value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function getImageAttribute(): ?string
    {
        return $this->coupon_image;
    }

    public function getValueAttribute(): string
    {
        return $this->discount_value;
    }

    public function getMinNightAttribute(): ?int
    {
        return $this->minimum_nights;
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status;
    }
}
