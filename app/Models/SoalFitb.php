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
 * Class SoalFitb
 *
 * @property int $id
 * @property int $modul_id
 * @property string $soal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Modul $modul
 * @property Collection|JawabanFitb[] $jawaban_fitbs
 */
class SoalFitb extends Model
{
    use HasFactory;

    protected $table = 'soal_fitbs';

    protected $casts = [
        'modul_id' => 'int',
        'enable_file_upload' => 'bool',
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

    public function jawaban_fitbs()
    {
        return $this->hasMany(JawabanFitb::class, 'soal_id');
    }
}
