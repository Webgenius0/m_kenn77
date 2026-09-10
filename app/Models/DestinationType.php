<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DestinationType extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'title',
        'description',
        'image',
    ];

    public function getImageAttribute($value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }
}
