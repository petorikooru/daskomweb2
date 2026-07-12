<?php

namespace Database\Factories;

use App\Models\SoalOpsi;
use App\Models\SoalTa;
use Illuminate\Database\Eloquent\Factories\Factory;

class SoalTaFactory extends Factory
{
    protected $model = SoalTa::class;

    public function definition()
    {
        return [
            'modul_id' => $this->faker->numberBetween(11, 15),
            'pertanyaan' => $this->faker->sentence,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function configure()
    {
        $faker = $this->faker;

        return $this->afterCreating(function (SoalTa $soal) use ($faker) {
            $options = collect(range(1, 4))->map(function () use ($soal, $faker) {
                return SoalOpsi::create([
                    'soal_type' => SoalOpsi::TYPE_TA,
                    'soal_id' => $soal->id,
                    'text' => $faker->sentence,
                ]);
            })->values();

            $correctIndex = $faker->numberBetween(0, 3);

            $soal->update([
                'opsi1_id' => $options[0]->id,
                'opsi2_id' => $options[1]->id,
                'opsi3_id' => $options[2]->id,
                'opsi_benar_id' => $options[$correctIndex]->id,
            ]);
        });
    }
}
