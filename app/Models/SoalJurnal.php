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
 * Class SoalJurnal
 *
 * @property int $id
 * @property int $modul_id
 * @property string $soal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Modul $modul
 * @property Collection|JawabanJurnal[] $jawaban_jurnals
 */
class SoalJurnal extends Model
{
    use HasFactory;

    protected $table = 'soal_jurnals';

    protected $casts = [
        'modul_id' => 'int',
    ];

    protected $fillable = [
        'modul_id',
        'soal',
        'enable_file_upload',
    ];

    public function modul()
    {
        return $this->belongsTo(Modul::class);
    }

    public function jawaban_jurnals()
    {
        return $this->hasMany(JawabanJurnal::class, 'soal_id');
    }
}
