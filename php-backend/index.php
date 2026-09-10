<?php

declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/Api.php';

$requestId = bin2hex(random_bytes(8));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', (string) envValue('CORS_ALLOWED_ORIGINS', '*')))));
$allowOrigin = in_array('*', $allowedOrigins, true) ? '*' : (in_array($origin, $allowedOrigins, true) ? $origin : '');

if ($allowOrigin !== '') {
    header('Access-Control-Allow-Origin: ' . $allowOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-ID');
header('Access-Control-Expose-Headers: ETag, X-Request-ID');
header('Access-Control-Max-Age: 86400');
header('X-Request-ID: ' . $requestId);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendJson(mixed $payload, int $status = 200, int $cacheSeconds = 0): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if ($cacheSeconds > 0 && $status === 200 && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $etag = '"' . hash('sha256', $body) . '"';
        header('ETag: ' . $etag);
        header('Cache-Control: public, max-age=' . $cacheSeconds . ', stale-while-revalidate=60');
        if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
            http_response_code(304);
            exit;
        }
    } else {
        header('Cache-Control: no-store');
    }
    echo $body;
    exit;
}

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $uri = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
    foreach (['/api/ecommerce/index.php', '/api/ecommerce', '/index.php'] as $prefix) {
        if ($uri === $prefix) {
            $uri = '/';
            break;
        }
        if (str_starts_with($uri, $prefix . '/')) {
            $uri = substr($uri, strlen($prefix));
            break;
        }
    }
    $uri = '/' . trim($uri, '/');
    if ($uri === '//') {
        $uri = '/';
    }

    $raw = file_get_contents('php://input') ?: '';
    $body = [];
    if ($raw !== '') {
        $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($body)) {
            throw new ApiException('The request body must be a JSON object.', 400);
        }
    }

    $api = new Api(Db::connection(), $method, $uri, $body, $_GET, $raw);
    [$payload, $status, $cacheSeconds] = $api->dispatch();
    sendJson($payload, $status, $cacheSeconds);
} catch (JsonException) {
    sendJson(['success' => false, 'error' => 'Malformed JSON request body.', 'requestId' => $requestId], 400);
} catch (ApiException $e) {
    sendJson(['success' => false, 'error' => $e->getMessage(), 'details' => $e->details, 'requestId' => $requestId], $e->status);
} catch (PDOException $e) {
    error_log("[{$requestId}] Database error: {$e->getMessage()}");
    sendJson(['success' => false, 'error' => 'Database service temporarily unavailable.', 'requestId' => $requestId], 503);
} catch (Throwable $e) {
    error_log("[{$requestId}] Unhandled error: {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}");
    $message = envBool('APP_DEBUG') ? $e->getMessage() : 'An internal server error occurred.';
    sendJson(['success' => false, 'error' => $message, 'requestId' => $requestId], 500);
}
