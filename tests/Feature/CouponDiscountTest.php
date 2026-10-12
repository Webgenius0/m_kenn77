<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Property;
use App\Services\Coupon\CouponDiscountService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CouponDiscountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-12 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_general_coupon_applies_minimums_but_ignores_advance_days(): void
    {
        $coupon = $this->createCoupon([
            'type' => 'general',
            'minimum_nights' => 4,
            'minimum_booking_amount' => 100,
            'advance_booking_days' => 60,
        ]);

        $result = $this->calculate($coupon->code, 400, 4, '2026-10-16', 100);

        $this->assertSame(40.0, $result['discount']);
        $this->assertSame($coupon->id, $result['coupon']->id);
        $this->assertSame(
            ['discount' => 0.0, 'coupon' => null],
            $this->calculate($coupon->code, 400, 3, '2026-10-16', 100)
        );
        $this->assertSame(
            ['discount' => 0.0, 'coupon' => null],
            $this->calculate($coupon->code, 99, 4, '2026-10-16', 100)
        );
    }

    public function test_applicable_days_discount_only_the_matching_nights(): void
    {
        $coupon = $this->createCoupon([
            'type' => 'day_based',
            'discount_value' => 25,
            'applicable_days' => ['saturday', 'sunday'],
        ]);

        $result = $this->calculate($coupon->code, 300, 3, '2026-10-16', 100);

        $this->assertSame(50.0, $result['discount']);
        $this->assertSame($coupon->id, $result['coupon']->id);
    }

    public function test_early_bird_and_last_minute_advance_thresholds_are_enforced(): void
    {
        $earlyBird = $this->createCoupon([
            'type' => 'early_bird',
            'advance_booking_days' => 30,
        ]);
        $lastMinute = $this->createCoupon([
            'code' => 'LASTMINUTE',
            'type' => 'last_minute',
            'advance_booking_days' => 3,
        ]);

        $this->assertSame(
            ['discount' => 0.0, 'coupon' => null],
            $this->calculate($earlyBird->code, 100, 1, '2026-10-22', 100)
        );
        $this->assertSame(
            ['discount' => 0.0, 'coupon' => null],
            $this->calculate($lastMinute->code, 100, 1, '2026-10-20', 100)
        );
        $this->assertSame(
            10.0,
            $this->calculate($lastMinute->code, 100, 1, '2026-10-14', 100)['discount']
        );
    }

    public function test_coupon_calculate_api_returns_frontend_booking_totals(): void
    {
        $coupon = $this->createCoupon([
            'code' => 'API10',
            'discount_value' => 10,
        ]);
        $property = Property::create([
            'name' => 'Coupon API Property',
            'slug' => 'coupon-api-property',
            'price_per_night' => 100,
            'max_guests' => 2,
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/coupons/calculate', [
            'coupon_code' => $coupon->code,
            'property_id' => $property->id,
            'check_in' => '2026-10-16',
            'check_out' => '2026-10-18',
        ])
            ->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.nights', 2)
            ->assertJsonPath('data.subtotal', 200)
            ->assertJsonPath('data.discount', 20)
            ->assertJsonPath('data.total', 180);
    }

    private function createCoupon(array $overrides = []): Coupon
    {
        return Coupon::create(array_merge([
            'title' => 'Test coupon',
            'type' => 'general',
            'code' => 'TEST' . random_int(1000, 9999),
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'minimum_nights' => null,
            'minimum_booking_amount' => null,
            'advance_booking_days' => null,
            'applicable_days' => null,
            'status' => true,
        ], $overrides));
    }

    private function calculate(string $code, float $subtotal, int $nights, string $checkIn, float $pricePerNight): array
    {
        return app(CouponDiscountService::class)->calculate(
            $code,
            $subtotal,
            $nights,
            Carbon::parse($checkIn),
            $pricePerNight,
        );
    }
}
