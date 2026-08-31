<?php

namespace App\Repository\Backend;

use App\Models\Contact;

class ContactRepository
{
    /**
     * Get all contacts with pagination
     */
    public function getAll(array $filters = [], int $perPage = 15)
    {
        $query = Contact::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['email'])) {
            $query->where('email', 'like', "%{$filters['email']}%");
        }

        if (!empty($filters['date'])) {
            $query->whereDate('created_at', $filters['date']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Find contact by ID
     */
    public function find($id)
    {
        return Contact::find($id);
    }

    /**
     * Find contact by ID or throw
     */
    public function findOrFail($id)
    {
        return Contact::findOrFail($id);
    }

    /**
     * Update contact
     */
    public function update($id, array $data)
    {
        $contact = Contact::findOrFail($id);
        $contact->update($data);
        return $contact;
    }

    /**
     * Delete contact
     */
    public function delete($id)
    {
        $contact = Contact::findOrFail($id);
        return $contact->delete();
    }

    /**
     * Get total contacts count
     */
    public function getTotal()
    {
        return Contact::count();
    }

    /**
     * Get today's contacts count
     */
    public function getTodayCount()
    {
        return Contact::whereDate('created_at', today())->count();
    }
}
