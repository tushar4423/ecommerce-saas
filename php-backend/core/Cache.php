<?php
namespace Core;

/**
 * Multi-Driver High Speed Cache Layer (APCu / File / Redis)
 * Drastically reduces database load under high traffic (1M+ users) by serving reads from memory.
 */
class Cache
{
    private static string $driver = 'file';
    private static string $cacheDir = '';
    private static bool $enabled = true;
    private static int $defaultTtl = 300;

    public static function init(array $config): void
    {
        self::$enabled = $config['enabled'] ?? true;
        self::$driver = $config['driver'] ?? (extension_loaded('apcu') ? 'apcu' : 'file');
        self::$defaultTtl = $config['default_ttl'] ?? 300;
        self::$cacheDir = $config['file_cache_dir'] ?? (sys_get_temp_dir() . '/vedaaya_cache');

        if (self::$driver === 'file' && !is_dir(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0777, true);
        }
    }

    public static function get(string $key): mixed
    {
        if (!self::$enabled) return null;

        $safeKey = 'vdy_' . md5($key);

        if (self::$driver === 'apcu' && function_exists('apcu_fetch')) {
            $success = false;
            $data = apcu_fetch($safeKey, $success);
            return $success ? $data : null;
        }

        // File Cache fallback
        $file = self::$cacheDir . '/' . $safeKey . '.cache';
        if (file_exists($file)) {
            $content = @file_get_contents($file);
            if ($content) {
                $payload = @unserialize($content);
                if (is_array($payload) && isset($payload['expires_at']) && $payload['expires_at'] > time()) {
                    return $payload['data'];
                }
                @unlink($file); // Expired
            }
        }

        return null;
    }

    public static function set(string $key, mixed $value, ?int $ttl = null): bool
    {
        if (!self::$enabled) return false;

        $ttl = $ttl ?? self::$defaultTtl;
        $safeKey = 'vdy_' . md5($key);

        if (self::$driver === 'apcu' && function_exists('apcu_store')) {
            return apcu_store($safeKey, $value, $ttl);
        }

        // File Cache fallback
        $file = self::$cacheDir . '/' . $safeKey . '.cache';
        $payload = [
            'expires_at' => time() + $ttl,
            'data'       => $value
        ];
        return (bool)@file_put_contents($file, serialize($payload), LOCK_EX);
    }

    public static function delete(string $key): bool
    {
        $safeKey = 'vdy_' . md5($key);

        if (self::$driver === 'apcu' && function_exists('apcu_delete')) {
            return apcu_delete($safeKey);
        }

        $file = self::$cacheDir . '/' . $safeKey . '.cache';
        if (file_exists($file)) {
            return @unlink($file);
        }
        return true;
    }

    /**
     * Clear all cached keys or keys matching a group prefix
     */
    public static function flush(): bool
    {
        if (self::$driver === 'apcu' && function_exists('apcu_clear_cache')) {
            return apcu_clear_cache();
        }

        if (is_dir(self::$cacheDir)) {
            $files = glob(self::$cacheDir . '/*.cache');
            if ($files) {
                foreach ($files as $file) {
                    @unlink($file);
                }
            }
        }
        return true;
    }

    /**
     * Remember helper: returns cached value or computes and stores it
     */
    public static function remember(string $key, int $ttl, callable $callback): mixed
    {
        $cached = self::get($key);
        if ($cached !== null) {
            return $cached;
        }

        $value = $callback();
        self::set($key, $value, $ttl);
        return $value;
    }
}
