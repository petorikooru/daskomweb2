<?php

namespace Database\Factories;

use App\Enums\TipeSoal;
use App\Models\Praktikan;
use App\Models\SoalComment;
use App\Models\SoalTa;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SoalComment>
 */
class SoalCommentFactory extends Factory
{
    protected $model = SoalComment::class;

    public function definition(): array
    {
        return [
            'soal_id' => SoalTa::factory(),
            'tipe_soal' => TipeSoal::TA,
            'praktikan_id' => Praktikan::factory(),
            'comment' => $this->faker->realText(120),
        ];
    }
}
