<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop legacy essay scaffolding columns.
        $essayTables = [
            'soal_fitbs',
            'soal_jurnals',
            'soal_mandiris',
            'soal_tas',
            'soal_tks',
        ];

        foreach ($essayTables as $table) {
            if (Schema::hasColumn($table, 'pengantar')) {
                DB::statement("ALTER TABLE {$table} DROP COLUMN pengantar");
            }

            if (Schema::hasColumn($table, 'kodingan')) {
                DB::statement("ALTER TABLE {$table} DROP COLUMN kodingan");
            }
        }

        // Drop TP flags.
        if (Schema::hasColumn('soal_tps', 'isProgram')) {
            DB::statement('ALTER TABLE soal_tps DROP COLUMN isProgram');
        }

        if (Schema::hasColumn('soal_tps', 'isEssay')) {
            DB::statement('ALTER TABLE soal_tps DROP COLUMN isEssay');
        }

        // Drop TA/TK free-text answer columns.
        $taAnswerColumns = ['jawaban_benar', 'jawaban_salah1', 'jawaban_salah2', 'jawaban_salah3'];

        foreach ($taAnswerColumns as $column) {
            if (Schema::hasColumn('soal_tas', $column)) {
                DB::statement("ALTER TABLE soal_tas DROP COLUMN {$column}");
            }

            if (Schema::hasColumn('soal_tks', $column)) {
                DB::statement("ALTER TABLE soal_tks DROP COLUMN {$column}");
            }
        }

        // Create shared option table.
        Schema::create('soal_opsis', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('soal_type', 5);
            $table->unsignedBigInteger('soal_id');
            $table->text('text');
            $table->timestamps();

            $table->index(['soal_type', 'soal_id'], 'soal_opsis_type_soal_index');
        });

        // Add option relations to soal_tas.
        Schema::table('soal_tas', function (Blueprint $table) {
            $table->unsignedBigInteger('opsi1_id')->nullable()->after('modul_id');
            $table->unsignedBigInteger('opsi2_id')->nullable()->after('opsi1_id');
            $table->unsignedBigInteger('opsi3_id')->nullable()->after('opsi2_id');
            $table->unsignedBigInteger('opsi_benar_id')->nullable()->after('opsi3_id');

            $table->foreign('opsi1_id')->references('id')->on('soal_opsis')->nullOnDelete();
            $table->foreign('opsi2_id')->references('id')->on('soal_opsis')->nullOnDelete();
            $table->foreign('opsi3_id')->references('id')->on('soal_opsis')->nullOnDelete();
            $table->foreign('opsi_benar_id')->references('id')->on('soal_opsis')->nullOnDelete();
        });

        // Add option relations to soal_tks.
        Schema::table('soal_tks', function (Blueprint $table) {
            $table->unsignedBigInteger('opsi1_id')->nullable()->after('modul_id');
            $table->unsignedBigInteger('opsi2_id')->nullable()->after('opsi1_id');
            $table->unsignedBigInteger('opsi3_id')->nullable()->after('opsi2_id');
            $table->unsignedBigInteger('opsi_benar_id')->nullable()->after('opsi3_id');

            $table->foreign('opsi1_id')->references('id')->on('soal_opsis')->nullOnDelete();
            $table->foreign('opsi2_id')->references('id')->on('soal_opsis')->nullOnDelete();
            $table->foreign('opsi3_id')->references('id')->on('soal_opsis')->nullOnDelete();
            $table->foreign('opsi_benar_id')->references('id')->on('soal_opsis')->nullOnDelete();
        });

        // Migrate jawaban tables to option-based answers.
        if (Schema::hasColumn('jawaban_tas', 'jawaban')) {
            DB::statement('ALTER TABLE jawaban_tas DROP COLUMN jawaban');
        }

        Schema::table('jawaban_tas', function (Blueprint $table) {
            $table->unsignedBigInteger('opsi_id')->nullable()->after('modul_id');
            $table->unique(['soal_id', 'praktikan_id'], 'jawaban_tas_soal_praktikan_unique');
            $table->foreign('opsi_id')->references('id')->on('soal_opsis')->nullOnDelete();
        });

        if (Schema::hasColumn('jawaban_tks', 'jawaban')) {
            DB::statement('ALTER TABLE jawaban_tks DROP COLUMN jawaban');
        }

        Schema::table('jawaban_tks', function (Blueprint $table) {
            $table->unsignedBigInteger('opsi_id')->nullable()->after('modul_id');
            $table->unique(['soal_id', 'praktikan_id'], 'jawaban_tks_soal_praktikan_unique');
            $table->foreign('opsi_id')->references('id')->on('soal_opsis')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert jawaban tables.
        Schema::table('jawaban_tas', function (Blueprint $table) {
            $table->dropForeign(['opsi_id']);
            $table->dropUnique('jawaban_tas_soal_praktikan_unique');
            $table->dropColumn('opsi_id');
            $table->text('jawaban')->after('modul_id');
        });

        Schema::table('jawaban_tks', function (Blueprint $table) {
            $table->dropForeign(['opsi_id']);
            $table->dropUnique('jawaban_tks_soal_praktikan_unique');
            $table->dropColumn('opsi_id');
            $table->text('jawaban')->after('modul_id');
        });

        // Remove option relations from soal_tas.
        Schema::table('soal_tas', function (Blueprint $table) {
            $table->dropForeign(['opsi1_id']);
            $table->dropForeign(['opsi2_id']);
            $table->dropForeign(['opsi3_id']);
            $table->dropForeign(['opsi_benar_id']);

            $table->dropColumn(['opsi1_id', 'opsi2_id', 'opsi3_id', 'opsi_benar_id']);

            $table->text('pengantar');
            $table->text('kodingan');
            $table->text('jawaban_benar');
            $table->text('jawaban_salah1');
            $table->text('jawaban_salah2');
            $table->text('jawaban_salah3');
        });

        // Remove option relations from soal_tks.
        Schema::table('soal_tks', function (Blueprint $table) {
            $table->dropForeign(['opsi1_id']);
            $table->dropForeign(['opsi2_id']);
            $table->dropForeign(['opsi3_id']);
            $table->dropForeign(['opsi_benar_id']);

            $table->dropColumn(['opsi1_id', 'opsi2_id', 'opsi3_id', 'opsi_benar_id']);

            $table->text('pengantar');
            $table->text('kodingan');
            $table->text('jawaban_benar');
            $table->text('jawaban_salah1');
            $table->text('jawaban_salah2');
            $table->text('jawaban_salah3');
        });

        Schema::dropIfExists('soal_opsis');

        // Restore TP flags.
        Schema::table('soal_tps', function (Blueprint $table) {
            $table->boolean('isProgram')->nullable()->default(false);
            $table->boolean('isEssay')->nullable()->default(false);
        });

        // Restore essay scaffolding columns.
        $essayTables = [
            'soal_fitbs',
            'soal_jurnals',
            'soal_mandiris',
        ];

        foreach ($essayTables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->text('pengantar');
                $table->text('kodingan');
            });
        }
    }
};
