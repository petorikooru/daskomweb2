<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogAssistantAction
{
    /**
     * @var array<string, array{action: string, description?: string, methods?: array<int, string>}>
     */
    private array $routeMap = [
        'update.asisten' => ['action' => 'assistant.profile.update', 'description' => 'Updated assistant profile information.'],
        'updatePp.asisten' => ['action' => 'assistant.profile-picture.update', 'description' => 'Updated assistant profile picture.'],
        'destroyPp.asisten' => ['action' => 'assistant.profile-picture.delete', 'description' => 'Removed assistant profile picture.'],
        'asisten.password.update' => ['action' => 'assistant.password.update', 'description' => 'Updated assistant password.', 'methods' => ['PATCH']],
        'destroy.asisten' => ['action' => 'assistant.management.delete', 'description' => 'Deleted assistant accounts.'],
        'store.roles' => ['action' => 'roles.create', 'description' => 'Created a role.'],
        'update.roles' => ['action' => 'roles.update', 'description' => 'Updated a role.'],
        'store.modul' => ['action' => 'modules.create', 'description' => 'Created a module.'],
        'modul.update' => ['action' => 'modules.update', 'description' => 'Updated a module.'],
        'delete.modul' => ['action' => 'modules.delete', 'description' => 'Deleted a module.'],
        'store.kelas' => ['action' => 'classes.create', 'description' => 'Created a class.'],
        'update.kelas' => ['action' => 'classes.update', 'description' => 'Updated a class.'],
        'delete.kelas' => ['action' => 'classes.delete', 'description' => 'Deleted a class.'],
        'reset.kelas' => ['action' => 'classes.reset', 'description' => 'Reset class assignments.'],
        'store.jadwal' => ['action' => 'schedule.create', 'description' => 'Created a schedule entry.'],
        'delete.jadwal' => ['action' => 'schedule.delete', 'description' => 'Deleted a schedule entry.'],
        'api.store.praktikums' => ['action' => 'praktikum.create', 'description' => 'Created a praktikum session.'],
        'api.update.praktikums' => ['action' => 'praktikum.update', 'description' => 'Updated a praktikum session.'],
        'update.config' => ['action' => 'configuration.update', 'description' => 'Updated configuration settings.'],
        'store.soaltp' => ['action' => 'soal.tp.create', 'description' => 'Created soal TP entry.'],
        'update.soaltp' => ['action' => 'soal.tp.update', 'description' => 'Updated soal TP entry.'],
        'delete.soaltp' => ['action' => 'soal.tp.delete', 'description' => 'Deleted soal TP entry.'],
        'store.soaltm' => ['action' => 'soal.tm.create', 'description' => 'Created soal TM entry.'],
        'update.soaltm' => ['action' => 'soal.tm.update', 'description' => 'Updated soal TM entry.'],
        'delete.soaltm' => ['action' => 'soal.tm.delete', 'description' => 'Deleted soal TM entry.'],
        'store.soalfitb' => ['action' => 'soal.fitb.create', 'description' => 'Created soal FITB entry.'],
        'update.soalfitb' => ['action' => 'soal.fitb.update', 'description' => 'Updated soal FITB entry.'],
        'delete.soalfitb' => ['action' => 'soal.fitb.delete', 'description' => 'Deleted soal FITB entry.'],
        'store.soaljurnal' => ['action' => 'soal.jurnal.create', 'description' => 'Created soal jurnal entry.'],
        'update.soaljurnal' => ['action' => 'soal.jurnal.update', 'description' => 'Updated soal jurnal entry.'],
        'delete.soaljurnal' => ['action' => 'soal.jurnal.delete', 'description' => 'Deleted soal jurnal entry.'],
        'store.soalta' => ['action' => 'soal.ta.create', 'description' => 'Created soal TA entry.'],
        'update.soalta' => ['action' => 'soal.ta.update', 'description' => 'Updated soal TA entry.'],
        'delete.soalta' => ['action' => 'soal.ta.delete', 'description' => 'Deleted soal TA entry.'],
        'store.soaltk' => ['action' => 'soal.tk.create', 'description' => 'Created soal TK entry.'],
        'update.soaltk' => ['action' => 'soal.tk.update', 'description' => 'Updated soal TK entry.'],
        'delete.soaltk' => ['action' => 'soal.tk.delete', 'description' => 'Deleted soal TK entry.'],
        'update.tugaspendahuluans' => ['action' => 'tugas-pendahuluan.update', 'description' => 'Updated tugas pendahuluan settings.'],
    ];

    public function __construct(private readonly AuditLogger $logger) {}

    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $this->shouldLog($request, $response)) {
            return $response;
        }

        $routeName = $request->route()?->getName();

        if ($routeName === null) {
            return $response;
        }

        $definition = $this->routeMap[$routeName] ?? null;

        if ($definition === null) {
            return $response;
        }

        if (! $this->matchesAllowedMethod($request, $definition['methods'] ?? null)) {
            return $response;
        }

        $this->logger->logFromRequest(
            $request,
            $definition['action'],
            $definition['description'] ?? null,
        );

        return $response;
    }

    private function shouldLog(Request $request, Response $response): bool
    {
        if (! auth('asisten')->check()) {
            return false;
        }

        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            return false;
        }

        if ($response->isSuccessful() || $response->isRedirection()) {
            return true;
        }

        return false;
    }

    /**
     * @param  array<int, string>|null  $allowedMethods
     */
    private function matchesAllowedMethod(Request $request, ?array $allowedMethods): bool
    {
        if ($allowedMethods === null) {
            return in_array($request->getMethod(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
        }

        return in_array(strtoupper($request->getMethod()), array_map('strtoupper', $allowedMethods), true);
    }
}
