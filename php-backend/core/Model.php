<?php
namespace Core;

use PDO;

/**
 * Base Model / Data Access Object
 */
abstract class Model
{
    protected static string $table = '';
    protected static string $primaryKey = 'id';

    public static function all(): array
    {
        $stmt = Database::query("SELECT * FROM " . static::$table);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function find(string|int $id): ?array
    {
        $stmt = Database::query(
            "SELECT * FROM " . static::$table . " WHERE " . static::$primaryKey . " = ? LIMIT 1",
            [$id]
        );
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    public static function delete(string|int $id): bool
    {
        $stmt = Database::query(
            "DELETE FROM " . static::$table . " WHERE " . static::$primaryKey . " = ?",
            [$id]
        );
        return $stmt->rowCount() > 0;
    }

    public static function count(string $where = '', array $params = []): int
    {
        $sql = "SELECT COUNT(*) as cnt FROM " . static::$table;
        if (!empty($where)) {
            $sql .= " WHERE $where";
        }
        $stmt = Database::query($sql, $params);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($res['cnt'] ?? 0);
    }
}
