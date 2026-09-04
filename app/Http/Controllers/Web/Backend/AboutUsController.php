<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\AboutUs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AboutUsController extends Controller
{
    public function index()
    {
        return Inertia::render('backend/about-us/index', [
            'aboutUs' => AboutUs::firstOrCreate(['id' => 1]),
        ]);
    }

    public function update(Request $request)
    {
        $aboutUs = AboutUs::firstOrCreate(['id' => 1]);
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'story' => ['nullable', 'string'],
            'our_mission' => ['nullable', 'string'],
            'house_difference' => ['nullable', 'string'],
            'our_promise' => ['nullable', 'string'],
            'place_one_title' => ['nullable', 'string', 'max:255'],
            'place_one_number' => ['nullable', 'string', 'max:255'],
            'place_two_title' => ['nullable', 'string', 'max:255'],
            'place_two_number' => ['nullable', 'string', 'max:255'],
            'place_three_title' => ['nullable', 'string', 'max:255'],
            'place_three_number' => ['nullable', 'string', 'max:255'],
            'place_one_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'place_two_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'place_three_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'banner_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        foreach (['place_one_image', 'place_two_image', 'place_three_image', 'banner_image'] as $field) {
            if ($request->hasFile($field)) {
                $oldImage = $aboutUs->getRawOriginal($field);
                if ($oldImage) {
                    Storage::disk('public')->delete($oldImage);
                }
                $data[$field] = $request->file($field)->store('about-us', 'public');
            } else {
                unset($data[$field]);
            }
        }

        $aboutUs->update($data);

        return back()->with('success', 'About Us information updated successfully.');
    }
}
