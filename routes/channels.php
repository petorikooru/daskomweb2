<?php

use Illuminate\Support\Facades\Broadcast;

// Apply custom authentication middleware to broadcasting routes
Broadcast::routes(['middleware' => ['web', 'auth.broadcasting']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel for kelas - praktikan and asisten online tracking
Broadcast::channel('presence-kelas.{kelasId}', function ($user, $kelasId) {
    if (! $user) {
        return false;
    }

    // Check if user is a Praktikan
    if ($user instanceof \App\Models\Praktikan) {
        // Verify praktikan belongs to this kelas
        if ((int) $user->kelas_id === (int) $kelasId) {
            return [
                'id' => $user->id,
                'name' => $user->nama,
                'nim' => $user->nim,
                'type' => 'praktikan',
            ];
        }
    }

    // Check if user is an Asisten
    if ($user instanceof \App\Models\Asisten) {
        // Asisten can join any kelas channel
        return [
            'id' => $user->id,
            'name' => $user->nama,
            'kode' => $user->kode,
            'type' => 'asisten',
        ];
    }

    return false;
});
