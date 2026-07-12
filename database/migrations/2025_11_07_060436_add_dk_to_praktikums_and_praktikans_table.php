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
        Schema::table('praktikums', function (Blueprint $table) {
            $table->string('dk', 10)->default('DK1')->after('kelas_id')->index();
        });

        Schema::table('praktikans', function (Blueprint $table) {
            $table->string('dk', 10)->default('DK1')->after('kelas_id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikums', function (Blueprint $table) {
            $table->dropColumn('dk');
        });

        Schema::table('praktikans', function (Blueprint $table) {
            $table->dropColumn('dk');
        });
    }
};
