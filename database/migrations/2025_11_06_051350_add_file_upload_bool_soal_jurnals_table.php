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
        Schema::table('soal_jurnals', function (Blueprint $table) {
            $table->boolean('enable_file_upload')->default(false)->after('soal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('soal_jurnals', function (Blueprint $table) {
            $table->dropColumn(['enable_file_upload']);
        });
    }
};
