<?php
namespace Models;

use Core\Model;
use Core\Database;
use Core\Cache;
use PDO;

/**
 * Product Model (Relational Data Mapper with Cache Invalidation)
 */
class Product extends Model
{
    protected static string $table = 'products';
    protected static string $primaryKey = 'id';

    /**
     * Get filtered products with pagination and caching
     */
    public static function getList(array $filters = []): array
    {
        $cacheKey = 'products_list_' . md5(json_encode($filters));
        
        return Cache::remember($cacheKey, 600, function() use ($filters) {
            $sql = "SELECT p.* FROM products p WHERE 1=1";
            $params = [];

            if (!empty($filters['category']) && $filters['category'] !== 'all') {
                $sql .= " AND (LOWER(p.category) = LOWER(?) OR LOWER(p.category_slug) = LOWER(?))";
                $params[] = $filters['category'];
                $params[] = $filters['category'];
            }

            if (!empty($filters['subcategory'])) {
                $sql .= " AND LOWER(p.subcategory) = LOWER(?)";
                $params[] = $filters['subcategory'];
            }

            if (!empty($filters['search'])) {
                $q = '%' . trim($filters['search']) . '%';
                $sql .= " AND (p.name LIKE ? OR p.fabric LIKE ? OR p.work LIKE ? OR p.sku LIKE ?)";
                $params[] = $q;
                $params[] = $q;
                $params[] = $q;
                $params[] = $q;
            }

            if (!empty($filters['min_price'])) {
                $sql .= " AND p.selling_price >= ?";
                $params[] = (float)$filters['min_price'];
            }

            if (!empty($filters['max_price'])) {
                $sql .= " AND p.selling_price <= ?";
                $params[] = (float)$filters['max_price'];
            }

            if (!empty($filters['is_bestseller'])) {
                $sql .= " AND p.is_bestseller = 1";
            }

            if (!empty($filters['is_new_arrival'])) {
                $sql .= " AND p.is_new_arrival = 1";
            }

            // Ordering
            $sort = $filters['sort'] ?? 'recommended';
            switch ($sort) {
                case 'price-low':
                    $sql .= " ORDER BY p.selling_price ASC";
                    break;
                case 'price-high':
                    $sql .= " ORDER BY p.selling_price DESC";
                    break;
                case 'rating':
                    $sql .= " ORDER BY p.rating DESC";
                    break;
                case 'newest':
                    $sql .= " ORDER BY p.created_at DESC";
                    break;
                default:
                    $sql .= " ORDER BY p.is_bestseller DESC, p.created_at DESC";
                    break;
            }

            $limit = isset($filters['limit']) ? (int)$filters['limit'] : 50;
            $offset = isset($filters['offset']) ? (int)$filters['offset'] : 0;
            $sql .= " LIMIT $limit OFFSET $offset";

            $stmt = Database::query($sql, $params);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch images and variants in batch for all fetched products
            if (!empty($products)) {
                $productIds = array_column($products, 'id');
                $inQuery = implode(',', array_fill(0, count($productIds), '?'));

                // Images
                $imgStmt = Database::query("SELECT * FROM product_images WHERE product_id IN ($inQuery) ORDER BY display_order ASC", $productIds);
                $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
                $imagesByProduct = [];
                foreach ($images as $img) {
                    $imagesByProduct[$img['product_id']][] = [
                        'id' => $img['id'],
                        'url' => $img['image_url'],
                        'altText' => $img['alt_text'] ?? '',
                        'isPrimary' => (bool)$img['is_primary'],
                    ];
                }

                // Variants
                $varStmt = Database::query("SELECT * FROM product_variants WHERE product_id IN ($inQuery)", $productIds);
                $variants = $varStmt->fetchAll(PDO::FETCH_ASSOC);
                $variantsByProduct = [];
                foreach ($variants as $v) {
                    $variantsByProduct[$v['product_id']][] = [
                        'id' => $v['id'],
                        'sku' => $v['sku'],
                        'size' => $v['size'],
                        'color' => $v['color'],
                        'colorHex' => $v['color_hex'] ?? '#7B2435',
                        'stock' => (int)$v['stock'],
                    ];
                }

                // Format JSON response fields
                foreach ($products as &$p) {
                    $p['images'] = $imagesByProduct[$p['id']] ?? [];
                    $p['variants'] = $variantsByProduct[$p['id']] ?? [];
                    $p['collections'] = !empty($p['collections']) ? (json_decode($p['collections'], true) ?: [$p['collections']]) : ['Festive Edit'];
                    $p['tags'] = !empty($p['tags']) ? (json_decode($p['tags'], true) ?: []) : ['Ethnic'];
                    $p['features'] = !empty($p['features']) ? (json_decode($p['features'], true) ?: []) : [];
                    $p['careInstructions'] = !empty($p['care_instructions']) ? (json_decode($p['care_instructions'], true) ?: []) : ['Gentle Hand Wash'];
                    $p['isBestseller'] = (bool)($p['is_bestseller'] ?? false);
                    $p['isNewArrival'] = (bool)($p['is_new_arrival'] ?? false);
                    $p['isTrending'] = (bool)($p['is_trending'] ?? false);
                    $p['sellingPrice'] = (float)$p['selling_price'];
                    $p['mrp'] = (float)$p['mrp'];
                    $p['discountPercent'] = (int)($p['discount_percent'] ?? 0);
                    $p['rating'] = (float)($p['rating'] ?? 4.8);
                    $p['reviewCount'] = (int)($p['review_count'] ?? 0);
                }
            }

            return $products;
        });
    }

    /**
     * Find single product by slug or ID with all relations
     */
    public static function findBySlugOrId(string $slugOrId): ?array
    {
        $cacheKey = 'product_detail_' . $slugOrId;
        
        return Cache::remember($cacheKey, 600, function() use ($slugOrId) {
            $stmt = Database::query("SELECT * FROM products WHERE slug = ? OR id = ? LIMIT 1", [$slugOrId, $slugOrId]);
            $p = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$p) return null;

            // Fetch images
            $imgStmt = Database::query("SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC", [$p['id']]);
            $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
            $p['images'] = array_map(function($img) {
                return [
                    'id' => $img['id'],
                    'url' => $img['image_url'],
                    'altText' => $img['alt_text'] ?? '',
                    'isPrimary' => (bool)$img['is_primary'],
                ];
            }, $images);

            // Fetch variants
            $varStmt = Database::query("SELECT * FROM product_variants WHERE product_id = ?", [$p['id']]);
            $variants = $varStmt->fetchAll(PDO::FETCH_ASSOC);
            $p['variants'] = array_map(function($v) {
                return [
                    'id' => $v['id'],
                    'sku' => $v['sku'],
                    'size' => $v['size'],
                    'color' => $v['color'],
                    'colorHex' => $v['color_hex'] ?? '#7B2435',
                    'stock' => (int)$v['stock'],
                ];
            }, $variants);

            $p['collections'] = !empty($p['collections']) ? (json_decode($p['collections'], true) ?: [$p['collections']]) : ['Festive Edit'];
            $p['tags'] = !empty($p['tags']) ? (json_decode($p['tags'], true) ?: []) : ['Ethnic'];
            $p['features'] = !empty($p['features']) ? (json_decode($p['features'], true) ?: []) : [];
            $p['careInstructions'] = !empty($p['care_instructions']) ? (json_decode($p['care_instructions'], true) ?: []) : ['Gentle Hand Wash'];
            $p['isBestseller'] = (bool)($p['is_bestseller'] ?? false);
            $p['isNewArrival'] = (bool)($p['is_new_arrival'] ?? false);
            $p['isTrending'] = (bool)($p['is_trending'] ?? false);
            $p['sellingPrice'] = (float)$p['selling_price'];
            $p['mrp'] = (float)$p['mrp'];
            $p['discountPercent'] = (int)($p['discount_percent'] ?? 0);
            $p['rating'] = (float)($p['rating'] ?? 4.8);
            $p['reviewCount'] = (int)($p['review_count'] ?? 0);

            return $p;
        });
    }

    /**
     * Upsert product with relations and transaction
     */
    public static function saveProduct(array $data): array
    {
        $id = $data['id'] ?? ('prod-' . time() . '-' . rand(100, 999));
        $sku = $data['sku'] ?? ('VDY-' . strtoupper(substr(md5(uniqid()), 0, 6)));
        $name = $data['name'] ?? 'Handcrafted Kurti';
        $slug = $data['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
        $category = $data['category'] ?? 'Women';
        $subcategory = $data['subcategory'] ?? 'Kurtas & Kurtis';
        $sellingPrice = (float)($data['sellingPrice'] ?? $data['selling_price'] ?? 1499);
        $mrp = (float)($data['mrp'] ?? 1999);
        $discount = $mrp > $sellingPrice ? round((($mrp - $sellingPrice) / $mrp) * 100) : 0;

        Database::beginTransaction();
        try {
            $sql = "INSERT INTO products (
                id, sku, name, slug, category, subcategory, mrp, selling_price, discount_percent,
                fabric, work, pattern, sleeve, neck_type, occasion, fit, length,
                description, collections, tags, features, care_instructions,
                is_bestseller, is_new_arrival, is_trending, rating, review_count
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            ) ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                slug = VALUES(slug),
                category = VALUES(category),
                subcategory = VALUES(subcategory),
                mrp = VALUES(mrp),
                selling_price = VALUES(selling_price),
                discount_percent = VALUES(discount_percent),
                fabric = VALUES(fabric),
                work = VALUES(work),
                description = VALUES(description),
                is_bestseller = VALUES(is_bestseller),
                is_new_arrival = VALUES(is_new_arrival),
                updated_at = CURRENT_TIMESTAMP";

            Database::query($sql, [
                $id,
                $sku,
                $name,
                $slug,
                $category,
                $subcategory,
                $mrp,
                $sellingPrice,
                $discount,
                $data['fabric'] ?? 'Cotton',
                $data['work'] ?? 'Artisanal Embroidery',
                $data['pattern'] ?? 'Floral',
                $data['sleeve'] ?? '3/4th Sleeve',
                $data['neckType'] ?? $data['neck_type'] ?? 'Round Neck',
                $data['occasion'] ?? 'Festive',
                $data['fit'] ?? 'Regular Fit',
                $data['length'] ?? 'Calf Length',
                $data['description'] ?? '',
                json_encode($data['collections'] ?? ['Festive Edit']),
                json_encode($data['tags'] ?? ['Ethnic']),
                json_encode($data['features'] ?? []),
                json_encode($data['careInstructions'] ?? ['Gentle Hand Wash']),
                !empty($data['isBestseller']) ? 1 : 0,
                !empty($data['isNewArrival']) ? 1 : 0,
                !empty($data['isTrending']) ? 1 : 0,
                $data['rating'] ?? 4.8,
                $data['reviewCount'] ?? 0
            ]);

            // Save Images
            if (!empty($data['images']) && is_array($data['images'])) {
                Database::query("DELETE FROM product_images WHERE product_id = ?", [$id]);
                foreach ($data['images'] as $idx => $img) {
                    Database::query(
                        "INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                        [
                            $img['id'] ?? ('img-' . uniqid()),
                            $id,
                            is_string($img) ? $img : ($img['url'] ?? ''),
                            is_array($img) ? ($img['altText'] ?? $name) : $name,
                            $idx === 0 ? 1 : 0,
                            $idx
                        ]
                    );
                }
            }

            // Save Variants
            if (!empty($data['variants']) && is_array($data['variants'])) {
                Database::query("DELETE FROM product_variants WHERE product_id = ?", [$id]);
                foreach ($data['variants'] as $v) {
                    Database::query(
                        "INSERT INTO product_variants (id, product_id, sku, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [
                            $v['id'] ?? ('var-' . uniqid()),
                            $id,
                            $v['sku'] ?? ($sku . '-' . ($v['size'] ?? 'M')),
                            $v['size'] ?? 'M',
                            $v['color'] ?? 'Original',
                            $v['colorHex'] ?? '#7B2435',
                            (int)($v['stock'] ?? 10)
                        ]
                    );
                }
            }

            Database::commit();

            // Invalidate Product Caches
            Cache::flush();

            return self::findBySlugOrId($id);
        } catch (\Exception $e) {
            Database::rollBack();
            throw $e;
        }
    }
}
