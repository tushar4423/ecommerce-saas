<?php

declare(strict_types=1);

final class ApiException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 400, public readonly array $details = [])
    {
        parent::__construct($message);
    }
}

function loadEnvironment(): void
{
    $candidates = array_filter([
        getenv('VEDAAYA_ENV_FILE') ?: null,
        '/etc/vedaaya-ecommerce.env',
        dirname(__DIR__) . '/.env',
    ]);

    foreach ($candidates as $file) {
        if (!is_readable($file)) {
            continue;
        }
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if ($name === '' || getenv($name) !== false) {
                continue;
            }
            if (strlen($value) >= 2 && (($value[0] === '"' && str_ends_with($value, '"')) || ($value[0] === "'" && str_ends_with($value, "'")))) {
                $value = substr($value, 1, -1);
            }
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
        break;
    }
}

function envValue(string $name, mixed $default = null): mixed
{
    $value = getenv($name);
    return $value === false ? $default : $value;
}

function envBool(string $name, bool $default = false): bool
{
    $value = getenv($name);
    if ($value === false) {
        return $default;
    }
    return filter_var($value, FILTER_VALIDATE_BOOLEAN);
}

function jsonForDb(mixed $value): string
{
    $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    return $encoded;
}

function jsonFromDb(?string $value, mixed $fallback = []): mixed
{
    if ($value === null || $value === '') {
        return $fallback;
    }
    try {
        return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return $fallback;
    }
}

function isoDate(?string $value = null): string
{
    return (new DateTimeImmutable($value ?: 'now', new DateTimeZone('UTC')))->format(DATE_ATOM);
}

function apiId(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(8));
}

function uuidV4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?: '';
    return trim($value, '-') ?: apiId('item');
}

function deepMerge(array $base, array $updates): array
{
    foreach ($updates as $key => $value) {
        if (is_array($value) && isset($base[$key]) && is_array($base[$key]) && !array_is_list($value) && !array_is_list($base[$key])) {
            $base[$key] = deepMerge($base[$key], $value);
        } else {
            $base[$key] = $value;
        }
    }
    return $base;
}

final class Db
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host = (string) envValue('DB_HOST', '127.0.0.1');
        $port = (int) envValue('DB_PORT', 3306);
        $name = (string) envValue('DB_NAME', 'ecommerce');
        $user = (string) envValue('DB_USER', 'root');
        $pass = (string) envValue('DB_PASS', '');
        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        self::$pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'",
        ]);
        return self::$pdo;
    }
}

loadEnvironment();
date_default_timezone_set('UTC');
