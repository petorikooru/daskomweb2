<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('soal_tas', function (Blueprint $table) {
            $table->string('difficulty', 10)->nullable()->after('pertanyaan')->index();
        });
        Schema::table('soal_tks', function (Blueprint $table) {
            $table->string('difficulty', 10)->nullable()->after('pertanyaan')->index();
        });
    }

    public function down(): void
    {
        Schema::table('soal_tas', fn (Blueprint $table) => $table->dropColumn('difficulty'));
        Schema::table('soal_tks', fn (Blueprint $table) => $table->dropColumn('difficulty'));
    }
};
