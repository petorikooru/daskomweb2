<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivePraktikumBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct() {}

    /** @return array<int, Channel> */
    public function broadcastOn(): array
    {
        return [
            new Channel('praktikum.active-timer'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ActivePraktikumUpdated';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return [
            'signal' => 'refresh',
        ];
    }
}
