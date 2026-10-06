<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReviewController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('backend/reviews/index', [
            'reviews' => Review::latest()->get()->map(function ($review) {
                return [
                    'id'          => $review->id,
                    'name'        => $review->name,
                    'designation' => $review->designation,
                    'image'       => $review->getRawOriginal('image') ? asset('storage/' . $review->getRawOriginal('image')) : null,
                    'message'     => $review->message,
                    'source'      => $review->source,
                    'created_at'  => $review->created_at,
                ];
            }),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('backend/reviews/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'message'     => ['required', 'string'],
            'source'      => ['nullable', 'string', 'max:255'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('reviews', 'public');
        } else {
            unset($validated['image']);
        }

        Review::create($validated);

        return redirect()->route('admin.reviews.index')->with('success', 'Review created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Review $review)
    {
        return Inertia::render('backend/reviews/edit', [
            'review' => [
                'id'          => $review->id,
                'name'        => $review->name,
                'designation' => $review->designation,
                'image'       => $review->getRawOriginal('image') ? asset('storage/' . $review->getRawOriginal('image')) : null,
                'message'     => $review->message,
                'source'      => $review->source,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Review $review)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'message'     => ['required', 'string'],
            'source'      => ['nullable', 'string', 'max:255'],
        ]);

        if ($request->hasFile('image')) {
            if ($review->getRawOriginal('image')) {
                Storage::disk('public')->delete($review->getRawOriginal('image'));
            }
            $validated['image'] = $request->file('image')->store('reviews', 'public');
        } else {
            unset($validated['image']);
        }

        $review->update($validated);

        return redirect()->route('admin.reviews.index')->with('success', 'Review updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Review $review)
    {
        if ($review->getRawOriginal('image')) {
            Storage::disk('public')->delete($review->getRawOriginal('image'));
        }

        $review->delete();

        return redirect()->route('admin.reviews.index')->with('success', 'Review deleted successfully.');
    }
}
