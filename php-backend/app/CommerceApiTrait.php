<?php

declare(strict_types=1);

trait CommerceApiTrait
{
    private function validateCouponEndpoint(): array
    {
        $code = (string) ($this->body['code'] ?? $this->query['code'] ?? '');
        $subtotal = (float) ($this->body['subtotal'] ?? $this->query['subtotal'] ?? 0);
        $items = is_array($this->body['items'] ?? null) ? $this->body['items'] : [];
        if ($items) {
            $cart = $this->resolveCartItems($items, false);
            $subtotal = $cart['subtotal'];
            $items = $cart['items'];
        }
        return $this->result($this->couponResult($code, $subtotal, (string) ($this->body['userId'] ?? $this->query['userId'] ?? ''), $items));
    }

    private function couponResult(string $code, float $subtotal, string $userId = '', array $items = []): array
    {
        $code = strtoupper(trim($code));
        if ($code === '') return ['valid' => false, 'discount' => 0, 'message' => 'Enter a coupon code.'];
        $stmt = $this->db->prepare('SELECT * FROM coupons WHERE code=? LIMIT 1');
        $stmt->execute([$code]);
        $row = $stmt->fetch();
        if (!$row || !(bool) $row['is_active']) return ['valid' => false, 'discount' => 0, 'message' => 'Invalid or inactive coupon code.'];
        if ($row['valid_until'] && strtotime($row['valid_until']) < time()) return ['valid' => false, 'discount' => 0, 'message' => 'This coupon has expired.'];
        if ($row['usage_limit'] !== null && (int) $row['usage_count'] >= (int) $row['usage_limit']) return ['valid' => false, 'discount' => 0, 'message' => 'This coupon has reached its usage limit.'];
        if ($subtotal < (float) $row['min_order_amount']) return ['valid' => false, 'discount' => 0, 'message' => 'Minimum order of ₹' . number_format((float) $row['min_order_amount'], 0) . ' is required.'];
        if ((bool) $row['first_order_only'] && $userId !== '') {
            $count = $this->db->prepare("SELECT COUNT(*) FROM orders WHERE user_id=? AND order_status<>'Cancelled'");
            $count->execute([$userId]);
            if ((int) $count->fetchColumn() > 0) return ['valid' => false, 'discount' => 0, 'message' => 'This coupon is valid only on the first order.'];
        }

        $coupon = jsonFromDb($row['data'], []);
        $coupon = deepMerge($coupon, ['id' => $row['id'], 'code' => $row['code'], 'discountType' => $row['discount_type'], 'discountValue' => (float) $row['discount_value'], 'usageCount' => (int) $row['usage_count']]);
        $eligibleSubtotal = $subtotal;
        $allowedProducts = array_map('strval', $coupon['applicableProducts'] ?? []);
        $allowedCategories = array_map('strtolower', $coupon['applicableCategories'] ?? []);
        if (($allowedProducts || $allowedCategories) && $items) {
            $eligibleSubtotal = 0;
            foreach ($items as $item) {
                if (in_array((string) ($item['productId'] ?? ''), $allowedProducts, true) || in_array(strtolower((string) ($item['category'] ?? '')), $allowedCategories, true)) {
                    $eligibleSubtotal += (float) ($item['subtotal'] ?? 0);
                }
            }
            if ($eligibleSubtotal <= 0) return ['valid' => false, 'discount' => 0, 'message' => 'This coupon does not apply to the selected products.'];
        }
        $discount = $row['discount_type'] === 'percentage'
            ? round($eligibleSubtotal * (float) $row['discount_value'] / 100, 2)
            : (float) $row['discount_value'];
        if ($row['max_discount_amount'] !== null) $discount = min($discount, (float) $row['max_discount_amount']);
        $discount = min($discount, $subtotal);
        return ['valid' => true, 'discount' => $discount, 'coupon' => $coupon, 'message' => 'Coupon applied: ' . ($coupon['title'] ?? $code)];
    }

    private function cartValidate(): array
    {
        $items = $this->body['items'] ?? [];
        if (!is_array($items)) throw new ApiException('items must be an array.', 422);
        $cart = $this->resolveCartItems($items, false);
        $coupon = ['valid' => false, 'discount' => 0];
        $code = trim((string) ($this->body['couponCode'] ?? ''));
        if ($code !== '') $coupon = $this->couponResult($code, $cart['subtotal'], (string) ($this->body['userId'] ?? ''), $cart['items']);
        $shipping = $this->shippingSettings();
        $threshold = max(0, (float) ($shipping['freeShippingThreshold'] ?? 999));
        $fee = $cart['subtotal'] >= $threshold || $cart['subtotal'] <= 0 ? 0 : max(0, (float) ($shipping['standardShippingFee'] ?? 99));
        return $this->result([
            'valid' => count($cart['stockWarnings']) === 0, 'items' => $cart['items'], 'subtotal' => $cart['subtotal'],
            'totalMrp' => $cart['totalMrp'], 'discountAmount' => (float) ($coupon['discount'] ?? 0),
            'appliedCoupon' => !empty($coupon['valid']) ? $code : null, 'shippingFee' => $fee,
            'isFreeShipping' => $fee === 0.0, 'freeShippingThreshold' => $threshold,
            'grandTotal' => max(0, $cart['subtotal'] - (float) ($coupon['discount'] ?? 0) + $fee),
            'priceChangedWarnings' => $cart['priceChangedWarnings'], 'stockWarnings' => $cart['stockWarnings'],
        ]);
    }

    private function checkoutSummary(): array
    {
        $items = $this->body['items'] ?? [];
        if (!is_array($items) || !$items) throw new ApiException('At least one cart item is required.', 422);
        $cart = $this->resolveCartItems($items, false);
        $couponCode = trim((string) ($this->body['couponCode'] ?? ''));
        $coupon = $couponCode !== '' ? $this->couponResult($couponCode, $cart['subtotal'], (string) ($this->body['userId'] ?? ''), $cart['items']) : ['valid' => false, 'discount' => 0];
        $shipping = $this->shippingSettings();
        $delivery = (string) ($this->body['deliveryType'] ?? 'standard');
        $threshold = max(0, (float) ($shipping['freeShippingThreshold'] ?? 999));
        $shippingFee = $cart['subtotal'] >= $threshold ? 0.0 : max(0, (float) ($shipping['standardShippingFee'] ?? 99));
        if ($delivery === 'express') {
            if (empty($shipping['expressAvailable'])) throw new ApiException('Express delivery is not available.', 422);
            $shippingFee = max(0, (float) ($shipping['expressShippingFee'] ?? 199));
        }
        $pincode = trim((string) ($this->body['shippingAddress']['pincode'] ?? ''));
        $serviceable = array_map('strval', $shipping['serviceablePincodes'] ?? $shipping['pincodeRules']['serviceableList'] ?? []);
        $restricted = array_map('strval', $shipping['restrictedPincodes'] ?? $shipping['pincodeRules']['restrictedList'] ?? []);
        $mode = (string) ($shipping['pincodeRuleMode'] ?? $shipping['pincodeRules']['mode'] ?? 'all_india');
        if ($pincode !== '' && (($mode === 'whitelist' && $serviceable && !in_array($pincode, $serviceable, true)) || in_array($pincode, $restricted, true))) {
            throw new ApiException('Delivery is not available for this pincode.', 422);
        }
        $codBlocked = array_map('strval', $shipping['blockedCodPincodes'] ?? $shipping['pincodeRules']['codBlockedList'] ?? []);
        $codAvailable = !empty($shipping['codAvailable']) && ($pincode === '' || !in_array($pincode, $codBlocked, true));
        $codFee = 0.0;
        if (strtoupper((string) ($this->body['paymentMethod'] ?? '')) === 'COD') {
            $min = (float) ($shipping['minCodOrderValue'] ?? $shipping['codMinOrder'] ?? 0);
            $max = (float) ($shipping['maxCodOrderValue'] ?? $shipping['codMaxOrder'] ?? PHP_FLOAT_MAX);
            $codAvailable = $codAvailable && $cart['subtotal'] >= $min && $cart['subtotal'] <= $max;
            if (!$codAvailable) throw new ApiException('Cash on Delivery is not available for this order.', 422);
            $codFee = max(0, (float) ($shipping['codFee'] ?? 0));
        }
        $discount = (float) ($coupon['discount'] ?? 0);
        return $this->result([
            'success' => true, 'items' => $cart['items'], 'subtotal' => $cart['subtotal'], 'totalMrp' => $cart['totalMrp'],
            'discountAmount' => $discount, 'coupon' => !empty($coupon['valid']) ? $coupon['coupon'] : null,
            'shippingFee' => $shippingFee, 'isFreeShipping' => $shippingFee === 0.0, 'isCodAvailable' => $codAvailable,
            'codFee' => $codFee, 'grandTotal' => max(0, $cart['subtotal'] - $discount + $shippingFee + $codFee),
            'warnings' => array_merge($cart['priceChangedWarnings'], $cart['stockWarnings']),
        ]);
    }

    private function resolveCartItems(array $items, bool $lock): array
    {
        $validated = []; $subtotal = 0.0; $totalMrp = 0.0; $priceWarnings = []; $stockWarnings = [];
        foreach ($items as $index => $item) {
            if (!is_array($item)) throw new ApiException("Cart item {$index} is invalid.", 422);
            $productId = trim((string) ($item['productId'] ?? $item['product']['id'] ?? ''));
            if ($productId === '') throw new ApiException("Cart item {$index} has no product ID.", 422);
            $quantity = filter_var($item['quantity'] ?? 1, FILTER_VALIDATE_INT);
            if ($quantity === false || $quantity < 1 || $quantity > 99) throw new ApiException('Item quantity must be a whole number between 1 and 99.', 422);
            $sql = 'SELECT v.*,p.name product_name,p.category,p.selling_price product_price,p.mrp product_mrp,p.is_active,
                           (SELECT url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,display_order LIMIT 1) product_image
                    FROM products p JOIN product_variants v ON v.product_id=p.id WHERE p.id=?';
            $params = [$productId];
            if (!empty($item['variantId'])) { $sql .= ' AND v.id=?'; $params[] = (string) $item['variantId']; }
            else {
                if (!empty($item['size'])) { $sql .= ' AND v.size=?'; $params[] = (string) $item['size']; }
                if (!empty($item['color'])) { $sql .= ' AND v.color=?'; $params[] = (string) $item['color']; }
            }
            $sql .= ' LIMIT 1' . ($lock ? ' FOR UPDATE' : '');
            $stmt = $this->db->prepare($sql); $stmt->execute($params); $row = $stmt->fetch();
            if (!$row || !(bool) $row['is_active']) throw new ApiException("Product or variant for cart item {$index} is unavailable.", 409);
            $price = $row['price'] === null ? (float) $row['product_price'] : (float) $row['price'];
            $mrp = $row['mrp'] === null ? (float) $row['product_mrp'] : (float) $row['mrp'];
            if (isset($item['price']) && abs((float) $item['price'] - $price) >= 0.01) $priceWarnings[] = "Price updated for {$row['product_name']} from ₹{$item['price']} to ₹{$price}.";
            if ((int) $row['stock'] < $quantity) $stockWarnings[] = "Only {$row['stock']} unit(s) of {$row['product_name']} ({$row['size']}, {$row['color']}) are available.";
            $itemSubtotal = round($price * $quantity, 2);
            $validated[] = deepMerge($item, [
                'productId' => $productId, 'variantId' => $row['id'], 'sku' => $row['sku'],
                'name' => $row['product_name'], 'productName' => $row['product_name'],
                'image' => $row['product_image'], 'productImage' => $row['product_image'],
                'category' => $row['category'], 'size' => $row['size'], 'color' => $row['color'],
                'quantity' => $quantity, 'price' => $price, 'mrp' => $mrp, 'stock' => (int) $row['stock'], 'subtotal' => $itemSubtotal,
            ]);
            $subtotal += $itemSubtotal; $totalMrp += $mrp * $quantity;
        }
        return ['items' => $validated, 'subtotal' => round($subtotal, 2), 'totalMrp' => round($totalMrp, 2), 'priceChangedWarnings' => $priceWarnings, 'stockWarnings' => $stockWarnings];
    }

    private function createOrder(): array
    {
        $items = $this->body['items'] ?? [];
        if (!is_array($items) || !$items) throw new ApiException('At least one order item is required.', 422);
        $address = $this->body['shippingAddress'] ?? null;
        if (!is_array($address) || trim((string) ($address['pincode'] ?? '')) === '') throw new ApiException('A shipping address with pincode is required.', 422);
        $method = trim((string) ($this->body['paymentMethod'] ?? 'COD'));
        $isCod = in_array(strtolower($method), ['cod', 'cash on delivery'], true);
        $userId = trim((string) ($this->body['userId'] ?? ''));
        if ($this->bearerToken() !== null && $this->optionalAdmin() === null) {
            $customer = $this->requireCustomer();
            $userId = (string) $customer['id'];
        } elseif ($userId !== '' && $this->optionalAdmin() === null) {
            throw new ApiException('Sign in before placing an order on a customer account.', 401);
        }
        if ($userId !== '') {
            $this->ensureUser(
                $userId,
                (string) ($this->body['customerEmail'] ?? ''),
                (string) ($this->body['customerName'] ?? 'Customer'),
            );
        }

        $this->db->beginTransaction();
        try {
            $cart = $this->resolveCartItems($items, true);
            if ($cart['stockWarnings']) throw new ApiException('One or more items do not have enough stock.', 409, ['stockWarnings' => $cart['stockWarnings']]);
            $couponCode = trim((string) ($this->body['couponCode'] ?? ''));
            $coupon = $couponCode !== '' ? $this->couponResult($couponCode, $cart['subtotal'], $userId, $cart['items']) : ['valid' => false, 'discount' => 0];
            if ($couponCode !== '' && empty($coupon['valid'])) throw new ApiException((string) $coupon['message'], 422);
            $shipping = $this->shippingSettings();
            $fee = $cart['subtotal'] >= (float) ($shipping['freeShippingThreshold'] ?? 999) ? 0.0 : (float) ($shipping['standardShippingFee'] ?? 99);
            $codFee = $isCod ? (float) ($shipping['codFee'] ?? 0) : 0.0;
            $discount = (float) ($coupon['discount'] ?? 0);
            $tax = 0.0;
            $total = round(max(0, $cart['subtotal'] - $discount + $fee + $codFee + $tax), 2);
            $paymentTxn = null;
            if (!$isCod) {
                $providerOrderId = trim((string) ($this->body['razorpayOrderId'] ?? $this->body['razorpay_order_id'] ?? ''));
                $providerPaymentId = trim((string) ($this->body['razorpayPaymentId'] ?? $this->body['razorpay_payment_id'] ?? ''));
                $stmt = $this->db->prepare("SELECT * FROM payment_transactions WHERE provider='razorpay' AND provider_order_id=? AND provider_payment_id=? AND status='verified' FOR UPDATE");
                $stmt->execute([$providerOrderId, $providerPaymentId]); $paymentTxn = $stmt->fetch();
                if (!$paymentTxn || (int) $paymentTxn['amount_paise'] !== (int) round($total * 100)) throw new ApiException('A verified payment matching the server-calculated total is required.', 402);
            }
            $id = apiId('ord');
            $number = 'VD-' . gmdate('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
            $createdAt = isoDate();
            $status = 'Confirmed';
            $paymentStatus = $isCod ? 'Pending' : 'Paid';
            $data = $this->body;
            unset($data['items']);
            $stmt = $this->db->prepare('INSERT INTO orders (id,order_number,invoice_number,user_id,customer_name,customer_email,customer_phone,shipping_address,billing_address,payment_method,payment_status,razorpay_payment_id,razorpay_order_id,subtotal,discount_amount,coupon_code,shipping_fee,tax_amount,grand_total,order_status,data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $stmt->execute([$id, $number, null, $userId ?: null, (string) ($this->body['customerName'] ?? $address['fullName'] ?? $address['name'] ?? 'Customer'), strtolower((string) ($this->body['customerEmail'] ?? $this->body['userEmail'] ?? 'guest@invalid.local')), (string) ($this->body['customerPhone'] ?? $address['phone'] ?? ''), jsonForDb($address), jsonForDb($this->body['billingAddress'] ?? $address), $method, $paymentStatus, $this->body['razorpayPaymentId'] ?? $this->body['razorpay_payment_id'] ?? null, $this->body['razorpayOrderId'] ?? $this->body['razorpay_order_id'] ?? null, $cart['subtotal'], $discount, $couponCode ?: null, $fee + $codFee, $tax, $total, $status, jsonForDb($data)]);
            $itemStmt = $this->db->prepare('INSERT INTO order_items (id,order_id,product_id,variant_id,sku,product_name,product_image,size,color,quantity,unit_price,mrp,subtotal,data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $stockStmt = $this->db->prepare('UPDATE product_variants SET stock=stock-? WHERE id=? AND stock>=?');
            foreach ($cart['items'] as $item) {
                $stockStmt->execute([$item['quantity'], $item['variantId'], $item['quantity']]);
                if ($stockStmt->rowCount() !== 1) throw new ApiException('Stock changed while the order was being placed. Please review your cart.', 409);
                $itemStmt->execute([apiId('itm'), $id, $item['productId'], $item['variantId'], $item['sku'], $item['productName'], $item['productImage'] ?? null, $item['size'], $item['color'], $item['quantity'], $item['price'], $item['mrp'], $item['subtotal'], jsonForDb($item)]);
            }
            $this->db->prepare('INSERT INTO order_status_history (id,order_id,status,comment,updated_by) VALUES (?,?,?,?,?)')->execute([apiId('hst'), $id, $status, 'Order placed successfully', 'customer']);
            if (!empty($coupon['valid'])) {
                $couponId = (string) $coupon['coupon']['id'];
                $this->db->prepare('UPDATE coupons SET usage_count=usage_count+1 WHERE id=?')->execute([$couponId]);
                $this->db->prepare('INSERT INTO coupon_usages (id,coupon_id,user_id,order_id,discount_amount) VALUES (?,?,?,?,?)')->execute([apiId('cpu'), $couponId, $userId ?: null, $id, $discount]);
            }
            if ($paymentTxn) $this->db->prepare('UPDATE payment_transactions SET order_id=? WHERE id=?')->execute([$id, $paymentTxn['id']]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
        return $this->result($this->findOrder($id), 201);
    }

    private function listOrders(): array
    {
        $sql = 'SELECT * FROM orders';
        $where = [];
        $params = [];
        $requestedUserId = trim((string) ($this->query['userId'] ?? ''));
        $requestedEmail = strtolower(trim((string) ($this->query['userEmail'] ?? '')));

        $admin = $this->optionalAdmin();
        if ($admin === null) {
            $customer = $this->requireCustomer();
            if ($requestedUserId !== '' && !hash_equals((string) $customer['id'], $requestedUserId)) {
                throw new ApiException('You cannot view another customer order history.', 403);
            }
            if ($requestedEmail !== '' && !hash_equals(strtolower((string) $customer['email']), $requestedEmail)) {
                throw new ApiException('You cannot view another customer order history.', 403);
            }
            $where[] = 'user_id=?';
            $params[] = $customer['id'];
        } else {
            if ($requestedUserId !== '') {
                $where[] = 'user_id=?';
                $params[] = $requestedUserId;
            }
            if ($requestedEmail !== '') {
                $where[] = 'LOWER(customer_email)=?';
                $params[] = $requestedEmail;
            }
        }

        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 500';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $this->result(array_map(fn($row) => $this->orderFromRow($row), $stmt->fetchAll()));
    }

    private function getOrder(string $id): array
    {
        $this->authorizeOrderAccess($id);
        $order = $this->findOrder($id);
        if (!$order) throw new ApiException('Order not found.', 404);
        return $this->result($order);
    }

    private function authorizeOrderAccess(string $id): void
    {
        if ($this->optionalAdmin() !== null) {
            return;
        }

        $customer = $this->requireCustomer();
        $stmt = $this->db->prepare('SELECT user_id FROM orders WHERE id=? OR order_number=? LIMIT 1');
        $stmt->execute([$id, $id]);
        $ownerId = $stmt->fetchColumn();
        if ($ownerId === false) {
            throw new ApiException('Order not found.', 404);
        }
        if (!$ownerId || !hash_equals((string) $customer['id'], (string) $ownerId)) {
            throw new ApiException('You cannot access this order.', 403);
        }
    }

    private function trackOrder(string $query): array
    {
        $query = trim($query);
        if ($query === '') {
            throw new ApiException('An order or tracking number is required.', 422);
        }
        $stmt = $this->db->prepare(
            'SELECT * FROM orders WHERE id=? OR order_number=? OR tracking_number=? LIMIT 1'
        );
        $stmt->execute([$query, $query, $query]);
        $row = $stmt->fetch();
        if (!$row) {
            return $this->result([
                'success' => false,
                'error' => 'No order found matching the tracking number or ID.',
            ], 404);
        }

        $order = $this->orderFromRow($row);
        $isPrivileged = $this->optionalAdmin() !== null;
        if (!$isPrivileged && $this->bearerToken() !== null) {
            try {
                $customer = $this->requireCustomer();
                $isPrivileged = $row['user_id']
                    && hash_equals((string) $customer['id'], (string) $row['user_id']);
            } catch (ApiException) {
                $isPrivileged = false;
            }
        }
        if (!$isPrivileged) {
            $order = array_intersect_key($order, array_flip([
                'id',
                'orderNumber',
                'orderStatus',
                'statusHistory',
                'trackingNumber',
                'courierPartner',
                'estimatedDeliveryDate',
                'createdAt',
                'updatedAt',
            ]));
        }
        return $this->result(['success' => true, 'order' => $order]);
    }

    private function findOrder(string $id, bool $forUpdate = false): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM orders WHERE id=? OR order_number=? LIMIT 1' . ($forUpdate ? ' FOR UPDATE' : ''));
        $stmt->execute([$id, $id]); $row = $stmt->fetch();
        return $row ? $this->orderFromRow($row) : null;
    }

    private function orderFromRow(array $row): array
    {
        $data = jsonFromDb($row['data'], []);
        $itemsStmt = $this->db->prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY id'); $itemsStmt->execute([$row['id']]);
        $items = array_map(fn($item) => deepMerge(jsonFromDb($item['data'], []), ['productId' => $item['product_id'], 'variantId' => $item['variant_id'], 'sku' => $item['sku'], 'name' => $item['product_name'], 'productName' => $item['product_name'], 'image' => $item['product_image'], 'productImage' => $item['product_image'], 'size' => $item['size'], 'color' => $item['color'], 'quantity' => (int) $item['quantity'], 'price' => (float) $item['unit_price'], 'mrp' => (float) $item['mrp'], 'subtotal' => (float) $item['subtotal']]), $itemsStmt->fetchAll());
        $historyStmt = $this->db->prepare('SELECT * FROM order_status_history WHERE order_id=? ORDER BY created_at'); $historyStmt->execute([$row['id']]);
        $history = array_map(fn($h) => ['status' => $h['status'], 'timestamp' => isoDate($h['created_at']), 'comment' => $h['comment'], 'updatedBy' => $h['updated_by']], $historyStmt->fetchAll());
        $returnStmt = $this->db->prepare('SELECT * FROM order_returns WHERE order_id=? LIMIT 1'); $returnStmt->execute([$row['id']]); $return = $returnStmt->fetch();
        $returnDetails = $return ? deepMerge(jsonFromDb($return['data'], []), ['reason' => $return['reason'], 'description' => $return['description'], 'status' => $return['status'], 'requestedAt' => isoDate($return['created_at']), 'resolutionType' => $return['resolution_type'], 'courierPartner' => $return['courier_partner'], 'trackingNumber' => $return['tracking_number'], 'refundAmount' => $return['refund_amount'] === null ? null : (float) $return['refund_amount'], 'adminNotes' => $return['admin_notes']]) : null;
        return deepMerge($data, ['id' => $row['id'], 'orderNumber' => $row['order_number'], 'invoiceNumber' => $row['invoice_number'], 'userId' => $row['user_id'] ?? '', 'customerName' => $row['customer_name'], 'customerEmail' => $row['customer_email'], 'userEmail' => $row['customer_email'], 'customerPhone' => $row['customer_phone'], 'items' => $items, 'shippingAddress' => jsonFromDb($row['shipping_address'], []), 'billingAddress' => jsonFromDb($row['billing_address'], []), 'paymentMethod' => $row['payment_method'], 'paymentStatus' => $row['payment_status'], 'razorpayPaymentId' => $row['razorpay_payment_id'], 'razorpayOrderId' => $row['razorpay_order_id'], 'subtotal' => (float) $row['subtotal'], 'discountAmount' => (float) $row['discount_amount'], 'couponCode' => $row['coupon_code'], 'shippingFee' => (float) $row['shipping_fee'], 'taxAmount' => (float) $row['tax_amount'], 'grandTotal' => (float) $row['grand_total'], 'totalAmount' => (float) $row['grand_total'], 'orderStatus' => $row['order_status'], 'statusHistory' => $history, 'trackingNumber' => $row['tracking_number'], 'courierPartner' => $row['courier_partner'], 'estimatedDeliveryDate' => $row['estimated_delivery_date'], 'cancellationReason' => $row['cancellation_reason'], 'returnDetails' => $returnDetails, 'createdAt' => isoDate($row['created_at']), 'updatedAt' => isoDate($row['updated_at'])]);
    }

    private function updateOrder(string $id): array
    {
        $order = $this->findOrder($id);
        if (!$order) throw new ApiException('Order not found.', 404);
        $status = (string) ($this->body['orderStatus'] ?? $this->body['status'] ?? $order['orderStatus']);
        $allowed = ['Pending','Payment Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Return Requested','Return Approved','Return Rejected','Returned','Refunded'];
        if (!in_array($status, $allowed, true)) throw new ApiException('Invalid order status.', 422);
        $stmt = $this->db->prepare('UPDATE orders SET order_status=?,tracking_number=?,courier_partner=?,estimated_delivery_date=? WHERE id=?');
        $stmt->execute([$status, $this->body['trackingNumber'] ?? $order['trackingNumber'], $this->body['courierPartner'] ?? $order['courierPartner'], $this->body['estimatedDeliveryDate'] ?? $order['estimatedDeliveryDate'], $order['id']]);
        if ($status !== $order['orderStatus']) $this->db->prepare('INSERT INTO order_status_history (id,order_id,status,comment,updated_by) VALUES (?,?,?,?,?)')->execute([apiId('hst'), $order['id'], $status, $this->body['comment'] ?? null, $this->admin['name'] ?? 'admin']);
        $updated = $this->findOrder($order['id']);
        $this->audit('order_status_update', 'Order', $order['id'], "Changed order status to {$status}", $order, $updated);
        return $this->result($updated);
    }

    private function cancelOrder(string $id): array
    {
        $this->authorizeOrderAccess($id);
        $this->db->beginTransaction();
        try {
            $order = $this->findOrder($id, true);
            if (!$order) throw new ApiException('Order not found.', 404);
            if (in_array($order['orderStatus'], ['Shipped','Out for Delivery','Delivered','Cancelled','Returned','Refunded'], true)) throw new ApiException('This order can no longer be cancelled.', 409);
            $this->restoreOrderStock($order['id']);
            $reason = trim((string) ($this->body['reason'] ?? 'Cancelled by customer'));
            $this->db->prepare("UPDATE orders SET order_status='Cancelled',cancellation_reason=? WHERE id=?")->execute([$reason, $order['id']]);
            $this->db->prepare('INSERT INTO order_status_history (id,order_id,status,comment,updated_by) VALUES (?,?,?,?,?)')->execute([apiId('hst'), $order['id'], 'Cancelled', $this->body['comment'] ?? $reason, $this->admin['name'] ?? 'customer']);
            $this->db->commit();
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
        return $this->result(['success' => true, 'order' => $this->findOrder($order['id']), 'message' => $order['paymentStatus'] === 'Paid' ? 'Order cancelled. A refund must be processed through the payment gateway.' : 'Order cancelled successfully.']);
    }

    private function restoreOrderStock(string $orderId): void
    {
        $stmt = $this->db->prepare('SELECT variant_id,quantity FROM order_items WHERE order_id=?'); $stmt->execute([$orderId]);
        $update = $this->db->prepare('UPDATE product_variants SET stock=stock+? WHERE id=?');
        foreach ($stmt->fetchAll() as $item) $update->execute([(int) $item['quantity'], $item['variant_id']]);
    }

    private function requestReturn(string $id): array
    {
        $this->authorizeOrderAccess($id);
        $order = $this->findOrder($id);
        if (!$order) throw new ApiException('Order not found.', 404);
        if ($order['orderStatus'] !== 'Delivered') throw new ApiException('Only delivered orders can be returned.', 409);
        $reason = trim((string) ($this->body['reason'] ?? ''));
        if ($reason === '') throw new ApiException('A return reason is required.', 422);
        $returnId = apiId('ret');
        try {
            $stmt = $this->db->prepare("INSERT INTO order_returns (id,order_id,status,reason,description,resolution_type,data) VALUES (?,?, 'Requested',?,?,?,?)");
            $stmt->execute([$returnId, $order['id'], $reason, $this->body['description'] ?? $this->body['customerComments'] ?? null, $this->body['resolutionType'] ?? 'refund', jsonForDb($this->body)]);
        } catch (PDOException $e) { if ((int) $e->getCode() === 23000) throw new ApiException('A return already exists for this order.', 409); throw $e; }
        $this->db->prepare("UPDATE orders SET order_status='Return Requested' WHERE id=?")->execute([$order['id']]);
        $this->db->prepare('INSERT INTO order_status_history (id,order_id,status,comment,updated_by) VALUES (?,?,?,?,?)')->execute([apiId('hst'), $order['id'], 'Return Requested', $reason, 'customer']);
        return $this->result(['success' => true, 'order' => $this->findOrder($order['id']), 'message' => 'Return request submitted.'], 201);
    }

    private function listReturns(): array
    {
        $rows = $this->db->query('SELECT o.* FROM orders o JOIN order_returns r ON r.order_id=o.id ORDER BY r.created_at DESC')->fetchAll();
        return $this->result(array_map(fn($row) => $this->orderFromRow($row), $rows));
    }

    private function updateReturnStatus(string $id): array
    {
        $order = $this->findOrder($id);
        if (!$order) throw new ApiException('Order not found.', 404);
        $status = trim((string) ($this->body['status'] ?? ''));
        $allowed = ['Requested','Approved','Rejected','Pickup Scheduled','Received','Refund Initiated','Refunded'];
        if (!in_array($status, $allowed, true)) throw new ApiException('Invalid return status.', 422);
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('SELECT * FROM order_returns WHERE order_id=? FOR UPDATE'); $stmt->execute([$order['id']]); $return = $stmt->fetch();
            if (!$return) throw new ApiException('Return request not found.', 404);
            if (in_array($status, ['Received','Refunded'], true) && $return['restocked_at'] === null) {
                $this->restoreOrderStock($order['id']);
                $restocked = gmdate('Y-m-d H:i:s');
            } else $restocked = $return['restocked_at'];
            $orderStatus = match ($status) { 'Approved','Pickup Scheduled' => 'Return Approved', 'Rejected' => 'Return Rejected', 'Received' => 'Returned', 'Refunded' => 'Refunded', default => 'Return Requested' };
            $this->db->prepare('UPDATE order_returns SET status=?,admin_notes=?,tracking_number=?,courier_partner=?,refund_amount=?,restocked_at=? WHERE order_id=?')->execute([$status, $this->body['notes'] ?? $return['admin_notes'], $this->body['trackingNumber'] ?? $return['tracking_number'], $this->body['courierPartner'] ?? $return['courier_partner'], $this->body['refundAmount'] ?? $return['refund_amount'], $restocked, $order['id']]);
            $this->db->prepare('UPDATE orders SET order_status=?,payment_status=IF(?=\'Refunded\',\'Refunded\',payment_status) WHERE id=?')->execute([$orderStatus, $status, $order['id']]);
            $this->db->prepare('INSERT INTO order_status_history (id,order_id,status,comment,updated_by) VALUES (?,?,?,?,?)')->execute([apiId('hst'), $order['id'], $orderStatus, $this->body['notes'] ?? null, $this->admin['name']]);
            $this->db->commit();
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
        $updated = $this->findOrder($order['id']);
        $this->audit('return_status_change', 'Return', $order['id'], "Changed return status to {$status}", $order, $updated);
        return $this->result(['success' => true, 'order' => $updated]);
    }

    private function razorpayCreateOrder(): array
    {
        $amount = (float) ($this->body['amount'] ?? 0);
        if ($amount <= 0 || $amount > 10000000) throw new ApiException('A valid payment amount in INR is required.', 422);
        $key = trim((string) envValue('RAZORPAY_KEY_ID', '')); $secret = trim((string) envValue('RAZORPAY_KEY_SECRET', ''));
        if ($key === '' || $secret === '') throw new ApiException('Razorpay is not configured. Please use COD or configure gateway credentials.', 503);
        $payload = ['amount' => (int) round($amount * 100), 'currency' => strtoupper((string) ($this->body['currency'] ?? 'INR')), 'receipt' => substr((string) ($this->body['receipt'] ?? apiId('rcpt')), 0, 40), 'notes' => is_array($this->body['notes'] ?? null) ? $this->body['notes'] : []];
        $response = $this->httpJson('https://api.razorpay.com/v1/orders', 'POST', $payload, $key . ':' . $secret);
        if (($response['status'] ?? 500) >= 300 || empty($response['body']['id'])) throw new ApiException('Unable to create the Razorpay order.', 502);
        $rzp = $response['body']; $id = apiId('pay');
        $this->db->prepare('INSERT INTO payment_transactions (id,provider,provider_order_id,amount_paise,currency,status,data) VALUES (?,\'razorpay\',?,?,?,?,?)')->execute([$id, $rzp['id'], (int) $rzp['amount'], $rzp['currency'] ?? 'INR', 'created', jsonForDb($rzp)]);
        return $this->result(['success' => true, 'orderId' => $rzp['id'], 'amount' => (int) $rzp['amount'], 'currency' => $rzp['currency'] ?? 'INR', 'keyId' => $key, 'mockMode' => false], 201);
    }

    private function razorpayVerify(): array
    {
        $orderId = trim((string) ($this->body['razorpay_order_id'] ?? '')); $paymentId = trim((string) ($this->body['razorpay_payment_id'] ?? '')); $signature = trim((string) ($this->body['razorpay_signature'] ?? ''));
        if ($orderId === '' || $paymentId === '' || $signature === '') throw new ApiException('Razorpay order, payment, and signature are required.', 422);
        $secret = trim((string) envValue('RAZORPAY_KEY_SECRET', ''));
        if ($secret === '') throw new ApiException('Razorpay is not configured.', 503);
        $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);
        if (!hash_equals($expected, $signature)) throw new ApiException('Razorpay payment signature mismatch.', 400);
        $stmt = $this->db->prepare("UPDATE payment_transactions SET provider_payment_id=?,status='verified',verified_at=UTC_TIMESTAMP() WHERE provider='razorpay' AND provider_order_id=?");
        $stmt->execute([$paymentId, $orderId]);
        if ($stmt->rowCount() !== 1) throw new ApiException('Payment order was not created by this server.', 404);
        return $this->result(['success' => true, 'verified' => true, 'paymentId' => $paymentId, 'orderId' => $orderId]);
    }

    private function razorpayWebhook(): array
    {
        $signature = trim((string) ($_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '')); $secret = trim((string) envValue('RAZORPAY_WEBHOOK_SECRET', ''));
        if ($signature === '' || $secret === '') throw new ApiException('Webhook signature or server secret is missing.', 401);
        $raw = $this->rawBody;
        if (!hash_equals(hash_hmac('sha256', $raw, $secret), $signature)) throw new ApiException('Invalid webhook signature.', 401);
        $event = (string) ($this->body['event'] ?? '');
        $payment = $this->body['payload']['payment']['entity'] ?? [];
        $order = $this->body['payload']['order']['entity'] ?? [];
        $providerOrderId = (string) ($payment['order_id'] ?? $order['id'] ?? '');
        if ($providerOrderId !== '' && in_array($event, ['payment.captured','order.paid'], true)) {
            $this->db->prepare("UPDATE payment_transactions SET provider_payment_id=COALESCE(NULLIF(?,''),provider_payment_id),status='verified',verified_at=UTC_TIMESTAMP(),data=? WHERE provider='razorpay' AND provider_order_id=?")->execute([(string) ($payment['id'] ?? ''), jsonForDb($this->body), $providerOrderId]);
        }
        return $this->result(['success' => true]);
    }

    private function httpJson(string $url, string $method = 'GET', ?array $payload = null, ?string $basicAuth = null, array $headers = []): array
    {
        $ch = curl_init($url); if ($ch === false) throw new ApiException('HTTP client initialization failed.', 500);
        $options = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => array_merge(['Accept: application/json', 'Content-Type: application/json'], $headers)];
        if ($payload !== null) $options[CURLOPT_POSTFIELDS] = jsonForDb($payload);
        if ($basicAuth !== null) $options[CURLOPT_USERPWD] = $basicAuth;
        curl_setopt_array($ch, $options); $raw = curl_exec($ch); $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE); $error = curl_error($ch); curl_close($ch);
        if ($raw === false) throw new ApiException('Upstream service is unavailable: ' . $error, 502);
        return ['status' => $status, 'body' => jsonFromDb($raw, [])];
    }

    private function listUsers(): array
    {
        $rows = $this->db->query('SELECT * FROM users ORDER BY created_at DESC LIMIT 1000')->fetchAll();
        return $this->result(array_map(fn($row) => $this->userFromRow($row), $rows));
    }

    private function saveUser(): array
    {
        $email = strtolower(trim((string) ($this->body['email'] ?? ''))); $name = trim((string) ($this->body['name'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '') throw new ApiException('A valid email and name are required.', 422);
        $id = trim((string) ($this->body['id'] ?? apiId('usr')));
        $this->db->prepare('INSERT INTO users (id,email,name,phone,avatar_url,role,auth_provider,provider_subject,data,last_login_at) VALUES (?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE name=VALUES(name),phone=VALUES(phone),avatar_url=VALUES(avatar_url),data=VALUES(data),last_login_at=UTC_TIMESTAMP()')->execute([$id, $email, $name, $this->body['phone'] ?? null, $this->body['avatarUrl'] ?? null, $this->body['role'] ?? 'customer', $this->body['authProvider'] ?? 'guest', $this->body['providerSubject'] ?? null, jsonForDb($this->body)]);
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id=? OR email=? LIMIT 1'); $stmt->execute([$id, $email]);
        return $this->result($this->userFromRow($stmt->fetch()), 201);
    }

    private function updateUser(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id=?'); $stmt->execute([$id]); $row = $stmt->fetch();
        if (!$row) throw new ApiException('Customer not found.', 404);
        $old = $this->userFromRow($row); $user = deepMerge($old, $this->body);
        $email = strtolower(trim((string) ($user['email'] ?? ''))); if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new ApiException('A valid email is required.', 422);
        $this->db->prepare('UPDATE users SET email=?,name=?,phone=?,avatar_url=?,role=?,is_active=?,data=? WHERE id=?')->execute([$email, (string) ($user['name'] ?? 'Customer'), $user['phone'] ?? null, $user['avatarUrl'] ?? null, $user['role'] ?? 'customer', ($user['isActive'] ?? true) ? 1 : 0, jsonForDb($user), $id]);
        $this->audit('customer_update', 'Customer', $id, 'Updated customer profile', $old, $user);
        $stmt->execute([$id]); return $this->result($this->userFromRow($stmt->fetch()));
    }

    private function userFromRow(array $row): array
    {
        $addresses = $this->addressesFor($row['id']);
        $orders = $this->db->prepare("SELECT COUNT(*) count,COALESCE(SUM(grand_total),0) spent FROM orders WHERE user_id=? AND order_status<>'Cancelled'"); $orders->execute([$row['id']]); $stats = $orders->fetch();
        return deepMerge(jsonFromDb($row['data'], []), ['id' => $row['id'], 'name' => $row['name'], 'email' => $row['email'], 'phone' => $row['phone'], 'avatarUrl' => $row['avatar_url'], 'role' => $row['role'], 'authProvider' => $row['auth_provider'], 'isActive' => (bool) $row['is_active'], 'totalOrders' => (int) $stats['count'], 'totalSpent' => (float) $stats['spent'], 'addresses' => $addresses, 'lastLoginAt' => $row['last_login_at'] ? isoDate($row['last_login_at']) : null, 'createdAt' => isoDate($row['created_at']), 'updatedAt' => isoDate($row['updated_at'])]);
    }

    private function ensureUser(string $id, string $email = '', string $name = 'Customer'): void
    {
        $stmt = $this->db->prepare('SELECT 1 FROM users WHERE id=?'); $stmt->execute([$id]); if ($stmt->fetchColumn()) return;
        $email = filter_var($email, FILTER_VALIDATE_EMAIL) ? strtolower($email) : strtolower($id) . '@guest.invalid';
        try { $this->db->prepare("INSERT INTO users (id,email,name,role,auth_provider,data) VALUES (?,?,?,'customer','guest',?)")->execute([$id, $email, $name ?: 'Customer', jsonForDb(['id' => $id, 'email' => $email, 'name' => $name ?: 'Customer', 'role' => 'customer', 'authProvider' => 'guest'])]); }
        catch (PDOException $e) { if ((int) $e->getCode() !== 23000) throw $e; }
    }

    private function listAddresses(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        return $this->result($this->addressesFor($userId));
    }

    private function updateMyProfile(): array
    {
        $customer = $this->requireCustomer();
        $name = trim((string) ($this->body['name'] ?? $customer['name']));
        if ($name === '') {
            throw new ApiException('Customer name cannot be empty.', 422);
        }

        $phone = array_key_exists('phone', $this->body)
            ? trim((string) $this->body['phone'])
            : $customer['phone'];
        $avatarUrl = array_key_exists('avatarUrl', $this->body)
            ? trim((string) $this->body['avatarUrl'])
            : $customer['avatar_url'];
        $stored = deepMerge(jsonFromDb($customer['data'], []), [
            'name' => $name,
            'phone' => $phone,
            'avatarUrl' => $avatarUrl,
        ]);

        $this->db->prepare('UPDATE users SET name=?,phone=?,avatar_url=?,data=? WHERE id=?')
            ->execute([$name, $phone ?: null, $avatarUrl ?: null, jsonForDb($stored), $customer['id']]);
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id=?');
        $stmt->execute([$customer['id']]);
        return $this->result($this->userFromRow($stmt->fetch()));
    }
    private function addressesFor(string $userId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM user_addresses WHERE user_id=? ORDER BY is_default DESC,created_at'); $stmt->execute([$userId]);
        return array_map(fn($row) => deepMerge(jsonFromDb($row['data'], []), ['id' => $row['id'], 'isDefault' => (bool) $row['is_default']]), $stmt->fetchAll());
    }
    private function createAddress(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $this->ensureUser($userId); $id = (string) ($this->body['id'] ?? apiId('addr')); $address = deepMerge($this->body, ['id' => $id]);
        $this->db->beginTransaction(); try { if (!empty($address['isDefault'])) $this->db->prepare('UPDATE user_addresses SET is_default=0 WHERE user_id=?')->execute([$userId]); $this->db->prepare('INSERT INTO user_addresses (id,user_id,is_default,data) VALUES (?,?,?,?)')->execute([$id, $userId, !empty($address['isDefault']) ? 1 : 0, jsonForDb($address)]); $this->db->commit(); } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
        return $this->result($address, 201);
    }
    private function updateAddress(string $userId, string $id): array
    {
        $this->authorizeCustomerResource($userId);
        $stmt = $this->db->prepare('SELECT * FROM user_addresses WHERE id=? AND user_id=?'); $stmt->execute([$id, $userId]); $row = $stmt->fetch(); if (!$row) throw new ApiException('Address not found.', 404);
        $address = deepMerge(jsonFromDb($row['data'], []), $this->body); $address['id'] = $id;
        $this->db->beginTransaction(); try { if (!empty($address['isDefault'])) $this->db->prepare('UPDATE user_addresses SET is_default=0 WHERE user_id=?')->execute([$userId]); $this->db->prepare('UPDATE user_addresses SET is_default=?,data=? WHERE id=? AND user_id=?')->execute([!empty($address['isDefault']) ? 1 : 0, jsonForDb($address), $id, $userId]); $this->db->commit(); } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
        return $this->result($address);
    }
    private function deleteAddress(string $userId, string $id): array
    {
        $this->authorizeCustomerResource($userId);
        $stmt = $this->db->prepare('DELETE FROM user_addresses WHERE id=? AND user_id=?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->rowCount()) {
            throw new ApiException('Address not found.', 404);
        }
        return $this->result(['success' => true]);
    }

    private function defaultAddress(string $userId, string $id): array
    {
        $this->authorizeCustomerResource($userId);
        $this->db->beginTransaction(); try { $check = $this->db->prepare('SELECT 1 FROM user_addresses WHERE id=? AND user_id=?'); $check->execute([$id, $userId]); if (!$check->fetchColumn()) throw new ApiException('Address not found.', 404); $this->db->prepare('UPDATE user_addresses SET is_default=0 WHERE user_id=?')->execute([$userId]); $this->db->prepare('UPDATE user_addresses SET is_default=1, data=JSON_SET(data,\'$.isDefault\',true) WHERE id=? AND user_id=?')->execute([$id, $userId]); $this->db->commit(); } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; } return $this->result(['success' => true]);
    }

    private function googleAuth(): array
    {
        $credential = trim((string) ($this->body['credential'] ?? $this->body['token'] ?? ''));
        if ($credential === '') {
            throw new ApiException('A Google ID token is required.', 422);
        }

        $profile = $this->verifyGoogleIdentityToken($credential);
        if (empty($profile['sub']) || empty($profile['email'])) {
            throw new ApiException('The verified Google profile is incomplete.', 401);
        }

        $candidateId = 'google-' . substr(hash('sha256', (string) $profile['sub']), 0, 32);
        $email = strtolower((string) $profile['email']);
        $user = [
            'id' => $candidateId,
            'name' => $profile['name'] ?? explode('@', $email)[0],
            'email' => $email,
            'avatarUrl' => $profile['picture'] ?? null,
            'role' => 'customer',
            'authProvider' => 'google',
            'providerSubject' => $profile['sub'],
        ];
        $this->db->prepare(
            "INSERT INTO users (id,email,name,avatar_url,role,auth_provider,provider_subject,data,last_login_at)
             VALUES (?,?,?,?,'customer','google',?,?,UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE name=VALUES(name),avatar_url=VALUES(avatar_url),
             auth_provider='google',provider_subject=VALUES(provider_subject),data=VALUES(data),
             last_login_at=UTC_TIMESTAMP()"
        )->execute([
            $candidateId,
            $email,
            $user['name'],
            $user['avatarUrl'],
            $profile['sub'],
            jsonForDb($user),
        ]);

        $findUser = $this->db->prepare('SELECT * FROM users WHERE email=? LIMIT 1');
        $findUser->execute([$email]);
        $row = $findUser->fetch();
        if (!$row) {
            throw new ApiException('The customer account could not be created.', 500);
        }
        $id = (string) $row['id'];
        $token = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $sessionId = uuidV4();
        $this->db->prepare('INSERT INTO user_sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 DAY))')->execute([$sessionId, $id, hash('sha256', $token)]);
        return $this->result(['success' => true, 'user' => $this->userFromRow($row), 'token' => $token]);
    }

    private function listReviews(): array
    {
        $admin = $this->optionalAdmin();
        $clauses = [];
        $params = [];

        if (!empty($this->query['productId'])) {
            $clauses[] = 'product_id=?';
            $params[] = $this->query['productId'];
        }
        if ($admin === null) {
            $clauses[] = "status='Approved'";
        }

        $sql = 'SELECT * FROM reviews';
        if ($clauses) {
            $sql .= ' WHERE ' . implode(' AND ', $clauses);
        }
        $sql .= ' ORDER BY created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $reviews = array_map(
            fn(array $row) => deepMerge(jsonFromDb($row['data'], []), [
                'id' => $row['id'],
                'productId' => $row['product_id'],
                'userId' => $row['user_id'],
                'rating' => (int) $row['rating'],
                'status' => $row['status'],
                'helpfulCount' => (int) $row['helpful_count'],
                'createdAt' => isoDate($row['created_at']),
            ]),
            $stmt->fetchAll(),
        );
        return $this->result($reviews);
    }
    private function createReview(): array
    {
        $productId = trim((string) ($this->body['productId'] ?? ''));
        $rating = filter_var($this->body['rating'] ?? null, FILTER_VALIDATE_INT);
        if ($productId === '' || $rating === false || $rating < 1 || $rating > 5) {
            throw new ApiException('A product and rating from 1 to 5 are required.', 422);
        }
        if (!$this->findProduct($productId)) {
            throw new ApiException('Product not found.', 404);
        }

        $id = apiId('rev');
        $userId = null;
        if ($this->bearerToken() !== null && $this->optionalAdmin() === null) {
            $customer = $this->requireCustomer();
            $userId = (string) $customer['id'];
        }
        $review = deepMerge($this->body, [
            'id' => $id,
            'userId' => $userId,
            'rating' => $rating,
            'status' => 'Pending',
            'helpfulCount' => 0,
            'createdAt' => isoDate(),
        ]);
        $this->db->prepare('INSERT INTO reviews (id,product_id,user_id,rating,status,helpful_count,data) VALUES (?,?,?,?,\'Pending\',0,?)')->execute([$id, $productId, $userId ?: null, $rating, jsonForDb($review)]);
        return $this->result($review, 201);
    }
    private function reviewHelpful(string $id): array
    {
        $key = hash('sha256', $this->clientIp() . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '')); try { $this->db->beginTransaction(); $this->db->prepare('INSERT INTO review_votes (review_id,voter_key) VALUES (?,?)')->execute([$id, $key]); $this->db->prepare('UPDATE reviews SET helpful_count=helpful_count+1 WHERE id=?')->execute([$id]); $this->db->commit(); } catch (PDOException $e) { if ($this->db->inTransaction()) $this->db->rollBack(); if ((int) $e->getCode() !== 23000) throw $e; }
        $stmt = $this->db->prepare('SELECT helpful_count FROM reviews WHERE id=?'); $stmt->execute([$id]); $count = $stmt->fetchColumn(); if ($count === false) throw new ApiException('Review not found.', 404); return $this->result(['success' => true, 'helpfulCount' => (int) $count]);
    }
    private function updateReviewStatus(string $id): array { $status = (string) ($this->body['status'] ?? ''); if (!in_array($status, ['Approved','Pending','Rejected','Hidden'], true)) throw new ApiException('Invalid review status.', 422); $this->db->prepare('UPDATE reviews SET status=?,data=JSON_SET(data,\'$.status\',?) WHERE id=?')->execute([$status, $status, $id]); $all = $this->db->prepare('SELECT * FROM reviews WHERE id=?'); $all->execute([$id]); $row = $all->fetch(); if (!$row) throw new ApiException('Review not found.', 404); $this->recalculateProductReviewStats($row['product_id']); return $this->result(deepMerge(jsonFromDb($row['data'], []), ['id' => $id, 'status' => $status, 'helpfulCount' => (int) $row['helpful_count']])); }
    private function deleteReview(string $id): array { $stmt = $this->db->prepare('SELECT product_id FROM reviews WHERE id=?'); $stmt->execute([$id]); $productId = $stmt->fetchColumn(); if (!$productId) throw new ApiException('Review not found.', 404); $this->db->prepare('DELETE FROM reviews WHERE id=?')->execute([$id]); $this->recalculateProductReviewStats((string) $productId); return $this->result(['success' => true]); }
    private function recalculateProductReviewStats(string $productId): void { $stmt = $this->db->prepare("SELECT COUNT(*) count,COALESCE(AVG(rating),0) rating FROM reviews WHERE product_id=? AND status='Approved'"); $stmt->execute([$productId]); $stats = $stmt->fetch(); $this->db->prepare('UPDATE products SET review_count=?,rating=? WHERE id=?')->execute([(int) $stats['count'], round((float) $stats['rating'], 2), $productId]); }

    private function inventoryLogs(): array
    {
        $rows = $this->db->query('SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 1000')->fetchAll();
        return $this->result(array_map(fn($r) => ['id' => $r['id'], 'productId' => $r['product_id'], 'variantId' => $r['variant_id'], 'previousStock' => (int) $r['previous_stock'], 'newStock' => (int) $r['new_stock'], 'quantityChange' => (int) $r['quantity_change'], 'reason' => $r['reason'], 'notes' => $r['notes'], 'adminId' => $r['actor_id'], 'adminName' => $r['actor_name'], 'adminEmail' => $r['actor_email'], 'createdAt' => isoDate($r['created_at'])], $rows));
    }
    private function updateVariantStock(): array
    {
        $this->requireFields(['productId','variantId','absoluteStock']); $stock = filter_var($this->body['absoluteStock'], FILTER_VALIDATE_INT); if ($stock === false || $stock < 0) throw new ApiException('absoluteStock must be a non-negative integer.', 422);
        $this->db->beginTransaction(); try { $stmt = $this->db->prepare('SELECT stock FROM product_variants WHERE id=? AND product_id=? FOR UPDATE'); $stmt->execute([$this->body['variantId'], $this->body['productId']]); $old = $stmt->fetchColumn(); if ($old === false) throw new ApiException('Product variant not found.', 404); $this->db->prepare('UPDATE product_variants SET stock=? WHERE id=?')->execute([$stock, $this->body['variantId']]); $admin = $this->admin; $this->db->prepare('INSERT INTO inventory_logs (id,product_id,variant_id,previous_stock,new_stock,quantity_change,reason,notes,actor_id,actor_name,actor_email) VALUES (?,?,?,?,?,?,?,?,?,?,?)')->execute([apiId('inv'), $this->body['productId'], $this->body['variantId'], (int) $old, $stock, $stock - (int) $old, $this->body['reason'] ?? 'Manual adjustment', $this->body['notes'] ?? null, $admin['id'], $admin['name'], $admin['email']]); $this->db->commit(); } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
        $this->audit('stock_adjust', 'Inventory', (string) $this->body['variantId'], 'Adjusted variant stock', ['stock' => (int) $old], ['stock' => $stock]); return $this->result(['success' => true, 'stock' => $stock]);
    }

    private function getWishlist(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $stmt = $this->db->prepare(
            'SELECT p.* FROM wishlist_items w JOIN products p ON p.id=w.product_id
             WHERE w.user_id=? ORDER BY w.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $this->result(array_map(
            fn(array $row) => $this->productFromRow($row),
            $stmt->fetchAll(),
        ));
    }

    private function syncWishlist(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $ids = array_values(array_unique(array_map(
            'strval',
            array_merge($this->body['productIds'] ?? [], $this->body['mergeGuestIds'] ?? []),
        )));

        $this->db->beginTransaction();
        try {
            $this->db->prepare('DELETE FROM wishlist_items WHERE user_id=?')->execute([$userId]);
            $insert = $this->db->prepare(
                'INSERT IGNORE INTO wishlist_items (user_id,product_id) SELECT ?,id FROM products WHERE id=?'
            );
            foreach (array_slice($ids, 0, 200) as $id) {
                $insert->execute([$userId, $id]);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
        return $this->result(['success' => true, 'wishlist' => $this->getWishlist($userId)[0]]);
    }

    private function getCart(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $stmt = $this->db->prepare('SELECT items FROM carts WHERE user_id=?');
        $stmt->execute([$userId]);
        $items = $stmt->fetchColumn();
        return $this->result($items === false ? [] : jsonFromDb($items, []));
    }

    private function syncCart(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $items = array_merge(
            is_array($this->body['mergeGuestItems'] ?? null) ? $this->body['mergeGuestItems'] : [],
            is_array($this->body['items'] ?? null) ? $this->body['items'] : [],
        );
        $merged = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $key = implode('|', [
                (string) ($item['productId'] ?? ''),
                (string) ($item['variantId'] ?? ''),
                (string) ($item['size'] ?? ''),
                (string) ($item['color'] ?? ''),
            ]);
            if (isset($merged[$key])) {
                $merged[$key]['quantity'] = min(
                    99,
                    (int) $merged[$key]['quantity'] + max(1, (int) ($item['quantity'] ?? 1)),
                );
            } else {
                $merged[$key] = $item;
            }
        }

        $validated = $this->resolveCartItems(array_values($merged), false)['items'];
        $this->db->prepare(
            'INSERT INTO carts (user_id,items) VALUES (?,?) ON DUPLICATE KEY UPDATE items=VALUES(items)'
        )->execute([$userId, jsonForDb($validated)]);
        return $this->result(['success' => true, 'items' => $validated]);
    }

    private function getRecentlyViewed(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $stmt = $this->db->prepare(
            'SELECT p.* FROM recently_viewed r JOIN products p ON p.id=r.product_id
             WHERE r.user_id=? ORDER BY r.viewed_at DESC LIMIT 24'
        );
        $stmt->execute([$userId]);
        return $this->result(array_map(
            fn(array $row) => $this->productFromRow($row),
            $stmt->fetchAll(),
        ));
    }

    private function recordRecentlyViewed(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $ids = array_values(array_unique(array_filter(array_merge(
            [(string) ($this->body['productId'] ?? '')],
            array_map('strval', $this->body['mergeIds'] ?? []),
        ))));
        $stmt = $this->db->prepare(
            'INSERT INTO recently_viewed (user_id,product_id) SELECT ?,id FROM products WHERE id=?
             ON DUPLICATE KEY UPDATE viewed_at=CURRENT_TIMESTAMP'
        );
        foreach (array_slice($ids, 0, 24) as $id) {
            $stmt->execute([$userId, $id]);
        }
        return $this->result(['success' => true]);
    }

    private function uploadMedia(): array
    {
        $dataUri = (string) ($this->body['fileData'] ?? ''); if (!preg_match('#^data:(image/(?:jpeg|png|webp|gif));base64,(.+)$#s', $dataUri, $m)) throw new ApiException('Only JPEG, PNG, WebP, or GIF data images are allowed.', 422);
        $binary = base64_decode($m[2], true); if ($binary === false || strlen($binary) === 0 || strlen($binary) > 8 * 1024 * 1024) throw new ApiException('Image must be valid and no larger than 8 MB.', 422);
        $finfo = new finfo(FILEINFO_MIME_TYPE); $mime = $finfo->buffer($binary); $extensions = ['image/jpeg' => 'jpg','image/png' => 'png','image/webp' => 'webp','image/gif' => 'gif']; if (!isset($extensions[$mime])) throw new ApiException('The decoded file is not a supported image.', 422);
        $id = apiId('asset'); $file = $id . '.' . $extensions[$mime]; $dir = dirname(__DIR__) . '/uploads'; if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) throw new ApiException('Media directory is unavailable.', 500); $path = $dir . '/' . $file; if (file_put_contents($path, $binary, LOCK_EX) !== strlen($binary)) throw new ApiException('Unable to save the media file.', 500);
        $url = rtrim((string) envValue('APP_URL', 'https://api.skleup.com/api/ecommerce'), '/') . '/uploads/' . $file; $name = basename((string) ($this->body['fileName'] ?? $file)); $alt = trim((string) ($this->body['altText'] ?? 'Product image'));
        $this->db->prepare('INSERT INTO media_assets (id,file_name,mime_type,file_size,storage_path,public_url,alt_text,uploaded_by) VALUES (?,?,?,?,?,?,?,?)')->execute([$id, $name, $mime, strlen($binary), $path, $url, $alt, $this->admin['id']]); return $this->result(['id' => $id, 'url' => $url, 'fileName' => $name, 'altText' => $alt], 201);
    }
}
