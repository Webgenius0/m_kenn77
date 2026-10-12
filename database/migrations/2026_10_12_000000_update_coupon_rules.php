<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->renameColumn('image', 'coupon_image');
            $table->renameColumn('type', 'discount_type');
            $table->renameColumn('value', 'discount_value');
            $table->renameColumn('min_night', 'minimum_nights');
            $table->renameColumn('is_active', 'status');
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->string('type')->default('general')->after('subtitle');
            $table->decimal('minimum_booking_amount', 10, 2)->nullable()->after('minimum_nights');
            $table->unsignedInteger('advance_booking_days')->nullable()->after('minimum_booking_amount');
            $table->json('applicable_days')->nullable()->after('advance_booking_days');
            $table->integer('minimum_nights')->nullable()->default(null)->change();
        });

        DB::table('coupons')
            ->whereRaw('LOWER(discount_type) = ?', ['percent'])
            ->update(['discount_type' => 'percentage']);
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn(['type', 'minimum_booking_amount', 'advance_booking_days', 'applicable_days']);
            $table->integer('minimum_nights')->default(0)->nullable(false)->change();
            $table->renameColumn('coupon_image', 'image');
            $table->renameColumn('discount_type', 'type');
            $table->renameColumn('discount_value', 'value');
            $table->renameColumn('minimum_nights', 'min_night');
            $table->renameColumn('status', 'is_active');
        });
    }
};
