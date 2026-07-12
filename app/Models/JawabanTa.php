<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class JawabanTa
 *
 * @property int $id
 * @property int $praktikan_id
 * @property int $soal_id
 * @property int $modul_id
 * @property int|null $opsi_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property Modul $modul
 * @property Praktikan $praktikan
 * @property SoalTa $soal_ta
 * @property SoalOpsi|null $opsi
 */
class JawabanTa extends Model
{
    protected $table = 'jawaban_tas';

    protected $casts = [
        'praktikan_id' => 'int',
        'soal_id' => 'int',
        'modul_id' => 'int',
        'opsi_id' => 'int',
    ];

    protected $fillable = [
        'praktikan_id',
        'soal_id',
        'modul_id',
        'opsi_id',
    ];

    public function modul()
    {
        return $this->belongsTo(Modul::class);
    }

    public function praktikan()
    {
        return $this->belongsTo(Praktikan::class);
    }

    public function soal_ta()
    {
        return $this->belongsTo(SoalTa::class, 'soal_id');
    }

    public function opsi()
    {
        return $this->belongsTo(SoalOpsi::class, 'opsi_id');
    }
}
