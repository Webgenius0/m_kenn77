<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class GalleryController extends Controller
{
    public function index()
    {
        return Inertia::render('backend/galleries/index', [
            'galleries' => Gallery::latest()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('backend/galleries/create');
    }

    public function store(Request $request)
    {
        Gallery::create($this->validatedData($request));

        return redirect()->route('admin.galleries.index')->with('success', 'Gallery image created successfully.');
    }

    public function edit(Gallery $gallery)
    {
        return Inertia::render('backend/galleries/edit', [
            'gallery' => $gallery,
        ]);
    }

    public function update(Request $request, Gallery $gallery)
    {
        $gallery->update($this->validatedData($request, $gallery));

        return redirect()->route('admin.galleries.index')->with('success', 'Gallery image updated successfully.');
    }

    public function destroy(Gallery $gallery)
    {
        if ($gallery->getRawOriginal('image')) {
            Storage::disk('public')->delete($gallery->getRawOriginal('image'));
        }

        $gallery->delete();

        return redirect()->route('admin.galleries.index')->with('success', 'Gallery image deleted successfully.');
    }

    private function validatedData(Request $request, ?Gallery $gallery = null): array
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => [$gallery ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($gallery?->getRawOriginal('image')) {
                Storage::disk('public')->delete($gallery->getRawOriginal('image'));
            }

            $validated['image'] = $request->file('image')->store('galleries', 'public');
        } else {
            unset($validated['image']);
        }

        return $validated;
    }
}
