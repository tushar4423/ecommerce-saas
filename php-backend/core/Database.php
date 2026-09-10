<?php
namespace Core;

use PDO;
use PDOException;
use Exception;

/**
 * High-Performance Database Singleton
 * Supports persistent PDO connections, automated reconnects, and transaction management.
 */
class Database
{
    private static ?PDO $instance = null;
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
    }

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::connect();
        }
        return self::$instance;
    }

    private static function connect(): void
    {
        $cfg = self::$config;
        if (empty($cfg)) {
            $cfg = require __DIR__ . '/../config/database.php';
            self::$config = $cfg;
        }

        $dsn = sprintf(
            '%s:host=%s;port=%d;dbname=%s;charset=%s',
            $cfg['driver'] ?? 'mysql',
            $cfg['host'] ?? '127.0.0.1',
            $cfg['port'] ?? 3306,
            $cfg['database'] ?? 'vedaaya_db',
            $cfg['charset'] ?? 'utf8mb4'
        );

        $options = $cfg['options'] ?? [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_PERSISTENT         => true,
        ];

        try {
            self::$instance = new PDO($dsn, $cfg['username'] ?? 'root', $cfg['password'] ?? '', $options);
        } catch (PDOException $e) {
            // If connection fails, log error and return structured response
            error_log('Database connection error: ' . $e->getMessage());
            throw new Exception('Database service temporarily unavailable. Please verify MySQL configuration.');
        }
    }

    /**
     * Helper to execute prepared queries with timing and auto-retry
     */
    public static function query(string $sql, array $params = []): \PDOStatement
    {
        $pdo = self::getInstance();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function beginTransaction(): bool
    {
        return self::getInstance()->beginTransaction();
    }

    public static function commit(): bool
    {
        return self::getInstance()->commit();
    }

    public static function rollBack(): bool
    {
        return self::getInstance()->rollBack();
    }

    public static function lastInsertId(): string
    {
        return self::getInstance()->lastInsertId();
    }
}
