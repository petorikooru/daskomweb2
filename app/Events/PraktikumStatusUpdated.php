<?php

namespace App\Events;

use App\Models\Praktikum;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PraktikumStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Praktikum $praktikum)
    {
        $this->praktikum->loadMissing(['modul', 'kelas', 'pj']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('praktikum.'.$this->praktikum->id.'.dk.'.$this->praktikum->dk),
            new Channel('praktikum.class.'.$this->praktikum->kelas_id.'.dk.'.$this->praktikum->dk),
        ];
    }

    public function broadcastAs(): string
    {
        return 'PraktikumStatusUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'praktikum' => [
                'id' => $this->praktikum->id,
                'modul_id' => $this->praktikum->modul_id,
                'kelas_id' => $this->praktikum->kelas_id,
                'dk' => $this->praktikum->dk,
                'status' => $this->praktikum->status,
                'current_phase' => $this->praktikum->current_phase,
                'started_at' => optional($this->praktikum->started_at)?->toIso8601String(),
                'ended_at' => optional($this->praktikum->ended_at)?->toIso8601String(),
                'isActive' => (bool) $this->praktikum->isActive,
                'pj_id' => $this->praktikum->pj_id,
                'pj' => $this->praktikum->pj ? [
                    'id' => $this->praktikum->pj->id,
                    'nama' => $this->praktikum->pj->nama ?? null,
                    'kode' => $this->praktikum->pj->kode ?? null,
                    'email' => $this->praktikum->pj->email ?? null,
                ] : null,
                'report_notes' => $this->praktikum->report_notes,
                'report_submitted_at' => optional($this->praktikum->report_submitted_at)?->toIso8601String(),
                'updated_at' => optional($this->praktikum->updated_at)?->toIso8601String(),
                'created_at' => optional($this->praktikum->created_at)?->toIso8601String(),
            ],
        ];
    }
}
