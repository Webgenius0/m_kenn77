<?php

namespace App\Services\Backend;

use App\Repository\Backend\ContactRepository;

class ContactService
{
    protected $repo;

    /**
     * Create a new class instance.
     */
    public function __construct(ContactRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Get all contacts with filters
     */
    public function getAll(array $filters = [], int $perPage = 15)
    {
        return $this->repo->getAll($filters, $perPage);
    }

    /**
     * Get single contact
     */
    public function getById($id)
    {
        return $this->repo->findOrFail($id);
    }

    /**
     * Update contact
     */
    public function update($id, array $validated)
    {
        return $this->repo->update($id, $validated);
    }

    /**
     * Delete contact
     */
    public function delete($id)
    {
        return $this->repo->delete($id);
    }

    /**
     * Get dashboard stats
     */
    public function getDashboardStats()
    {
        return [
            'total' => $this->repo->getTotal(),
            'today' => $this->repo->getTodayCount(),
        ];
    }
}
