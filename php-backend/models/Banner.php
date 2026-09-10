<?php
namespace Models;

use Core\Model;
use Core\Database;
use Core\Cache;
use PDO;

/**
 * Hero Banners Model
 */
class Banner extends Model
{
    protected static string $table = 'banners';
    protected static string $primaryKey = 'id';

    public static function getActiveBanners(): array
    {
        return Cache::remember('active_banners_list', 1800, function() {
            $stmt = Database::query("SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC");
            $banners = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(function($b) {
                return [
                    'id' => $b['id'],
                    'title' => $b['title'],
                    'subtitle' => $b['subtitle'] ?? '',
                    'badge' => $b['badge'] ?? '',
                    'desktopImage' => $b['desktop_image'],
                    'mobileImage' => $b['mobile_image'] ?? $b['desktop_image'],
                    'ctaText' => $b['cta_text'] ?? 'Shop Now',
                    'ctaLink' => $b['cta_link'] ?? '/listing',
                    'isActive' => (bool)$b['is_active'],
                    'displayOrder' => (int)$b['display_order']
                ];
            }, $banners);
        });
    }

    public static function saveBanner(array $data): array
    {
        $id = $data['id'] ?? ('banner-' . time());
        $sql = "INSERT INTO banners (
            id, title, subtitle, badge, desktop_image, mobile_image, cta_text, cta_link, is_active, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            subtitle = VALUES(subtitle),
            badge = VALUES(badge),
            desktop_image = VALUES(desktop_image),
            mobile_image = VALUES(mobile_image),
            cta_text = VALUES(cta_text),
            cta_link = VALUES(cta_link),
            is_active = VALUES(is_active),
            display_order = VALUES(display_order)";

        Database::query($sql, [
            $id,
            $data['title'] ?? 'Festive Collection',
            $data['subtitle'] ?? '',
            $data['badge'] ?? '',
            $data['desktopImage'] ?? $data['desktop_image'] ?? '',
            $data['mobileImage'] ?? $data['mobile_image'] ?? ($data['desktopImage'] ?? ''),
            $data['ctaText'] ?? $data['cta_text'] ?? 'Shop Now',
            $data['ctaLink'] ?? $data['cta_link'] ?? '/listing',
            isset($data['isActive']) ? ($data['isActive'] ? 1 : 0) : 1,
            (int)($data['displayOrder'] ?? $data['display_order'] ?? 0)
        ]);

        Cache::delete('active_banners_list');
        return self::find($id) ?: $data;
    }
}
