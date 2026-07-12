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
        Schema::table('laporan_praktikans', function (Blueprint $table) {
            $table->float('rating_praktikum')->nullable()->after('pesan');
            $table->float('rating_asisten')->nullable()->after('rating_praktikum');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_praktikans', function (Blueprint $table) {
            $table->dropColumn(['rating_praktikum', 'rating_asisten']);
        });
    }
};
