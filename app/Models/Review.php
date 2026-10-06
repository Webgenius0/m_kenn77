<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'name',
        'designation',
        'image',
        'message',
        'source',
    ];

    public function getImageAttribute($value)
    {
        return $value ? asset($value) : null;
    }
}
