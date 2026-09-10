<?php
/**
 * Database Configuration
 * Optimized for MySQL 8+ / MariaDB with Connection Pooling & Persistent PDO options.
 */

return [
    'driver'    => 'mysql',
    'host'      => getenv('DB_HOST') ?: '127.0.0.1',
    'port'      => (int)(getenv('DB_PORT') ?: 3306),
    'database'  => getenv('DB_NAME') ?: 'vedaaya_db',
    'username'  => getenv('DB_USER') ?: 'root',
    'password'  => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',

    // PDO connection attributes for maximum speed and scale
    'options' => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // Real native prepared statements for speed & security
        PDO::ATTR_PERSISTENT         => true,  // Persistent connection pooling to handle high traffic surges
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'",
    ]
];
