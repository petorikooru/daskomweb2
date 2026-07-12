<?php

namespace Tests\Feature;

use App\Models\Configuration;
use App\Models\Modul;
use App\Models\Tugaspendahuluan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ConfigurationScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
        Cache::flush();
    }

    protected function seedConfiguration(array $overrides = []): Configuration
    {
        return Configuration::create(array_merge([
            'registrationPraktikan_activation' => true,
            'registrationAsisten_activation' => true,
            'tp_activation' => false,
            'tp_schedule_enabled' => false,
            'tp_schedule_start_at' => null,
            'tp_schedule_end_at' => null,
            'tubes_activation' => false,
            'secretfeature_activation' => false,
            'polling_activation' => false,
            'kode_asisten' => 'CFG',
        ], $overrides));
    }

    public function test_configuration_endpoint_auto_enables_tp_during_schedule(): void
    {
        $this->seedConfiguration([
            'tp_activation' => false,
            'tp_schedule_enabled' => true,
            'tp_schedule_start_at' => now()->subMinutes(5),
            'tp_schedule_end_at' => now()->addMinutes(5),
        ]);

        $response = $this->getJson('/api-v1/config');

        $response
            ->assertOk()
            ->assertJsonPath('config.tp_activation', true);

        $this->assertDatabaseHas('configurations', [
            'tp_activation' => true,
        ]);
    }

    public function test_tugas_pendahuluan_meta_reflects_schedule_window(): void
    {
        $this->seedConfiguration([
            'tp_activation' => true,
            'tp_schedule_enabled' => true,
            'tp_schedule_start_at' => now()->addHour(),
            'tp_schedule_end_at' => now()->addHours(2),
        ]);

        $modul = Modul::factory()->create(['isEnglish' => 0]);

        Tugaspendahuluan::create([
            'modul_id' => $modul->id,
            'pembahasan' => 'Pengantar',
            'isActive' => 1,
        ]);

        $response = $this->getJson('/api-v1/tugas-pendahuluan');

        $response
            ->assertOk()
            ->assertJsonPath('meta.tp_active', false);

        $this->assertDatabaseHas('configurations', [
            'tp_activation' => false,
        ]);
    }

    public function test_schedule_state_cached_after_request(): void
    {
        $config = $this->seedConfiguration([
            'tp_activation' => false,
            'tp_schedule_enabled' => true,
            'tp_schedule_start_at' => now()->subMinutes(2),
            'tp_schedule_end_at' => now()->addMinutes(8),
        ]);

        $this->getJson('/api-v1/config')->assertOk();

        $cacheKey = $config->fresh()->tpScheduleCacheKey();
        $this->assertTrue(Cache::has($cacheKey));
        $this->assertSame(true, Cache::get($cacheKey));
    }
}
