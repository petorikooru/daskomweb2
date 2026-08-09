<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('question_randomization_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modul_id')->constrained('moduls')->cascadeOnDelete();
            $table->string('category', 10);
            $table->unsignedSmallInteger('easy_count')->default(5);
            $table->unsignedSmallInteger('medium_count')->default(4);
            $table->unsignedSmallInteger('hard_count')->default(1);
            $table->boolean('enabled')->default(false);
            $table->timestamps();
            $table->unique(['modul_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_randomization_configs');
    }
};
