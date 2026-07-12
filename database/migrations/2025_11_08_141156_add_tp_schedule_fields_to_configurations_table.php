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
        Schema::table('configurations', function (Blueprint $table) {
            $table->boolean('tp_schedule_enabled')
                ->default(false)
                ->after('tp_activation');
            $table->timestamp('tp_schedule_start_at')
                ->nullable()
                ->after('tp_schedule_enabled');
            $table->timestamp('tp_schedule_end_at')
                ->nullable()
                ->after('tp_schedule_start_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('configurations', function (Blueprint $table) {
            $table->dropColumn([
                'tp_schedule_enabled',
                'tp_schedule_start_at',
                'tp_schedule_end_at',
            ]);
        });
    }
};
