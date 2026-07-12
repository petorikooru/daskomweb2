<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NilaiComplaint extends Model
{
    protected $fillable = ['nilai_id', 'praktikan_id', 'message', 'status', 'notes'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function nilai(): BelongsTo
    {
        return $this->belongsTo(Nilai::class);
    }

    public function praktikan(): BelongsTo
    {
        return $this->belongsTo(Praktikan::class);
    }
}
