<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('guest_name')->nullable()->after('coupon_code');
            $table->string('guest_email')->nullable()->after('guest_name');
            $table->string('guest_phone')->nullable()->after('guest_email');
            $table->text('special_requests')->nullable()->after('guest_phone');
            $table->boolean('hospitable_synced')->default(false)->after('status');
            $table->text('hospitable_sync_error')->nullable()->after('hospitable_synced');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->json('payload')->nullable()->after('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'guest_name',
                'guest_email',
                'guest_phone',
                'special_requests',
                'hospitable_synced',
                'hospitable_sync_error',
            ]);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('payload');
        });
    }
};
