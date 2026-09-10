<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Models\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule as ValidationRule;
use Inertia\Inertia;

class RuleController extends Controller
{
    public function index()
    {
        return Inertia::render('backend/rules/index', [
            'rules' => Rule::latest()->get()->map(function (Rule $rule) {
                $rule->icon = $this->resolveIconUrl($rule->icon);

                return $rule;
            }),
        ]);
    }

    public function create()
    {
        return Inertia::render('backend/rules/create');
    }

    public function store(Request $request)
    {
        Rule::create($this->validatedData($request));

        return redirect()->route('admin.rules.index')->with('success', 'Rule created successfully.');
    }

    public function edit(Rule $rule)
    {
        return Inertia::render('backend/rules/edit', [
            'rule' => [
                'id' => $rule->id,
                'rule_type' => $rule->rule_type,
                'icon' => $this->resolveIconUrl($rule->icon),
            ],
        ]);
    }

    public function update(Request $request, Rule $rule)
    {
        $rule->update($this->validatedData($request, $rule));

        return redirect()->route('admin.rules.index')->with('success', 'Rule updated successfully.');
    }

    public function destroy(Rule $rule)
    {
        if ($rule->icon && ! Str::startsWith($rule->getRawOriginal('icon'), ['/icons/', 'http://', 'https://'])) {
            Storage::disk('public')->delete($rule->getRawOriginal('icon'));
        }

        $rule->delete();

        return redirect()->route('admin.rules.index')->with('success', 'Rule deleted successfully.');
    }

    private function resolveIconUrl(?string $icon): ?string
    {
        if (! $icon) {
            return null;
        }

        if (Str::startsWith($icon, ['/icons/', 'http://', 'https://'])) {
            return $icon;
        }

        return asset('storage/' . $icon);
    }

    private function validatedData(Request $request, ?Rule $rule = null): array
    {
        $validated = $request->validate([
            'rule_type' => ['required', 'string', 'max:255', ValidationRule::unique('rules', 'rule_type')->ignore($rule?->id)],
            'icon' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('icon')) {
            if ($rule?->getRawOriginal('icon')) {
                Storage::disk('public')->delete($rule->getRawOriginal('icon'));
            }

            $validated['icon'] = $request->file('icon')->store('rules', 'public');
        } else {
            unset($validated['icon']);
        }

        return $validated;
    }
}
