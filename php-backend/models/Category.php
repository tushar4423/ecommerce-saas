<?php
namespace Models;

use Core\Model;
use Core\Database;
use Core\Cache;
use PDO;

/**
 * Category & Hierarchy Model
 */
class Category extends Model
{
    protected static string $table = 'categories';
    protected static string $primaryKey = 'id';

    public static function getAllWithSubmenus(): array
    {
        return Cache::remember('categories_tree_all', 3600, function() {
            $stmt = Database::query("SELECT * FROM categories ORDER BY display_order ASC, name ASC");
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($categories)) {
                return [];
            }

            $catIds = array_column($categories, 'id');
            $inQuery = implode(',', array_fill(0, count($catIds), '?'));

            // Fetch subcategories
            $subStmt = Database::query("SELECT * FROM subcategories WHERE category_id IN ($inQuery) ORDER BY display_order ASC", $catIds);
            $subs = $subStmt->fetchAll(PDO::FETCH_ASSOC);

            $subsByCat = [];
            foreach ($subs as $sub) {
                $subsByCat[$sub['category_id']][] = [
                    'id' => $sub['id'],
                    'name' => $sub['name'],
                    'slug' => $sub['slug'],
                    'description' => $sub['description'] ?? '',
                    'itemCount' => (int)($sub['item_count'] ?? 0),
                    'featured' => (bool)($sub['featured'] ?? false),
                    'subSubCategories' => !empty($sub['sub_sub_categories']) ? (json_decode($sub['sub_sub_categories'], true) ?: []) : []
                ];
            }

            foreach ($categories as &$c) {
                $c['subcategories'] = !empty($c['subcategories']) ? (json_decode($c['subcategories'], true) ?: []) : ['Kurtas & Kurtis', 'Kurta Sets'];
                $c['subMenus'] = $subsByCat[$c['id']] ?? [];
                $c['displayOrder'] = (int)($c['display_order'] ?? 0);
                $c['featured'] = (bool)($c['featured'] ?? false);
                $c['imageUrl'] = $c['image_url'] ?? '';
                $c['bannerUrl'] = $c['banner_url'] ?? '';
            }

            return $categories;
        });
    }

    public static function saveCategory(array $data): array
    {
        $id = $data['id'] ?? ('cat-' . time());
        $name = $data['name'] ?? 'New Category';
        $slug = $data['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));

        $sql = "INSERT INTO categories (
            id, name, slug, description, image_url, banner_url, subcategories, display_order, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            slug = VALUES(slug),
            description = VALUES(description),
            image_url = VALUES(image_url),
            banner_url = VALUES(banner_url),
            subcategories = VALUES(subcategories),
            display_order = VALUES(display_order),
            featured = VALUES(featured)";

        Database::query($sql, [
            $id,
            $name,
            $slug,
            $data['description'] ?? '',
            $data['imageUrl'] ?? $data['image_url'] ?? '',
            $data['bannerUrl'] ?? $data['banner_url'] ?? '',
            json_encode($data['subcategories'] ?? []),
            $data['displayOrder'] ?? $data['display_order'] ?? 0,
            !empty($data['featured']) ? 1 : 0
        ]);

        Cache::flush();
        return self::find($id) ?: $data;
    }
}
