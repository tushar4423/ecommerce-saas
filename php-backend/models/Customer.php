<?php
namespace Models;

use Core\Model;
use Core\Database;
use PDO;

/**
 * Customer & User Profile Model
 */
class Customer extends Model
{
    protected static string $table = 'users';
    protected static string $primaryKey = 'id';

    public static function findByEmail(string $email): ?array
    {
        $stmt = Database::query("SELECT * FROM users WHERE email = ? LIMIT 1", [$email]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$u) return null;

        return self::formatUser($u);
    }

    public static function formatUser(array $u): array
    {
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'phone' => $u['phone'] ?? '',
            'role' => $u['role'] ?? 'customer',
            'createdAt' => $u['created_at'] ?? '',
            'addresses' => !empty($u['addresses']) ? (json_decode($u['addresses'], true) ?: []) : [],
            'savedCards' => !empty($u['saved_cards']) ? (json_decode($u['saved_cards'], true) ?: []) : [],
        ];
    }

    public static function saveCustomer(array $data): array
    {
        $id = $data['id'] ?? ('usr-' . time());
        $email = $data['email'] ?? '';
        $name = $data['name'] ?? 'Guest Customer';

        $sql = "INSERT INTO users (id, name, email, phone, role, addresses)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    phone = VALUES(phone),
                    addresses = VALUES(addresses)";

        Database::query($sql, [
            $id,
            $name,
            $email,
            $data['phone'] ?? '',
            $data['role'] ?? 'customer',
            json_encode($data['addresses'] ?? [])
        ]);

        return self::find($id) ?: $data;
    }
}
