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
            if (! Schema::hasColumn('praktikums', 'pj_id')) {
                $table->unsignedBigInteger('pj_id')->nullable()->after('kelas_id');
                $table->foreign('pj_id')
                    ->references('id')
                    ->on('asistens')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikums', function (Blueprint $table) {
            if (Schema::hasColumn('praktikums', 'pj_id')) {
                $table->dropForeign(['pj_id']);
                $table->dropColumn('pj_id');
            }
        });
    }
};
