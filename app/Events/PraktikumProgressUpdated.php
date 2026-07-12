<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PraktikumProgressUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public int $praktikumId, public array $progress) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('praktikum.'.$this->praktikumId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'PraktikumProgressUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'praktikum_id' => $this->praktikumId,
            'progress' => $this->progress,
        ];
    }
}
