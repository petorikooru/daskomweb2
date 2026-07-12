<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoalOpsi extends Model
{
    use HasFactory;

    public const TYPE_TA = 'TA';

    public const TYPE_TK = 'TK';

    protected $table = 'soal_opsis';

    protected $fillable = [
        'soal_type',
        'soal_id',
        'text',
    ];

    protected $casts = [
        'soal_id' => 'int',
    ];

    public function scopeForTa($query)
    {
        return $query->where('soal_type', self::TYPE_TA);
    }

    public function scopeForTk($query)
    {
        return $query->where('soal_type', self::TYPE_TK);
    }
}
