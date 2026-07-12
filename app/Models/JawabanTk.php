<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class JawabanTk
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
 * @property SoalTk $soal_tk
 * @property SoalOpsi|null $opsi
 */
class JawabanTk extends Model
{
    protected $table = 'jawaban_tks';

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

    public function soal_tk()
    {
        return $this->belongsTo(SoalTk::class, 'soal_id');
    }

    public function opsi()
    {
        return $this->belongsTo(SoalOpsi::class, 'opsi_id');
    }
}
