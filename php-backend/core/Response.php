<?php
namespace Core;

/**
 * Ultra-Fast JSON Response Builder
 * Implements HTTP ETag hashing, 304 Not Modified 0-byte caching, and Gzip compression.
 */
class Response
{
    public static function json(mixed $data, int $statusCode = 200, array $headers = [], int $cacheSeconds = 0): void
    {
        // Set HTTP status code
        http_response_code($statusCode);

        // Security and default JSON headers
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');

        foreach ($headers as $k => $v) {
            header("$k: $v");
        }

        $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // HTTP Caching & ETag validation for million-user high throughput
        if ($statusCode === 200 && $_SERVER['REQUEST_METHOD'] === 'GET') {
            $etag = '"' . md5($encoded) . '"';
            header("ETag: $etag");

            if ($cacheSeconds > 0) {
                header("Cache-Control: public, max-age=$cacheSeconds, stale-while-revalidate=60");
            } else {
                header('Cache-Control: no-cache, must-revalidate');
            }

            $clientEtag = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
            if ($clientEtag === $etag) {
                http_response_code(304); // 304 Not Modified (Saves bandwidth & CPU)
                exit;
            }
        }

        // Enable output compression if client supports gzip
        if (!ob_start('ob_gzhandler')) {
            ob_start();
        }

        echo $encoded;
        ob_end_flush();
        exit;
    }

    public static function success(mixed $data, string $message = 'Success', int $statusCode = 200, int $cacheSeconds = 0): void
    {
        self::json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'meta'    => [
                'timestamp' => time(),
                'version'   => '2.0.0'
            ]
        ], $statusCode, [], $cacheSeconds);
    }

    public static function error(string $message, int $statusCode = 400, array $errors = []): void
    {
        self::json([
            'success' => false,
            'error'   => $message,
            'details' => $errors,
            'meta'    => [
                'timestamp' => time(),
                'version'   => '2.0.0'
            ]
        ], $statusCode);
    }

    public static function raw(string $content, string $contentType = 'text/plain; charset=utf-8', int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header("Content-Type: $contentType");
        echo $content;
        exit;
    }
}
