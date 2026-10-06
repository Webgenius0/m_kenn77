<?php

namespace App\Http\Controllers\API\Review;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewApiController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/reviews
     *
     * Returns a paginated list of all reviews.
     *
     * Query params:
     *   per_page  (int, default 10)  – items per page
     */
    public function index(Request $request): JsonResponse
    {

        $perPage  = (int) $request->input('per_page', 10);
        $reviews  = Review::latest()->paginate($perPage);

        $reviews->getCollection()->transform(fn ($r) => $this->formatReview($r));

        return $this->successResponse('Reviews retrieved successfully.', $reviews);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function formatReview(Review $review): array
    {
        return [
            'id'          => $review->id,
            'name'        => $review->name,
            'designation' => $review->designation,
            'image'       => $review->image,
            'message'     => $review->message,
            'source'      => $review->source,
        ];
    }
}
