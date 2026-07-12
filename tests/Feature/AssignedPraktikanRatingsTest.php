<?php

namespace Tests\Feature;

use App\Models\Asisten;
use App\Models\Kelas;
use App\Models\LaporanPraktikan;
use App\Models\Modul;
use App\Models\Praktikan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AssignedPraktikanRatingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function actingAsAssistantWithPermission(string $permission): Asisten
    {
        $role = Role::create([
            'name' => 'test-role',
            'guard_name' => 'asisten',
        ]);

        Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'asisten',
        ]);

        $role->givePermissionTo($permission);

        $assistant = Asisten::factory()->create([
            'role_id' => $role->id,
        ]);

        $assistant->assignRole($role);

        $this->actingAs($assistant, 'asisten');

        return $assistant;
    }

    public function test_response_contains_rating_fields(): void
    {
        $assistant = $this->actingAsAssistantWithPermission('nilai-praktikan');

        $kelas = Kelas::factory()->create();
        $praktikan = Praktikan::factory()->create([
            'kelas_id' => $kelas->id,
        ]);
        $modul = Modul::factory()->create();

        LaporanPraktikan::query()->create([
            'pesan' => 'Laporan singkat',
            'praktikan_id' => $praktikan->id,
            'asisten_id' => $assistant->id,
            'modul_id' => $modul->id,
            'rating_praktikum' => 4.5,
            'rating_asisten' => 5.0,
        ]);

        $response = $this->getJson('/api-v1/praktikan-tertarik');

        $response->assertOk();

        $response->assertJsonStructure([
            'success',
            'data' => [
                [
                    'id',
                    'pesan',
                    'rating_praktikum',
                    'rating_asisten',
                    'timestamps',
                    'datetime',
                    'modul',
                    'praktikan',
                    'nilai',
                ],
            ],
        ]);

        $firstItem = $response->json('data.0');

        $this->assertEqualsWithDelta(4.5, (float) ($firstItem['rating_praktikum'] ?? 0), 0.001);
        $this->assertEqualsWithDelta(5.0, (float) ($firstItem['rating_asisten'] ?? 0), 0.001);
    }
}
