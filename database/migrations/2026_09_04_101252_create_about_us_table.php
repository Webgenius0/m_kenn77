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
        Schema::create('about_us', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('place_one_image')->nullable();
            $table->string('place_one_title')->nullable();
            $table->string('place_one_number')->nullable();
            $table->string('place_two_image')->nullable();
            $table->string('place_two_title')->nullable();
            $table->string('place_two_number')->nullable();
            $table->string('place_three_image')->nullable();
            $table->string('place_three_title')->nullable();
            $table->string('place_three_number')->nullable();
            $table->string('banner_image')->nullable();
            $table->text('story')->nullable();
            $table->text('our_mission')->nullable();
            $table->text('house_difference')->nullable();
            $table->text('our_promise')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('about_us');
    }
};
