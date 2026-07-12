<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class AuditLogger
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function logFromRequest(Request $request, string $action, ?string $description = null, array $context = []): void
    {
        $route = $request->route();

        $metadata = $this->buildMetadata($request, $context);
        $filteredMetadata = empty($metadata) ? null : $metadata;

        AuditLog::create([
            'asisten_id' => auth('asisten')->id(),
            'action' => $action,
            'route' => $route?->getName() ?? $route?->uri(),
            'method' => strtoupper($request->getMethod()),
            'description' => $description,
            'metadata' => $filteredMetadata,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function buildMetadata(Request $request, array $context = []): array
    {
        $payload = $this->sanitizeArray($request->all());
        $query = $this->sanitizeArray($request->query());

        if (! empty($payload)) {
            $context['payload'] = $payload;
        }

        if (! empty($query)) {
            $context['query'] = $query;
        }

        return Arr::where($context, static fn ($value) => $value !== [] && $value !== null);
    }

    /**
     * @param  array<mixed>  $values
     * @return array<mixed>
     */
    private function sanitizeArray(array $values): array
    {
        foreach ($values as $key => $value) {
            if (is_array($value)) {
                $values[$key] = $this->sanitizeArray($value);

                continue;
            }

            if (is_string($key) && $this->isSensitiveKey($key)) {
                $values[$key] = '[REDACTED]';
            }
        }

        return $values;
    }

    private function isSensitiveKey(string $key): bool
    {
        return Str::contains($key, ['password', 'token', 'secret']);
    }
}
