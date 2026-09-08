<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyRoom extends Model
{
    protected $fillable = [
        'property_id',
        'name',
        'bed_type',
        'quantity',
        'image',
    ];

    public function getImageAttribute($value)
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
