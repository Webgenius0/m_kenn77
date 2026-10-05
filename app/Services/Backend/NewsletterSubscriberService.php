<?php

namespace App\Services\Backend;

use App\Repository\Backend\NewsletterSubscriberRepository;

class NewsletterSubscriberService
{
    protected NewsletterSubscriberRepository $repo;

    public function __construct(NewsletterSubscriberRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Subscribe an email. Returns the subscriber and whether it was newly created.
     */
    public function subscribe($request): array
    {
        $existing = $this->repo->findByEmail($request->email);

        if ($existing) {
            return ['subscriber' => $existing, 'already_subscribed' => true];
        }

        $subscriber = $this->repo->create([
            'email'         => $request->email,
            'ip_address'    => $request->ip(),
            'subscribed_at' => now(),
        ]);

        return ['subscriber' => $subscriber, 'already_subscribed' => false];
    }

    /**
     * Get all subscribers with filters.
     */
    public function getAll(array $filters = [], int $perPage = 15)
    {
        return $this->repo->getAll($filters, $perPage);
    }

    /**
     * Delete a subscriber.
     */
    public function delete(int $id): bool
    {
        return $this->repo->delete($id);
    }

    /**
     * Dashboard stats.
     */
    public function getDashboardStats(): array
    {
        return [
            'total' => $this->repo->getTotal(),
            'today' => $this->repo->getTodayCount(),
        ];
    }
}
