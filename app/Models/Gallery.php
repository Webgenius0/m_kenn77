<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    protected $fillable = [
        'title',
        'image',
    ];

    public function getImageAttribute($value): ?string
    {
        return $value ? asset('storage/' . $value) : null;
    }
}
