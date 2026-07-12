<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Praktikum
 *
 * @property int $id
 * @property int $modul_id
 * @property int $kelas_id
 * @property string $dk
 * @property int|null $pj_id
 * @property int $laporan_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $status
 * @property string|null $current_phase
 * @property Carbon|null $started_at
 * @property Carbon|null $ended_at
 * @property string|null $report_notes
 * @property Carbon|null $report_submitted_at
 * @property Kelas $kelas
 * @property LaporanPj $laporan_pj
 * @property Modul $modul
 * @property Asisten|null $pj
 */
class Praktikum extends Model
{
    protected $table = 'praktikums';

    protected $casts = [
        'modul_id' => 'int',
        'kelas_id' => 'int',
        'isActive' => 'bool',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'phase_elapsed_seconds' => 'int',
        'phase_started_at' => 'datetime',
        'report_submitted_at' => 'datetime',
    ];

    protected $fillable = [
        'modul_id',
        'kelas_id',
        'dk',
        'pj_id',
        'isActive',
        'status',
        'current_phase',
        'phase_elapsed_seconds',
        'phase_started_at',
        'started_at',
        'ended_at',
        'report_notes',
        'report_submitted_at',
    ];

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    public function modul()
    {
        return $this->belongsTo(Modul::class, 'modul_id');
    }

    public function pj()
    {
        return $this->belongsTo(Asisten::class, 'pj_id');
    }

    public function laporan_pj()
    {
        return $this->hasMany(LaporanPj::class, 'praktikum_id');
    }
}
