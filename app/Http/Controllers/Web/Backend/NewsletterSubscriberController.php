<?php

namespace App\Http\Controllers\Web\Backend;

use App\Http\Controllers\Controller;
use App\Services\Backend\NewsletterSubscriberService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NewsletterSubscriberController extends Controller
{
    public function __construct(protected NewsletterSubscriberService $service) {}

    /**
     * List all newsletter subscribers with filters.
     */
    public function index(Request $request)
    {
        $subscribers = $this->service->getAll(
            $request->only(['search', 'date']),
            15
        );

        return Inertia::render('backend/newsletter/index', [
            'subscribers' => $subscribers,
            'filters'     => $request->only(['search', 'date']),
        ]);
    }

    /**
     * Delete a subscriber.
     */
    public function destroy(int $id)
    {
        $this->service->delete($id);

        return back()->with('success', 'Subscriber removed successfully.');
    }

    /**
     * Export all subscribers (with active filters) to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $subscribers = $this->service->getAll(
            $request->only(['search', 'date']),
            999999
        );

        $data = $subscribers->items();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="newsletter-subscribers-' . date('Y-m-d_His') . '.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->stream(function () use ($data) {
            $output = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, ['#', 'Email', 'IP Address', 'Subscribed At']);

            foreach ($data as $index => $subscriber) {
                fputcsv($output, [
                    $index + 1,
                    $subscriber->email,
                    $subscriber->ip_address,
                    $subscriber->subscribed_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($output);
        }, 200, $headers);
    }
}
