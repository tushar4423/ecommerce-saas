<?php
namespace Core;

/**
 * Middleware Pipeline for CORS, Rate Limiting, and Security
 */
class Middleware
{
    public static function handleCors(array $corsConfig): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = $corsConfig['allowed_origins'] ?? ['*'];

        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        header('Access-Control-Allow-Methods: ' . implode(', ', $corsConfig['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']));
        header('Access-Control-Allow-Headers: ' . implode(', ', $corsConfig['allowed_headers'] ?? ['Content-Type', 'Authorization']));
        header('Access-Control-Expose-Headers: ' . implode(', ', $corsConfig['exposed_headers'] ?? ['ETag']));
        header('Access-Control-Max-Age: ' . ($corsConfig['max_age'] ?? 86400));

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    public static function handleRateLimit(Request $request, array $rateLimitConfig): void
    {
        if (empty($rateLimitConfig['enabled'])) return;

        $ip = $request->getClientIp();
        $key = 'rate_limit_' . md5($ip);
        $window = $rateLimitConfig['window_seconds'] ?? 60;
        $maxRequests = $rateLimitConfig['max_requests'] ?? 300;

        $current = Cache::get($key);
        if ($current === null) {
            Cache::set($key, 1, $window);
        } else {
            if ($current >= $maxRequests) {
                Response::error('Too many requests. Please slow down.', 429);
            }
            Cache::set($key, $current + 1, $window);
        }
    }
}
