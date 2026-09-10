<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use PDO;

class ExportController extends Controller
{
    public function exportSql(Request $request): void
    {
        $sql = "-- Auto-Generated MySQL Production Dump for Vedaaya Store\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";

        // Dump Store Settings
        $stmt = Database::query("SELECT * FROM store_settings LIMIT 1");
        $s = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($s) {
            $sql .= "-- Store Settings\n";
            $sql .= "INSERT INTO store_settings (id, store_name, tagline, primary_color, secondary_color, background_color) VALUES (1, '" . addslashes($s['store_name']) . "', '" . addslashes($s['tagline']) . "', '{$s['primary_color']}', '{$s['secondary_color']}', '{$s['background_color']}') ON DUPLICATE KEY UPDATE store_name=VALUES(store_name);\n\n";
        }

        // Dump Products
        $stmt = Database::query("SELECT * FROM products");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $sql .= "-- Products (" . count($products) . " items)\n";
        foreach ($products as $p) {
            $sql .= sprintf(
                "INSERT INTO products (id, sku, name, slug, category, subcategory, mrp, selling_price, fabric, work) VALUES ('%s', '%s', '%s', '%s', '%s', '%s', %f, %f, '%s', '%s') ON DUPLICATE KEY UPDATE name=VALUES(name), selling_price=VALUES(selling_price);\n",
                $p['id'],
                $p['sku'],
                addslashes($p['name']),
                $p['slug'],
                addslashes($p['category']),
                addslashes($p['subcategory'] ?? ''),
                (float)$p['mrp'],
                (float)$p['selling_price'],
                addslashes($p['fabric'] ?? ''),
                addslashes($p['work'] ?? '')
            );
        }

        Response::raw($sql, 'text/plain; charset=utf-8');
    }
}
