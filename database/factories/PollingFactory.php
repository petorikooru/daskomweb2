<?php

namespace Database\Factories;

use App\Models\Asisten;
use App\Models\JenisPolling;
use App\Models\Polling;
use App\Models\Praktikan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PollingFactory extends Factory
{
    protected $model = Polling::class;

    public function definition(): array
    {
        return [
            'polling_id' => JenisPolling::factory(),
            'asisten_id' => Asisten::factory(),
            'praktikan_id' => Praktikan::factory(),
        ];
    }
}
