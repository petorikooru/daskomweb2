<?php

namespace App\Models;

use App\Enums\TipeSoal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SoalComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'soal_id',
        'tipe_soal',
        'praktikan_id',
        'comment',
    ];

    protected $casts = [
        'tipe_soal' => TipeSoal::class,
    ];

    public function praktikan(): BelongsTo
    {
        return $this->belongsTo(Praktikan::class);
    }

    public function scopeForTotClasses(Builder $query): Builder
    {
        return $query->whereHas('praktikan.kelas', function (Builder $kelasQuery) {
            $kelasQuery->where('kelas', 'like', 'TOT%');
        });
    }

    public function scopeForType(Builder $query, TipeSoal $type): Builder
    {
        return $query->where('tipe_soal', $type->value);
    }

    public function question(): ?Model
    {
        $type = $this->tipe_soal;

        if (! $type instanceof TipeSoal) {
            return null;
        }

        return $type->findQuestion((int) $this->soal_id);
    }
}
