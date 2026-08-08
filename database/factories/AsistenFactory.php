<?php

namespace Database\Factories;

use App\Models\Asisten;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class AsistenFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => $this->faker->name(),
            'kode' => Str::upper(Str::random(3)), // Generates a random 3-letter uppercase string
            'role_id' => $this->faker->numberBetween(1, 6),
            'nomor_telepon' => $this->faker->phoneNumber(),
            'id_line' => $this->faker->unique()->userName(),
            'instagram' => $this->faker->unique()->userName(),
            'deskripsi' => ' ',
            'password' => Hash::make('password'),              // Default password for testing
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function withRoles(array $roleNames)
    {
        return $this
            ->state(function () use ($roleNames) {
                $roleName = fake()->randomElement($roleNames);

                $role = Role::where('name', $roleName)
                    ->where('guard_name', 'asisten')
                    ->firstOrFail();

                return [
                    'role_id' => $role->id,
                ];
            })
            ->afterCreating(function (Asisten $asisten) {
                $role = Role::where('id', $asisten->role_id)
                    ->where('guard_name', 'asisten')
                    ->firstOrFail();

                $asisten->syncRoles([$role]);
            });
    }
}
