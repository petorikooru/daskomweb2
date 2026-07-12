<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SeeLabsProxyController extends Controller
{
    private const BASE_URL = 'https://see.labs.telkomuniversity.ac.id';

    public function handle(Request $request)
    {
        $path = $request->query('url', '/praktikum/index.php/home/loginprak');

        // Only allow paths under /praktikum to prevent open-proxy abuse
        if (! str_starts_with($path, '/praktikum')) {
            abort(403);
        }

        $target = self::BASE_URL.$path;
        $cookies = session('see_labs_cookies', []);

        $http = Http::withOptions([
            'allow_redirects' => ['max' => 5, 'track_redirects' => true],
            'verify' => false,
        ])->withHeaders([
            'Cookie' => $this->buildCookieString($cookies),
            'User-Agent' => 'Mozilla/5.0 (compatible; Laravel-Proxy/1.0)',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ]);

        $response = $request->isMethod('POST')
            ? $http->asForm()->post($target, $request->except(['_token', 'url']))
            : $http->get($target);

        // Persist cookies from response
        $rawCookies = $response->cookies();
        if ($rawCookies instanceof \GuzzleHttp\Cookie\CookieJarInterface) {
            foreach ($rawCookies as $cookie) {
                $cookies[$cookie->getName()] = $cookie->getValue();
            }
        }

        session(['see_labs_cookies' => $cookies]);

        $html = $this->rewriteHtml($response->body());

        return response($html, $response->status())
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    private function buildCookieString(array $cookies): string
    {
        return implode('; ', array_map(
            fn ($name, $value) => "{$name}={$value}",
            array_keys($cookies),
            $cookies
        ));
    }

    private function rewriteHtml(string $html): string
    {
        $proxyBase = '/api-v1/see-proxy?url=';

        // Rewrite absolute see.labs URLs in href/action/src attributes
        $html = str_replace(
            self::BASE_URL,
            $proxyBase,
            $html
        );

        // Rewrite root-relative /praktikum paths in action= and href= attributes
        $html = preg_replace(
            '/(action|href)="(\/praktikum\/[^"]*)"/i',
            '$1="'.$proxyBase.'$2"',
            $html
        );

        // Keep static assets (CSS/JS/images) loading directly from see.labs
        // by restoring asset paths that were rewritten above
        $html = preg_replace(
            '/'.preg_quote($proxyBase, '/').'((?:\/assets|\/public|\/uploads|\/css|\/js|\/img|\/images)[^"\']*)/i',
            self::BASE_URL.'$1',
            $html
        );

        return $html;
    }
}
