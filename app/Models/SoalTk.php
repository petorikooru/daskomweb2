<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection as BaseCollection;

/**
 * Class SoalTk
 *
 * @property int $id
 * @property int $modul_id
 * @property string $pertanyaan
 * @property int|null $opsi1_id
 * @property int|null $opsi2_id
 * @property int|null $opsi3_id
 * @property int|null $opsi_benar_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property Modul $modul
 * @property Collection|JawabanTk[] $jawaban_tks
 * @property BaseCollection<int, SoalOpsi> $options
 */
class SoalTk extends Model
{
    use HasFactory;

    protected $table = 'soal_tks';

    protected $casts = [
        'modul_id' => 'int',
        'opsi1_id' => 'int',
        'opsi2_id' => 'int',
        'opsi3_id' => 'int',
        'opsi_benar_id' => 'int',
    ];

    protected $fillable = [
        'modul_id',
        'pertanyaan',
        'opsi1_id',
        'opsi2_id',
        'opsi3_id',
        'opsi_benar_id',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $soal) {
            $soal->options()->delete();
        });
    }

    public function modul()
    {
        return $this->belongsTo(Modul::class);
    }

    public function jawaban_tks()
    {
        return $this->hasMany(JawabanTk::class, 'soal_id');
    }

    public function options()
    {
        return $this->hasMany(SoalOpsi::class, 'soal_id')
            ->where('soal_type', SoalOpsi::TYPE_TK);
    }

    public function opsi1()
    {
        return $this->belongsTo(SoalOpsi::class, 'opsi1_id');
    }

    public function opsi2()
    {
        return $this->belongsTo(SoalOpsi::class, 'opsi2_id');
    }

    public function opsi3()
    {
        return $this->belongsTo(SoalOpsi::class, 'opsi3_id');
    }

    public function opsiBenar()
    {
        return $this->belongsTo(SoalOpsi::class, 'opsi_benar_id');
    }
}
