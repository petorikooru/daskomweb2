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
            if (! Schema::hasColumn('praktikums', 'status')) {
                $table->string('status')->default('idle')->after('isActive');
            }

            if (! Schema::hasColumn('praktikums', 'current_phase')) {
                $table->string('current_phase')->nullable()->after('status');
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
                Schema::hasColumn('praktikums', 'status') ? 'status' : null,
                Schema::hasColumn('praktikums', 'current_phase') ? 'current_phase' : null,
            ]);

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
