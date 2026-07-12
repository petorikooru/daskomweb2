<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SoalTp
 *
 * @property int $id
 * @property int $modul_id
 * @property string $soal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Modul $modul
 * @property Collection|JawabanTp[] $jawaban_tps
 * @property Collection|TempJawabantp[] $temp_jawabantps
 */
class SoalTp extends Model
{
    use HasFactory;

    protected $table = 'soal_tps';

    protected $casts = [
        'modul_id' => 'int',
    ];

    protected $fillable = [
        'modul_id',
        'soal',
    ];

    public function modul()
    {
        return $this->belongsTo(Modul::class, 'modul_id');
    }

    public function jawaban()
    {
        return $this->hasMany(JawabanTp::class, 'soal_id');
    }

    public function temp_jawabantps()
    {
        return $this->hasMany(TempJawabantp::class, 'soal_id');
    }
}
