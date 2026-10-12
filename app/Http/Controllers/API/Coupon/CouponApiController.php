<?php

namespace App\Http\Controllers\API\Coupon;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Property;
use App\Services\Coupon\CouponDiscountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CouponApiController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly CouponDiscountService $couponDiscountService) {}

    public function index(): JsonResponse
    {
        $coupons = Coupon::query()
            ->where('status', true)
            ->latest()
            ->paginate(6);

        return $this->successResponse('Coupons list', $coupons);
    }

    public function couponCalculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'coupon_code' => ['required', 'string', 'max:100'],
            'property_id' => ['required'],
            'check_in' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'check_out' => ['required', 'date_format:Y-m-d', 'after:check_in'],
        ]);

        $property = is_numeric($validated['property_id'])
            ? Property::findOrFail($validated['property_id'])
            : Property::where('slug', $validated['property_id'])
                ->orWhere('id', $validated['property_id'])
                ->firstOrFail();

        $checkIn = Carbon::parse($validated['check_in']);
        $checkOut = Carbon::parse($validated['check_out']);
        $nights = (int) $checkIn->diffInDays($checkOut);
        $pricePerNight = (float) ($property->price_per_night ?? 0);
        $subtotal = round($nights * $pricePerNight, 2);
        $couponData = $this->couponDiscountService->calculate(
            $validated['coupon_code'],
            $subtotal,
            $nights,
            $checkIn,
            $pricePerNight
        );
        $valid = $couponData['coupon'] !== null;
        $discount = $couponData['discount'];

        return $this->successResponse(
            $valid ? 'Coupon applied' : 'Coupon is invalid or not applicable to this booking',
            [
                'coupon' => $couponData['coupon'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => max(0, round($subtotal - $discount, 2)),
            ]
        );
    }
}
