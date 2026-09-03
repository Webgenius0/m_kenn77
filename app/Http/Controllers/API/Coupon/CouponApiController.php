<?php

namespace App\Http\Controllers\API\Coupon;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;

class CouponApiController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $coupons = Coupon::query()
            ->where('is_active', true)
            ->latest()
            ->paginate(6);

        return $this->successResponse('Coupons list', $coupons);
    }
}
