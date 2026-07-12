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
            if (! Schema::hasColumn('praktikums', 'phase_elapsed_seconds')) {
                $table->unsignedInteger('phase_elapsed_seconds')->default(0)->after('current_phase');
            }

            if (! Schema::hasColumn('praktikums', 'phase_started_at')) {
                $table->timestamp('phase_started_at')->nullable()->after('phase_elapsed_seconds');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('praktikums', function (Blueprint $table) {
            $columnsToDrop = array_filter([
                Schema::hasColumn('praktikums', 'phase_started_at') ? 'phase_started_at' : null,
                Schema::hasColumn('praktikums', 'phase_elapsed_seconds') ? 'phase_elapsed_seconds' : null,
            ]);

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
