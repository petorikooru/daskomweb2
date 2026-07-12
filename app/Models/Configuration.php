<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Class Configuration
 *
 * @property int $id
 * @property bool $registrationPraktikan_activation
 * @property bool $registrationAsisten_activation
 * @property bool $tp_activation
 * @property bool $tubes_activation
 * @property bool $secretfeature_activation
 * @property bool $polling_activation
 * @property bool $tp_schedule_enabled
 * @property Carbon|null $tp_schedule_start_at
 * @property Carbon|null $tp_schedule_end_at
 * @property string $kode_asisten
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Configuration extends Model
{
    protected $table = 'configurations';

    private const TP_SCHEDULE_CACHE_SECONDS = 60;

    protected $casts = [
        'registrationPraktikan_activation' => 'bool',
        'registrationAsisten_activation' => 'bool',
        'tp_activation' => 'bool',
        'tp_schedule_enabled' => 'bool',
        'tp_schedule_start_at' => 'datetime',
        'tp_schedule_end_at' => 'datetime',
        'tubes_activation' => 'bool',
        'secretfeature_activation' => 'bool',
        'polling_activation' => 'bool',
    ];

    protected $hidden = [
        'secretfeature_activation',
    ];

    protected $fillable = [
        'registrationPraktikan_activation',
        'registrationAsisten_activation',
        'tp_activation',
        'tp_schedule_enabled',
        'tp_schedule_start_at',
        'tp_schedule_end_at',
        'tubes_activation',
        'secretfeature_activation',
        'polling_activation',
        'kode_asisten',
    ];

    public function refreshTpActivationFromSchedule(bool $force = false): void
    {
        $scheduledState = $this->rememberScheduleState($force);

        if ($scheduledState === null) {
            return;
        }

        if ((bool) $this->tp_activation !== $scheduledState) {
            $this->tp_activation = $scheduledState;
            $this->saveQuietly();
        }
    }

    public function flushTpScheduleCache(): void
    {
        Cache::forget($this->tpScheduleCacheKey());
    }

    public function tpScheduleCacheKey(): string
    {
        $identifier = $this->getKey() ?? 'pending';
        $hashSource = implode('|', [
            $this->tp_schedule_enabled ? 1 : 0,
            optional($this->tp_schedule_start_at)->timestamp ?? 'null',
            optional($this->tp_schedule_end_at)->timestamp ?? 'null',
        ]);

        return sprintf('tp-schedule-state:config:%s:%s', $identifier, md5($hashSource));
    }

    protected function rememberScheduleState(bool $force = false): ?bool
    {
        if (! $this->tp_schedule_enabled || ! $this->tp_schedule_start_at || ! $this->tp_schedule_end_at) {
            $this->flushTpScheduleCache();

            return null;
        }

        if ($force) {
            $this->flushTpScheduleCache();
        }

        $cacheKey = $this->tpScheduleCacheKey();

        return Cache::remember($cacheKey, now()->addSeconds(self::TP_SCHEDULE_CACHE_SECONDS), function (): bool {
            return $this->computeScheduleState();
        });
    }

    protected function computeScheduleState(): bool
    {
        $now = now();
        $start = $this->tp_schedule_start_at instanceof Carbon
            ? $this->tp_schedule_start_at
            : Carbon::parse($this->tp_schedule_start_at);
        $end = $this->tp_schedule_end_at instanceof Carbon
            ? $this->tp_schedule_end_at
            : Carbon::parse($this->tp_schedule_end_at);

        return $now->between($start, $end, true);
    }
}
