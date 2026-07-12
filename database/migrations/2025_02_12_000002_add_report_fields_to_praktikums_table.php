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
            $table->longText('report_notes')->nullable()->after('started_at');
            $table->timestamp('report_submitted_at')->nullable()->after('report_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikums', function (Blueprint $table) {
            $table->dropColumn(['report_notes', 'report_submitted_at']);
        });
    }
};
