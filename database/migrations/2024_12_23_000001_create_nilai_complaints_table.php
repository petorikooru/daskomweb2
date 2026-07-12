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
        Schema::create('nilai_complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nilai_id')->constrained('nilais')->cascadeOnDelete();
            $table->foreignId('praktikan_id')->constrained('praktikans')->cascadeOnDelete();
            $table->text('message');
            $table->enum('status', ['pending', 'resolved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nilai_complaints');
    }
};
