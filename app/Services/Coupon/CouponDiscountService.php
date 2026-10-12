<?php

namespace App\Services\Coupon;

use App\Models\Coupon;
use Illuminate\Support\Carbon;

class CouponDiscountService
{
    /**
     * Validate and calculate the discount for a coupon and booking.
     *
     * @return array{discount: float, coupon: Coupon|null}
     */
    public function calculate(
        ?string $code,
        float $subtotal,
        int $nights,
        Carbon $checkIn,
        float $pricePerNight
    ): array {
        if (blank($code)) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        $coupon = Coupon::query()
            ->whereRaw('UPPER(TRIM(code)) = ?', [strtoupper(trim($code))])
            ->where('status', true)
            ->first();

        if (! $coupon) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        $now = now();
        if (($coupon->starts_at && $now->lt($coupon->starts_at))
            || ($coupon->ends_at && $now->gt($coupon->ends_at))) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        if ($coupon->minimum_nights && $nights < $coupon->minimum_nights) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        if ($coupon->minimum_booking_amount !== null && $subtotal < (float) $coupon->minimum_booking_amount) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        $daysUntilCheckIn = (int) now()->startOfDay()->diffInDays($checkIn->copy()->startOfDay());
        if ($coupon->type === 'early_bird' && (
            $coupon->advance_booking_days === null
            || $daysUntilCheckIn < $coupon->advance_booking_days
        )) {
            return ['discount' => 0.0, 'coupon' => null];
        }
        if ($coupon->type === 'last_minute' && (
            $coupon->advance_booking_days === null
            || $daysUntilCheckIn > $coupon->advance_booking_days
        )) {
            return ['discount' => 0.0, 'coupon' => null];
        }

        $applicableDays = $coupon->applicable_days ?? [];
        $eligibleSubtotal = $subtotal;
        if ($applicableDays !== []) {
            $eligibleNights = 0;
            for ($night = 0; $night < $nights; $night++) {
                $dayOfWeek = strtolower($checkIn->copy()->addDays($night)->format('l'));
                if (in_array($dayOfWeek, $applicableDays, true)) {
                    $eligibleNights++;
                }
            }
            $eligibleSubtotal = round($eligibleNights * $pricePerNight, 2);
            if ($eligibleNights === 0) {
                return ['discount' => 0.0, 'coupon' => null];
            }
        }

        $value = (float) $coupon->discount_value;
        $discount = $coupon->discount_type === 'percentage'
            ? round(($eligibleSubtotal * $value) / 100, 2)
            : min($value, $eligibleSubtotal);

        return [
            'discount' => $discount,
            'coupon' => $coupon,
        ];
    }
}
