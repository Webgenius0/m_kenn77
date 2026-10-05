<?php

namespace App\Http\Controllers\API\Newsletter;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterSubscribeRequest;
use App\Services\Backend\NewsletterSubscriberService;

class NewsletterApiController extends Controller
{
    use ApiResponse;

    public function __construct(protected NewsletterSubscriberService $service) {}

    /**
     * Store a new newsletter subscription.
     *
     * POST /api/v1/newsletter/subscribe
     */
    public function store(NewsletterSubscribeRequest $request)
    {
        try {
            $result = $this->service->subscribe(request: $request);

            if ($result['already_subscribed']) {
                return $this->successResponse(
                    'You are already subscribed to our newsletter.',
                    $result['subscriber'],
                    200
                );
            }

            return $this->successResponse(
                'Thank you for subscribing to our newsletter!',
                $result['subscriber'],
                201
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Failed to subscribe. Please try again later.',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }
}
