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
        Schema::table('jawaban_jurnals', function (Blueprint $table) {
            $table->string('attachment_url')->nullable()->after('jawaban');
            $table->string('attachment_file_id')->nullable()->after('attachment_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jawaban_jurnals', function (Blueprint $table) {
            $table->dropColumn(['attachment_url', 'attachment_file_id']);
        });
    }
};
