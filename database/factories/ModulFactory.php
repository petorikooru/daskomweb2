<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Modul>
 */
class ModulFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'judul' => $this->faker->word,
            'deskripsi' => $this->faker->text,
            'isEnglish' => $this->faker->boolean,
            'isUnlocked' => $this->faker->boolean,
            'unlock_config' => null,
        ];

    }
}
