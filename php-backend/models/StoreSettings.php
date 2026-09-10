<?php
namespace Models;

use Core\Model;
use Core\Database;
use Core\Cache;
use PDO;

/**
 * Store Settings & Branding Model
 */
class StoreSettings extends Model
{
    protected static string $table = 'store_settings';
    protected static string $primaryKey = 'id';

    public static function getSettings(): array
    {
        return Cache::remember('store_settings_cache', 3600, function() {
            $stmt = Database::query("SELECT * FROM store_settings WHERE id = 1 LIMIT 1");
            $s = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$s) {
                return [
                    'storeName' => 'Vedaaya',
                    'tagline' => 'Timeless Indian Elegance • Handcrafted Ethnic Kurtis & Festive Edit',
                    'primaryColor' => '#7B2435',
                    'secondaryColor' => '#C98C97',
                    'accentColor' => '#D4AF37',
                    'backgroundColor' => '#FAF6F0',
                    'phone' => '+91 98112 34567',
                    'email' => 'care@vedaaya.com',
                    'freeShippingThreshold' => 999
                ];
            }

            return [
                'storeName' => $s['store_name'],
                'tagline' => $s['tagline'],
                'logoUrl' => $s['logo_url'],
                'logoType' => $s['logo_type'] ?? 'both',
                'primaryColor' => $s['primary_color'],
                'secondaryColor' => $s['secondary_color'],
                'accentColor' => $s['accent_color'],
                'backgroundColor' => $s['background_color'],
                'activeThemePreset' => $s['active_theme_preset'] ?? 'royal-ruby',
                'headerAnnouncementText' => $s['header_announcement_text'] ?? '🌟 Grand Festive Season: FLAT 20% OFF using code VEDAAYA20',
                'announcementActive' => (bool)($s['announcement_active'] ?? true),
                'freeShippingThreshold' => (int)($s['free_shipping_threshold'] ?? 999),
                'phone' => $s['phone'],
                'email' => $s['email'],
                'address' => $s['address'],
                'instagramUrl' => $s['instagram_url'],
                'facebookUrl' => $s['facebook_url'],
                'whatsappNumber' => $s['whatsapp_number'],
            ];
        });
    }

    public static function updateSettings(array $data): array
    {
        $sql = "INSERT INTO store_settings (
            id, store_name, tagline, logo_url, logo_type, primary_color, secondary_color, accent_color,
            background_color, active_theme_preset, header_announcement_text, announcement_active,
            free_shipping_threshold, phone, email, address, instagram_url, facebook_url, whatsapp_number
        ) VALUES (
            1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        ) ON DUPLICATE KEY UPDATE
            store_name = VALUES(store_name),
            tagline = VALUES(tagline),
            logo_url = VALUES(logo_url),
            logo_type = VALUES(logo_type),
            primary_color = VALUES(primary_color),
            secondary_color = VALUES(secondary_color),
            accent_color = VALUES(accent_color),
            background_color = VALUES(background_color),
            active_theme_preset = VALUES(active_theme_preset),
            header_announcement_text = VALUES(header_announcement_text),
            announcement_active = VALUES(announcement_active),
            free_shipping_threshold = VALUES(free_shipping_threshold),
            phone = VALUES(phone),
            email = VALUES(email),
            address = VALUES(address),
            instagram_url = VALUES(instagram_url),
            facebook_url = VALUES(facebook_url),
            whatsapp_number = VALUES(whatsapp_number)";

        Database::query($sql, [
            $data['storeName'] ?? 'Vedaaya',
            $data['tagline'] ?? '',
            $data['logoUrl'] ?? '',
            $data['logoType'] ?? 'both',
            $data['primaryColor'] ?? '#7B2435',
            $data['secondaryColor'] ?? '#C98C97',
            $data['accentColor'] ?? '#D4AF37',
            $data['backgroundColor'] ?? '#FAF6F0',
            $data['activeThemePreset'] ?? 'royal-ruby',
            $data['headerAnnouncementText'] ?? '🌟 Grand Festive Season: FLAT 20% OFF',
            !empty($data['announcementActive']) ? 1 : 0,
            (int)($data['freeShippingThreshold'] ?? 999),
            $data['phone'] ?? '+91 98112 34567',
            $data['email'] ?? 'care@vedaaya.com',
            $data['address'] ?? 'Jaipur, Rajasthan',
            $data['instagramUrl'] ?? '',
            $data['facebookUrl'] ?? '',
            $data['whatsappNumber'] ?? ''
        ]);

        Cache::delete('store_settings_cache');
        return self::getSettings();
    }
}
