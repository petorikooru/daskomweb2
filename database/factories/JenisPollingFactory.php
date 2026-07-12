<?php

namespace Database\Factories;

use App\Models\JenisPolling;
use Illuminate\Database\Eloquent\Factories\Factory;

class JenisPollingFactory extends Factory
{
    protected $model = JenisPolling::class;

    public function definition(): array
    {
        return [
            'judul' => $this->faker->unique()->sentence(3),
        ];
    }
}
