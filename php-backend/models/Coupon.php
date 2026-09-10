<?php
namespace Models;

use Core\Model;
use Core\Database;
use Core\Cache;
use PDO;

/**
 * Coupon Model & Calculation Logic
 */
class Coupon extends Model
{
    protected static string $table = 'coupons';
    protected static string $primaryKey = 'id';

    public static function getActiveCoupons(): array
    {
        return Cache::remember('active_coupons_list', 1800, function() {
            $stmt = Database::query("SELECT * FROM coupons WHERE is_active = 1 ORDER BY min_order_amount ASC");
            $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return array_map(function($c) {
                return [
                    'id' => $c['id'],
                    'code' => $c['code'],
                    'title' => $c['title'],
                    'description' => $c['description'] ?? '',
                    'discountType' => $c['discount_type'],
                    'discountValue' => (float)$c['discount_value'],
                    'minOrderAmount' => (float)($c['min_order_amount'] ?? 0),
                    'maxDiscountAmount' => !empty($c['max_discount_amount']) ? (float)$c['max_discount_amount'] : null,
                    'expiryDate' => $c['expiry_date'] ?? null,
                    'isActive' => (bool)$c['is_active']
                ];
            }, $coupons);
        });
    }

    public static function validate(string $code, float $subtotal): array
    {
        $code = strtoupper(trim($code));
        $stmt = Database::query("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1", [$code]);
        $c = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$c) {
            return ['valid' => false, 'discount' => 0, 'message' => 'Invalid or expired coupon code'];
        }

        $minAmount = (float)($c['min_order_amount'] ?? 0);
        if ($subtotal < $minAmount) {
            return ['valid' => false, 'discount' => 0, 'message' => "Minimum order value of ₹$minAmount required for this coupon"];
        }

        $discount = 0;
        if ($c['discount_type'] === 'percentage') {
            $discount = round(($subtotal * (float)$c['discount_value']) / 100);
            if (!empty($c['max_discount_amount']) && $discount > (float)$c['max_discount_amount']) {
                $discount = (float)$c['max_discount_amount'];
            }
        } else {
            $discount = (float)$c['discount_value'];
        }

        return [
            'valid' => true,
            'discount' => min($discount, $subtotal),
            'coupon' => [
                'id' => $c['id'],
                'code' => $c['code'],
                'title' => $c['title'],
                'discountType' => $c['discount_type'],
                'discountValue' => (float)$c['discount_value'],
            ],
            'message' => "Coupon $code successfully applied!"
        ];
    }
}
