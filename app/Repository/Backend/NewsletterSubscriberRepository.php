<?php

namespace App\Repository\Backend;

use App\Models\NewsletterSubscriber;

class NewsletterSubscriberRepository
{
    /**
     * Get all subscribers with optional filters and pagination.
     */
    public function getAll(array $filters = [], int $perPage = 15)
    {
        $query = NewsletterSubscriber::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('email', 'like', "%{$search}%");
        }

        if (!empty($filters['date'])) {
            $query->whereDate('subscribed_at', $filters['date']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Find a subscriber by email.
     */
    public function findByEmail(string $email): ?NewsletterSubscriber
    {
        return NewsletterSubscriber::where('email', $email)->first();
    }

    /**
     * Create a new subscriber.
     */
    public function create(array $data): NewsletterSubscriber
    {
        return NewsletterSubscriber::create($data);
    }

    /**
     * Reactivate an unsubscribed email.
     */
    public function reactivate(NewsletterSubscriber $subscriber): NewsletterSubscriber
    {
        $subscriber->update([
            'subscribed_at' => now(),
        ]);
        return $subscriber->fresh();
    }

    /**
     * Delete a subscriber by ID.
     */
    public function delete(int $id): bool
    {
        return NewsletterSubscriber::findOrFail($id)->delete();
    }

    /**
     * Total active subscriber count.
     */
    public function getTotal(): int
    {
        return NewsletterSubscriber::count();
    }

    /**
     * Count of subscribers who signed up today.
     */
    public function getTodayCount(): int
    {
        return NewsletterSubscriber::whereDate('subscribed_at', today())->count();
    }
}
