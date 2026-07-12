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
        Schema::create('tugaspendahuluan_kelas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tugaspendahuluan_id');
            $table->unsignedBigInteger('kelas_id');
            $table->timestamps();

            $table->foreign('tugaspendahuluan_id')
                ->references('id')
                ->on('tugaspendahuluans')
                ->onDelete('cascade');

            $table->foreign('kelas_id')
                ->references('id')
                ->on('kelas')
                ->onDelete('cascade');

            $table->unique(['tugaspendahuluan_id', 'kelas_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tugaspendahuluan_kelas');
    }
};
