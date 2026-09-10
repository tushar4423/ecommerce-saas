<?php
namespace Core;

/**
 * HTTP Request Handler & Sanitizer
 */
class Request
{
    private string $method;
    private string $uri;
    private array $queryParams;
    private array $bodyParams = [];
    private array $headers;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->uri = $this->parseUri();
        $this->queryParams = $_GET;
        $this->headers = $this->parseHeaders();
        $this->parseBody();
    }

    private function parseUri(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        if (false !== $pos = strpos($uri, '?')) {
            $uri = substr($uri, 0, $pos);
        }
        return '/' . trim(rawurldecode($uri), '/');
    }

    private function parseHeaders(): array
    {
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if ($headers !== false) {
                return array_change_key_case($headers, CASE_LOWER);
            }
        }
        
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', strtolower(str_replace('_', ' ', substr($name, 5))))] = $value;
            } elseif (in_array($name, ['CONTENT_TYPE', 'CONTENT_LENGTH'])) {
                $headers[strtolower(str_replace('_', '-', $name))] = $value;
            }
        }
        return $headers;
    }

    private function parseBody(): void
    {
        if (in_array($this->method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $raw = file_get_contents('php://input');
            if (!empty($raw)) {
                $contentType = $this->getHeader('content-type') ?? '';
                if (str_contains($contentType, 'application/json') || str_starts_with(trim($raw), '{') || str_starts_with(trim($raw), '[')) {
                    $json = json_decode($raw, true);
                    if (is_array($json)) {
                        $this->bodyParams = $json;
                        return;
                    }
                }
            }
            if (!empty($_POST)) {
                $this->bodyParams = $_POST;
            }
        }
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getUri(): string
    {
        return $this->uri;
    }

    public function getQuery(string $key, mixed $default = null): mixed
    {
        return $this->queryParams[$key] ?? $default;
    }

    public function allQuery(): array
    {
        return $this->queryParams;
    }

    public function getBody(string $key, mixed $default = null): mixed
    {
        return $this->bodyParams[$key] ?? $default;
    }

    public function allBody(): array
    {
        return $this->bodyParams;
    }

    public function getHeader(string $name, ?string $default = null): ?string
    {
        $lower = strtolower($name);
        return $this->headers[$lower] ?? $default;
    }

    public function getBearerToken(): ?string
    {
        $auth = $this->getHeader('authorization');
        if ($auth && preg_match('/Bearer\s(\S+)/i', $auth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public function getClientIp(): string
    {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $list = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($list[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}
