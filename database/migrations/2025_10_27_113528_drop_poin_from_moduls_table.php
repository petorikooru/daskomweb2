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
        Schema::table('moduls', function (Blueprint $table) {
            if (Schema::hasColumn('moduls', 'poin1')) {
                $table->dropColumn('poin1');
            }

            if (Schema::hasColumn('moduls', 'poin2')) {
                $table->dropColumn('poin2');
            }

            if (Schema::hasColumn('moduls', 'poin3')) {
                $table->dropColumn('poin3');
            }

            $table->longText('deskripsi')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('moduls', function (Blueprint $table) {
            if (! Schema::hasColumn('moduls', 'poin1')) {
                $table->text('poin1');
            }

            if (! Schema::hasColumn('moduls', 'poin2')) {
                $table->text('poin2');
            }

            if (! Schema::hasColumn('moduls', 'poin3')) {
                $table->text('poin3')->nullable();
            }

        });
    }
};
