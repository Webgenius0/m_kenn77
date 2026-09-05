<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyRule extends Model
{
    protected $fillable = [
        'property_id',
        'rule_type',
        'value',
        'icon',
    ];

    public function getIconAttribute($value)
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
