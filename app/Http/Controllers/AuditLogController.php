<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = (string) $request->string('search')->trim();

        $logs = AuditLog::query()
            ->with([
                'asisten' => static function ($query) {
                    $query->select('id', 'nama', 'kode', 'role_id')
                        ->with('role:id,name');
                },
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery->where('action', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('asisten', function ($asistenQuery) use ($search) {
                            $asistenQuery->where('nama', 'like', "%{$search}%")
                                ->orWhere('kode', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(static function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'route' => $log->route,
                    'method' => $log->method,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'metadata' => $log->metadata ?? [],
                    'created_at' => optional($log->created_at)->toIso8601String(),
                    'asisten' => $log->asisten ? [
                        'id' => $log->asisten->id,
                        'nama' => $log->asisten->nama,
                        'kode' => $log->asisten->kode,
                        'role' => $log->asisten->role?->name,
                    ] : null,
                ];
            });

        return Inertia::render('Assistants/AuditLogs', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
