<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('question_randomization_configs', function (Blueprint $table) {
            $table->string('category', 10)->after('modul_id');
            $table->unsignedSmallInteger('easy_count')->default(5)->after('category');
            $table->unsignedSmallInteger('medium_count')->default(4)->after('easy_count');
            $table->unsignedSmallInteger('hard_count')->default(1)->after('medium_count');
            $table->boolean('enabled')->default(false)->after('hard_count');
            $table->unique(['modul_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::table('question_randomization_configs', function (Blueprint $table) {
            $table->dropUnique(['modul_id', 'category']);
            $table->dropColumn(['category', 'easy_count', 'medium_count', 'hard_count', 'enabled']);
        });
    }
};
