<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rule extends Model
{
    protected $fillable = [
        'rule_type',
        'icon',
    ];

    public function properties()
    {
        return $this->belongsToMany(Property::class, 'property_rule')->withPivot('value')->withTimestamps();
    }
}
