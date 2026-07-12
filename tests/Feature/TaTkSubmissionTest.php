<?php

namespace Tests\Feature;

use App\Models\JawabanTa;
use App\Models\JawabanTk;
use App\Models\Modul;
use App\Models\Praktikan;
use App\Models\SoalTa;
use App\Models\SoalTk;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class TaTkSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
    }

    public function test_many_praktikans_can_submit_ta_answers_without_conflict(): void
    {
        $modul = Modul::factory()->create(['isUnlocked' => true]);
        $questions = SoalTa::factory()->count(6)->for($modul)->create()->load('options');
        $praktikans = Praktikan::factory()->count(30)->create();

        foreach ($praktikans as $praktikan) {
            $this->actingAs($praktikan, 'praktikan');

            $response = $this->postJson('/api-v1/jawaban-ta', [
                'praktikan_id' => $praktikan->id,
                'modul_id' => $modul->id,
                'answers' => $this->buildAnswerPayload($questions),
            ]);

            $response->assertOk()->assertJsonFragment(['status' => 'success']);
        }

        $this->assertSame($praktikans->count() * $questions->count(), JawabanTa::count());
    }

    public function test_many_praktikans_can_submit_tk_answers_without_conflict(): void
    {
        $modul = Modul::factory()->create(['isUnlocked' => true]);
        $questions = SoalTk::factory()->count(5)->for($modul)->create()->load('options');
        $praktikans = Praktikan::factory()->count(40)->create();

        foreach ($praktikans as $praktikan) {
            $this->actingAs($praktikan, 'praktikan');

            $response = $this->postJson('/api-v1/jawaban-tk', [
                'praktikan_id' => $praktikan->id,
                'modul_id' => $modul->id,
                'answers' => $this->buildAnswerPayload($questions),
            ]);

            $response->assertOk()->assertJsonFragment(['status' => 'success']);
        }

        $this->assertSame($praktikans->count() * $questions->count(), JawabanTk::count());
    }

    public function test_ta_submission_without_answers_returns_zero_and_clears_existing_records(): void
    {
        $modul = Modul::factory()->create();
        $questions = SoalTa::factory()->count(4)->for($modul)->create()->load('options');
        $praktikan = Praktikan::factory()->create();
        $question = $questions->first();
        $optionId = $question->options->first()->id;

        JawabanTa::create([
            'praktikan_id' => $praktikan->id,
            'modul_id' => $modul->id,
            'soal_id' => $question->id,
            'opsi_id' => $optionId,
        ]);

        $this->actingAs($praktikan, 'praktikan');

        $response = $this->postJson('/api-v1/jawaban-ta', [
            'praktikan_id' => $praktikan->id,
            'modul_id' => $modul->id,
            'answers' => [],
        ]);

        $response->assertOk()->assertJsonFragment([
            'status' => 'success',
            'nilai_ta' => 0,
        ]);

        $this->assertDatabaseMissing('jawaban_tas', [
            'praktikan_id' => $praktikan->id,
            'modul_id' => $modul->id,
        ]);
    }

    public function test_tk_submission_without_answers_returns_zero_and_clears_existing_records(): void
    {
        $modul = Modul::factory()->create();
        $questions = SoalTk::factory()->count(4)->for($modul)->create()->load('options');
        $praktikan = Praktikan::factory()->create();
        $question = $questions->first();
        $optionId = $question->options->first()->id;

        JawabanTk::create([
            'praktikan_id' => $praktikan->id,
            'modul_id' => $modul->id,
            'soal_id' => $question->id,
            'opsi_id' => $optionId,
        ]);

        $this->actingAs($praktikan, 'praktikan');

        $response = $this->postJson('/api-v1/jawaban-tk', [
            'praktikan_id' => $praktikan->id,
            'modul_id' => $modul->id,
            'answers' => [],
        ]);

        $response->assertOk()->assertJsonFragment([
            'status' => 'success',
            'nilai_tk' => 0,
        ]);

        $this->assertDatabaseMissing('jawaban_tks', [
            'praktikan_id' => $praktikan->id,
            'modul_id' => $modul->id,
        ]);
    }

    /**
     * @param  Collection<int, SoalTa|SoalTk>  $questions
     */
    protected function buildAnswerPayload(Collection $questions): array
    {
        return $questions->map(function ($question) {
            $optionId = $question->options->first()->id ?? $question->options()->first()->id;

            return [
                'soal_id' => $question->id,
                'opsi_id' => $optionId,
            ];
        })->all();
    }
}
