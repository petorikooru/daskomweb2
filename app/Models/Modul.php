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
 * Class Modul
 *
 * @property int $id
 * @property string $judul
 * @property string $deskripsi
 * @property string $isi
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property bool|null $isEnglish
 * @property bool $isUnlocked
 * @property array|null $unlock_config
 * @property Collection|JawabanFitb[] $jawaban_fitbs
 * @property Collection|JawabanJurnal[] $jawaban_jurnals
 * @property Collection|JawabanMandiri[] $jawaban_mandiris
 * @property Collection|JawabanTa[] $jawaban_tas
 * @property Collection|JawabanTk[] $jawaban_tks
 * @property Collection|JawabanTp[] $jawaban_tps
 * @property Collection|KumpulTp[] $kumpul_tps
 * @property Collection|LaporanPraktikan[] $laporan_praktikans
 * @property Collection|Nilai[] $nilais
 * @property Collection|Praktikum[] $praktikums
 * @property Collection|resource[] $resources
 * @property Collection|SoalFitb[] $soal_fitbs
 * @property Collection|SoalJurnal[] $soal_jurnals
 * @property Collection|SoalMandiri[] $soal_mandiris
 * @property Collection|SoalTa[] $soal_tas
 * @property Collection|SoalTk[] $soal_tks
 * @property Collection|SoalTp[] $soal_tps
 * @property Collection|TempJawabantp[] $temp_jawabantps
 * @property Collection|Tugaspendahuluan[] $tugaspendahuluans
 */
class Modul extends Model
{
    use HasFactory;

    protected $table = 'moduls';

    protected $primaryKey = 'id';

    protected $keyType = 'int';

    public const QUESTION_TYPES = ['ta', 'tp', 'tk', 'jurnal', 'fitb', 'tm'];

    protected $fillable = [
        'judul',
        'deskripsi',
        'isEnglish',
        'isUnlocked',
        'unlock_config',
    ];

    protected function casts(): array
    {
        return [
            'isEnglish' => 'boolean',
            'isUnlocked' => 'boolean',
            'unlock_config' => 'array',
        ];
    }

    public static function normalizeUnlockConfig(?array $config, bool $fallback): array
    {
        $normalized = [];

        foreach (self::QUESTION_TYPES as $type) {
            if ($type === 'tp') {
                $normalized[$type] = true;

                continue;
            }

            if (array_key_exists($type, $config ?? [])) {
                $normalized[$type] = (bool) $config[$type];

                continue;
            }

            $normalized[$type] = $fallback;
        }

        return $normalized;
    }

    public function isQuestionTypeUnlocked(string $type): bool
    {
        $normalizedType = strtolower($type);

        if ($normalizedType === 'tp') {
            return true;
        }

        if (! in_array($normalizedType, self::QUESTION_TYPES, true)) {
            return (bool) $this->isUnlocked;
        }

        $config = $this->unlock_config ?? [];

        if (array_key_exists($normalizedType, $config)) {
            return (bool) $config[$normalizedType];
        }

        return (bool) $this->isUnlocked;
    }

    public function jawaban_fitbs()
    {
        return $this->hasMany(JawabanFitb::class);
    }

    public function jawaban_jurnals()
    {
        return $this->hasMany(JawabanJurnal::class);
    }

    public function jawaban_mandiris()
    {
        return $this->hasMany(JawabanMandiri::class);
    }

    public function jawaban_tas()
    {
        return $this->hasMany(JawabanTa::class);
    }

    public function jawaban_tks()
    {
        return $this->hasMany(JawabanTk::class);
    }

    public function jawaban_tps()
    {
        return $this->hasMany(JawabanTp::class);
    }

    public function kumpul_tps()
    {
        return $this->hasMany(KumpulTp::class);
    }

    public function laporan_praktikans()
    {
        return $this->hasMany(LaporanPraktikan::class);
    }

    public function nilais()
    {
        return $this->hasMany(Nilai::class);
    }

    public function praktikums()
    {
        return $this->hasMany(Praktikum::class);
    }

    public function resources()
    {
        return $this->hasMany(Resource::class);
    }

    public function soal_fitbs()
    {
        return $this->hasMany(SoalFitb::class);
    }

    public function soal_jurnals()
    {
        return $this->hasMany(SoalJurnal::class);
    }

    public function soal_mandiris()
    {
        return $this->hasMany(SoalMandiri::class);
    }

    public function soal_tas()
    {
        return $this->hasMany(SoalTa::class);
    }

    public function soal_tks()
    {
        return $this->hasMany(SoalTk::class);
    }

    public function soal_tps()
    {
        return $this->hasMany(SoalTp::class);
    }

    public function temp_jawabantps()
    {
        return $this->hasMany(TempJawabantp::class);
    }

    public function tugaspendahuluans()
    {
        return $this->hasMany(Tugaspendahuluan::class);
    }
}
