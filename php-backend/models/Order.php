<?php
namespace Models;

use Core\Model;
use Core\Database;
use Core\Cache;
use PDO;

/**
 * Order Model (Transactional Multi-Table Insert & Status Tracking)
 */
class Order extends Model
{
    protected static string $table = 'orders';
    protected static string $primaryKey = 'id';

    public static function getOrdersByUser(?string $userId = null): array
    {
        $sql = "SELECT * FROM orders";
        $params = [];
        if ($userId) {
            $sql .= " WHERE user_id = ?";
            $params[] = $userId;
        }
        $sql .= " ORDER BY created_at DESC LIMIT 100";

        $stmt = Database::query($sql, $params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($orders)) return [];

        $orderIds = array_column($orders, 'id');
        $inQuery = implode(',', array_fill(0, count($orderIds), '?'));

        // Items
        $itemsStmt = Database::query("SELECT * FROM order_items WHERE order_id IN ($inQuery)", $orderIds);
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
        $itemsByOrder = [];
        foreach ($items as $item) {
            $itemsByOrder[$item['order_id']][] = [
                'id' => $item['id'],
                'productId' => $item['product_id'],
                'productName' => $item['product_name'],
                'productImage' => $item['product_image'],
                'variantId' => $item['variant_id'],
                'sku' => $item['sku'],
                'size' => $item['size'],
                'color' => $item['color'],
                'quantity' => (int)$item['quantity'],
                'price' => (float)$item['unit_price'],
                'mrp' => (float)$item['mrp'],
                'subtotal' => (float)$item['total_price'],
            ];
        }

        // Status history
        $histStmt = Database::query("SELECT * FROM order_status_history WHERE order_id IN ($inQuery) ORDER BY created_at ASC", $orderIds);
        $hist = $histStmt->fetchAll(PDO::FETCH_ASSOC);
        $histByOrder = [];
        foreach ($hist as $h) {
            $histByOrder[$h['order_id']][] = [
                'status' => $h['status'],
                'timestamp' => $h['created_at'],
                'comment' => $h['comment'] ?? ''
            ];
        }

        foreach ($orders as &$o) {
            $o['items'] = $itemsByOrder[$o['id']] ?? [];
            $o['statusHistory'] = $histByOrder[$o['id']] ?? [
                ['status' => $o['order_status'], 'timestamp' => $o['created_at'], 'comment' => 'Order placed']
            ];
            $o['shippingAddress'] = !empty($o['shipping_address']) ? json_decode($o['shipping_address'], true) : [];
            $o['orderNumber'] = $o['order_number'];
            $o['invoiceNumber'] = $o['invoice_number'];
            $o['userId'] = $o['user_id'];
            $o['customerName'] = $o['customer_name'];
            $o['customerEmail'] = $o['customer_email'];
            $o['customerPhone'] = $o['customer_phone'];
            $o['paymentMethod'] = $o['payment_method'];
            $o['paymentStatus'] = $o['payment_status'];
            $o['orderStatus'] = $o['order_status'];
            $o['razorpayPaymentId'] = $o['razorpay_payment_id'];
            $o['razorpayOrderId'] = $o['razorpay_order_id'];
            $o['subtotal'] = (float)$o['subtotal'];
            $o['discountAmount'] = (float)$o['discount_amount'];
            $o['couponCode'] = $o['coupon_code'];
            $o['shippingFee'] = (float)$o['shipping_fee'];
            $o['taxAmount'] = (float)$o['tax_amount'];
            $o['grandTotal'] = (float)$o['grand_total'];
            $o['trackingNumber'] = $o['tracking_number'];
            $o['courierPartner'] = $o['courier_partner'];
            $o['estimatedDeliveryDate'] = $o['estimated_delivery_date'];
            $o['createdAt'] = $o['created_at'];
        }

        return $orders;
    }

    public static function createOrder(array $data): array
    {
        $id = $data['id'] ?? ('ord-' . time() . '-' . rand(100, 999));
        $orderNumber = $data['orderNumber'] ?? ('VDY-' . date('Y') . '-' . rand(1000, 9999));
        $invoiceNumber = $data['invoiceNumber'] ?? ('INV-VDY-' . date('Y') . '-' . rand(1000, 9999));

        Database::beginTransaction();
        try {
            $sql = "INSERT INTO orders (
                id, order_number, invoice_number, user_id, customer_name, customer_email, customer_phone,
                shipping_address, payment_method, payment_status, razorpay_payment_id, razorpay_order_id,
                subtotal, discount_amount, coupon_code, shipping_fee, tax_amount, grand_total,
                order_status, tracking_number, courier_partner, estimated_delivery_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            Database::query($sql, [
                $id,
                $orderNumber,
                $invoiceNumber,
                $data['userId'] ?? 'guest-user',
                $data['customerName'] ?? 'Customer',
                $data['customerEmail'] ?? '',
                $data['customerPhone'] ?? '',
                json_encode($data['shippingAddress'] ?? []),
                $data['paymentMethod'] ?? 'Razorpay',
                $data['paymentStatus'] ?? 'Paid',
                $data['razorpayPaymentId'] ?? null,
                $data['razorpayOrderId'] ?? null,
                (float)($data['subtotal'] ?? 0),
                (float)($data['discountAmount'] ?? 0),
                $data['couponCode'] ?? null,
                (float)($data['shippingFee'] ?? 0),
                (float)($data['taxAmount'] ?? 0),
                (float)($data['grandTotal'] ?? 0),
                $data['orderStatus'] ?? 'Confirmed',
                $data['trackingNumber'] ?? ('BLUEDART-' . rand(1000000, 9999999)),
                $data['courierPartner'] ?? 'Blue Dart Express',
                $data['estimatedDeliveryDate'] ?? date('Y-m-d', strtotime('+4 days'))
            ]);

            // Insert Items
            if (!empty($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    Database::query(
                        "INSERT INTO order_items (id, order_id, product_id, product_name, product_image, variant_id, sku, size, color, quantity, unit_price, mrp, total_price)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                            'item-' . uniqid(),
                            $id,
                            $item['productId'] ?? '',
                            $item['productName'] ?? '',
                            $item['productImage'] ?? '',
                            $item['variantId'] ?? '',
                            $item['sku'] ?? '',
                            $item['size'] ?? 'M',
                            $item['color'] ?? 'Standard',
                            (int)($item['quantity'] ?? 1),
                            (float)($item['price'] ?? 0),
                            (float)($item['mrp'] ?? 0),
                            (float)($item['subtotal'] ?? ($item['price'] * ($item['quantity'] ?? 1)))
                        ]
                    );

                    // Reduce stock in product_variants
                    if (!empty($item['variantId'])) {
                        Database::query(
                            "UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ? OR sku = ?",
                            [(int)($item['quantity'] ?? 1), $item['variantId'], $item['sku'] ?? '']
                        );
                    }
                }
            }

            // Insert initial history
            Database::query(
                "INSERT INTO order_status_history (id, order_id, status, comment) VALUES (?, ?, ?, ?)",
                ['hist-' . uniqid(), $id, 'Confirmed', 'Order placed & verified']
            );

            Database::commit();

            $orders = self::getOrdersByUser($data['userId'] ?? null);
            return $orders[0] ?? ['id' => $id, 'orderNumber' => $orderNumber];
        } catch (\Exception $e) {
            Database::rollBack();
            throw $e;
        }
    }
}
