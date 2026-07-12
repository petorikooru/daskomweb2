<?php

namespace App\Enums;

use App\Models\SoalFitb;
use App\Models\SoalJurnal;
use App\Models\SoalMandiri;
use App\Models\SoalTa;
use App\Models\SoalTk;
use App\Models\SoalTp;
use Illuminate\Database\Eloquent\Model;

enum TipeSoal: string
{
    case TP = 'tp';
    case TA = 'ta';
    case TK = 'tk';
    case FITB = 'fitb';
    case JURNAL = 'jurnal';
    case MANDIRI = 'mandiri';

    /**
     * Resolve the eloquent model class associated with the question type.
     */
    public function modelClass(): string
    {
        return match ($this) {
            self::TP => SoalTp::class,
            self::TA => SoalTa::class,
            self::TK => SoalTk::class,
            self::FITB => SoalFitb::class,
            self::JURNAL => SoalJurnal::class,
            self::MANDIRI => SoalMandiri::class,
        };
    }

    /**
     * Attempt to resolve a question type from an incoming value.
     */
    public static function tryFromRequest(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        return self::tryFrom(strtolower($value));
    }

    /**
     * Ensure the associated question exists and return it when possible.
     *
     * @template T of Model
     *
     * @return T|null
     */
    public function findQuestion(int $id): ?Model
    {
        /** @var class-string<T> $model */
        $model = $this->modelClass();

        return $model::query()->find($id);
    }
}
