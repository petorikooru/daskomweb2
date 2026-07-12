<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PraktikanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'nim' => $this->nim,
            'email' => $this->email,
            'nomor_telepon' => $this->nomor_telepon,
            'alamat' => $this->alamat,
            'kelas_id' => $this->kelas_id,
            'dk' => $this->dk,
            'kelas' => $this->whenLoaded('kelas', function () {
                $kelas = $this->kelas;

                if (! $kelas) {
                    return null;
                }

                return [
                    'id' => $kelas->id,
                    'nama' => $kelas->kelas,
                    'hari' => $kelas->hari,
                    'shift' => $kelas->shift,
                    'is_english' => (bool) ($kelas->isEnglish ?? false),
                ];
            }),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
