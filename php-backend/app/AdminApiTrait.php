<?php

declare(strict_types=1);

trait AdminApiTrait
{
    private function adminLogin(): array
    {
        $this->enforceRateLimit('admin-login', 15, 60);
        $email = strtolower(trim((string) ($this->body['email'] ?? '')));
        $password = (string) ($this->body['password'] ?? '');
        $googleToken = trim((string) ($this->body['googleToken'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('A valid administrator email is required.', 422);
        }

        $stmt = $this->db->prepare('SELECT * FROM admin_users WHERE email=? AND is_active=1 LIMIT 1');
        $stmt->execute([$email]);
        $admin = $stmt->fetch();
        $authenticated = $admin && $password !== '' && password_verify($password, $admin['password_hash']);

        if (!$authenticated && $admin && $googleToken !== '') {
            $profile = $this->verifyGoogleIdentityToken($googleToken);
            $authenticated = strtolower((string) ($profile['email'] ?? '')) === $email;
        }

        if (!$authenticated || !$admin) {
            throw new ApiException('Invalid administrator email or password.', 401);
        }
        if ($password !== '' && password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
            $this->db->prepare('UPDATE admin_users SET password_hash=? WHERE id=?')
                ->execute([password_hash($password, PASSWORD_DEFAULT), $admin['id']]);
        }

        $token = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $sessionId = uuidV4();
        $expiresAt = gmdate('Y-m-d H:i:s', time() + 12 * 3600);
        $this->db->prepare(
            'INSERT INTO admin_sessions (id,admin_id,token_hash,ip_address,user_agent,expires_at) VALUES (?,?,?,?,?,?)'
        )->execute([
            $sessionId,
            $admin['id'],
            hash('sha256', $token),
            $this->clientIp(),
            substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
            $expiresAt,
        ]);
        $this->db->prepare('UPDATE admin_users SET last_login_at=UTC_TIMESTAMP() WHERE id=?')->execute([$admin['id']]);
        $this->admin = $admin;
        $this->audit('admin_login', 'AdminUser', $admin['id'], 'Administrator signed in');

        return $this->result([
            'success' => true,
            'token' => $token,
            'expiresAt' => isoDate($expiresAt),
            'user' => $this->adminPublic($admin),
        ]);
    }

    private function adminMe(): array
    {
        $admin = $this->requireAdmin();
        return $this->result(['authenticated' => true, 'user' => $this->adminPublic($admin)]);
    }

    private function updateAdminMe(): array
    {
        $admin = $this->requireAdmin();
        $name = trim((string) ($this->body['name'] ?? $admin['name']));
        $avatarUrl = array_key_exists('avatarUrl', $this->body)
            ? trim((string) $this->body['avatarUrl'])
            : ($admin['avatar_url'] ?? null);

        if ($name === '') {
            throw new ApiException('Administrator name is required.', 422);
        }
        if ($avatarUrl === '') {
            $avatarUrl = null;
        }

        $this->db->prepare('UPDATE admin_users SET name=?,avatar_url=?,updated_at=UTC_TIMESTAMP() WHERE id=?')
            ->execute([$name, $avatarUrl, $admin['id']]);
        $this->audit('admin_profile_updated', 'AdminUser', $admin['id'], 'Administrator profile updated');

        $stmt = $this->db->prepare('SELECT * FROM admin_users WHERE id=? LIMIT 1');
        $stmt->execute([$admin['id']]);
        return $this->result($this->adminPublic($stmt->fetch()));
    }

    private function adminLogout(): array
    {
        $token = $this->bearerToken();
        if ($token) {
            $this->db->prepare('UPDATE admin_sessions SET revoked_at=UTC_TIMESTAMP() WHERE token_hash=?')
                ->execute([hash('sha256', $token)]);
        }
        return $this->result(['success' => true]);
    }

    private function adminUsers(): array
    {
        $rows = $this->db->query('SELECT * FROM admin_users ORDER BY created_at')->fetchAll();
        return $this->result(array_map(fn(array $row) => $this->adminPublic($row), $rows));
    }

    private function adminPublic(array $admin): array
    {
        return [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
            'permissions' => is_array($admin['permissions']) ? $admin['permissions'] : jsonFromDb($admin['permissions'], []),
            'avatarUrl' => $admin['avatar_url'] ?? null,
            'lastLoginAt' => !empty($admin['last_login_at']) ? isoDate($admin['last_login_at']) : null,
            'createdAt' => isoDate($admin['created_at']),
            'isActive' => (bool) $admin['is_active'],
        ];
    }

    private function enforceRateLimit(string $scope, int $maxHits, int $windowSeconds): void
    {
        $key = hash('sha256', $scope . '|' . $this->clientIp());
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('SELECT * FROM api_rate_limits WHERE rate_key=? FOR UPDATE');
            $stmt->execute([$key]);
            $row = $stmt->fetch();
            $now = time();
            if (!$row || strtotime($row['expires_at']) <= $now) {
                $expires = gmdate('Y-m-d H:i:s', $now + $windowSeconds);
                $this->db->prepare(
                    'INSERT INTO api_rate_limits (rate_key,hits,window_started_at,expires_at) VALUES (?,1,UTC_TIMESTAMP(),?)
                     ON DUPLICATE KEY UPDATE hits=1,window_started_at=UTC_TIMESTAMP(),expires_at=VALUES(expires_at)'
                )->execute([$key, $expires]);
            } else {
                if ((int) $row['hits'] >= $maxHits) {
                    $this->db->rollBack();
                    throw new ApiException('Too many attempts. Please wait before trying again.', 429);
                }
                $this->db->prepare('UPDATE api_rate_limits SET hits=hits+1 WHERE rate_key=?')->execute([$key]);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    private function adminDashboard(): array
    {
        $revenue = $this->db->query(
            "SELECT COUNT(*) total_orders,
                    COALESCE(SUM(CASE WHEN order_status<>'Cancelled' THEN grand_total ELSE 0 END),0) revenue,
                    COALESCE(SUM(CASE WHEN order_status<>'Cancelled' THEN discount_amount ELSE 0 END),0) discounts,
                    COALESCE(SUM(CASE WHEN order_status<>'Cancelled' THEN shipping_fee ELSE 0 END),0) shipping
             FROM orders"
        )->fetch();
        $statuses = $this->db->query('SELECT order_status,COUNT(*) count FROM orders GROUP BY order_status')->fetchAll();
        $statusMap = [];
        foreach ($statuses as $row) {
            $statusMap[$row['order_status']] = (int) $row['count'];
        }
        $customers = $this->db->query(
            "SELECT COUNT(*) total,
                    SUM(created_at>=DATE_FORMAT(UTC_TIMESTAMP(),'%Y-%m-01')) new_month
             FROM users WHERE role='customer'"
        )->fetch();
        $repeat = (int) $this->db->query(
            "SELECT COUNT(*) FROM (SELECT user_id FROM orders WHERE user_id IS NOT NULL AND order_status<>'Cancelled' GROUP BY user_id HAVING COUNT(*)>1) x"
        )->fetchColumn();
        $inventory = $this->db->query(
            'SELECT COUNT(DISTINCT p.id) products,COUNT(v.id) variants,COALESCE(SUM(v.stock),0) units,
                    SUM(v.stock BETWEEN 1 AND 5) low_stock,SUM(v.stock=0) out_of_stock
             FROM products p LEFT JOIN product_variants v ON v.product_id=p.id WHERE p.is_active=1'
        )->fetch();
        $lowStockRows = $this->db->query(
            'SELECT p.id product_id,p.name,p.sku product_sku,p.category,v.sku,v.size,v.color,v.stock,
                    (SELECT url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,display_order LIMIT 1) image
             FROM products p JOIN product_variants v ON v.product_id=p.id
             WHERE p.is_active=1 AND v.stock<=5 ORDER BY v.stock,p.name LIMIT 25'
        )->fetchAll();
        $lowStock = array_map(fn(array $row) => [
            'productId' => $row['product_id'],
            'productName' => $row['name'],
            'sku' => $row['sku'] ?: $row['product_sku'],
            'image' => $row['image'] ?? '',
            'category' => $row['category'],
            'variantSize' => $row['size'],
            'variantColor' => $row['color'],
            'stock' => (int) $row['stock'],
        ], $lowStockRows);
        $bestRows = $this->db->query(
            "SELECT p.id,p.name,p.sku,p.category,p.selling_price,
                    (SELECT url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,display_order LIMIT 1) image,
                    COALESCE(SUM(CASE WHEN o.order_status<>'Cancelled' THEN oi.quantity ELSE 0 END),0) units,
                    COALESCE(SUM(CASE WHEN o.order_status<>'Cancelled' THEN oi.subtotal ELSE 0 END),0) revenue
             FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id LEFT JOIN orders o ON o.id=oi.order_id
             GROUP BY p.id ORDER BY units DESC,p.is_bestseller DESC LIMIT 10"
        )->fetchAll();
        $bestSellers = array_map(fn(array $row) => [
            'productId' => $row['id'], 'productName' => $row['name'], 'sku' => $row['sku'],
            'image' => $row['image'] ?? '', 'category' => $row['category'],
            'unitsSold' => (int) $row['units'], 'totalRevenue' => (float) $row['revenue'],
            'sellingPrice' => (float) $row['selling_price'],
        ], $bestRows);
        $timelineRows = $this->db->query(
            "SELECT DATE(created_at) date,COUNT(*) order_count,COALESCE(SUM(CASE WHEN order_status<>'Cancelled' THEN grand_total ELSE 0 END),0) revenue
             FROM orders WHERE created_at>=DATE_SUB(UTC_DATE(),INTERVAL 29 DAY) GROUP BY DATE(created_at) ORDER BY date"
        )->fetchAll();
        $timeline = array_map(fn(array $row) => [
            'date' => $row['date'], 'label' => date('d M', strtotime($row['date'])),
            'revenue' => (float) $row['revenue'], 'orderCount' => (int) $row['order_count'],
        ], $timelineRows);
        $categoryRows = $this->db->query(
            "SELECT p.category,SUM(oi.quantity) units,SUM(oi.subtotal) revenue
             FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN products p ON p.id=oi.product_id
             WHERE o.order_status<>'Cancelled' GROUP BY p.category ORDER BY revenue DESC"
        )->fetchAll();
        $categoryTotal = array_sum(array_map(fn(array $row) => (float) $row['revenue'], $categoryRows));
        $categorySales = array_map(fn(array $row) => [
            'category' => $row['category'], 'unitsSold' => (int) $row['units'],
            'revenue' => (float) $row['revenue'],
            'percentage' => $categoryTotal > 0 ? round((float) $row['revenue'] / $categoryTotal * 100, 2) : 0,
        ], $categoryRows);
        $totalOrders = (int) $revenue['total_orders'];
        $totalCustomers = (int) $customers['total'];
        return $this->result([
            'revenue' => [
                'totalRevenue' => (float) $revenue['revenue'],
                'totalDiscountGiven' => (float) $revenue['discounts'],
                'shippingCollected' => (float) $revenue['shipping'],
                'averageOrderValue' => $totalOrders ? round((float) $revenue['revenue'] / $totalOrders, 2) : 0,
                'periodGrowthPercent' => 0,
            ],
            'orders' => [
                'totalCount' => $totalOrders,
                'pendingCount' => ($statusMap['Pending'] ?? 0) + ($statusMap['Payment Pending'] ?? 0),
                'packedCount' => $statusMap['Packed'] ?? 0,
                'shippedCount' => $statusMap['Shipped'] ?? 0,
                'deliveredCount' => $statusMap['Delivered'] ?? 0,
                'returnRequestedCount' => $statusMap['Return Requested'] ?? 0,
                'cancelledCount' => $statusMap['Cancelled'] ?? 0,
            ],
            'customers' => [
                'totalCount' => $totalCustomers,
                'newThisMonth' => (int) ($customers['new_month'] ?? 0),
                'repeatCustomerRate' => $totalCustomers ? round($repeat / $totalCustomers * 100, 2) : 0,
            ],
            'inventory' => [
                'totalProducts' => (int) $inventory['products'],
                'totalVariants' => (int) $inventory['variants'],
                'totalStockUnits' => (int) $inventory['units'],
                'lowStockCount' => (int) $inventory['low_stock'],
                'outOfStockCount' => (int) $inventory['out_of_stock'],
                'lowStockList' => $lowStock,
            ],
            'bestSellers' => $bestSellers,
            'revenueTimeline' => $timeline,
            'categorySalesDistribution' => $categorySales,
        ]);
    }

    private function auditLogs(): array
    {
        $rows = $this->db->query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 2000')->fetchAll();
        return $this->result(array_map(function (array $row): array {
            return deepMerge(jsonFromDb($row['data'], []), [
                'id' => $row['id'], 'adminId' => $row['admin_id'] ?? 'system',
                'action' => $row['action'], 'entityType' => $row['entity_type'],
                'entityId' => $row['entity_id'], 'details' => $row['details'],
                'ipAddress' => $row['ip_address'], 'createdAt' => isoDate($row['created_at']),
            ]);
        }, $rows));
    }

    private function createAuditLog(): array
    {
        $this->requireFields(['action', 'entityType', 'entityId', 'details']);
        $this->audit(
            (string) $this->body['action'],
            (string) $this->body['entityType'],
            (string) $this->body['entityId'],
            (string) $this->body['details'],
            $this->body['previousValue'] ?? null,
            $this->body['newValue'] ?? null,
        );
        $stmt = $this->db->query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1');
        $row = $stmt->fetch();
        return $this->result(deepMerge(jsonFromDb($row['data'], []), ['id' => $row['id'], 'createdAt' => isoDate($row['created_at'])]), 201);
    }

    private function salesReport(): array
    {
        [$start, $end] = $this->reportDateRange();
        $where = 'o.created_at>=? AND o.created_at<?';
        $params = [$start, $end];
        if (!empty($this->body['paymentMethod'])) {
            $where .= ' AND o.payment_method=?';
            $params[] = (string) $this->body['paymentMethod'];
        }
        if (!empty($this->body['orderStatus'])) {
            $where .= ' AND o.order_status=?';
            $params[] = (string) $this->body['orderStatus'];
        }
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) total_orders,
                    SUM(o.order_status='Delivered') completed,
                    SUM(o.order_status='Cancelled') cancelled,
                    SUM(o.order_status IN ('Return Requested','Return Approved','Return Rejected','Returned','Refunded')) returned,
                    COALESCE(SUM(o.grand_total),0) gross,
                    COALESCE(SUM(o.discount_amount),0) discounts,
                    COALESCE(SUM(o.shipping_fee),0) shipping,
                    COALESCE(SUM(o.tax_amount),0) tax,
                    COALESCE(SUM(CASE WHEN o.payment_status='Refunded' THEN o.grand_total ELSE 0 END),0) refunds
             FROM orders o WHERE {$where}"
        );
        $stmt->execute($params);
        $summary = $stmt->fetch();
        $gross = (float) $summary['gross'];
        $discounts = (float) $summary['discounts'];
        $refunds = (float) $summary['refunds'];
        $totalOrders = (int) $summary['total_orders'];

        $trendStmt = $this->db->prepare(
            "SELECT DATE(o.created_at) date,COUNT(*) orders,COALESCE(SUM(o.grand_total),0) revenue
             FROM orders o WHERE {$where}
             GROUP BY DATE(o.created_at) ORDER BY date"
        );
        $trendStmt->execute($params);
        $unitTrendStmt = $this->db->prepare(
            "SELECT DATE(o.created_at) date,COALESCE(SUM(oi.quantity),0) units
             FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE {$where}
             GROUP BY DATE(o.created_at)"
        );
        $unitTrendStmt->execute($params);
        $unitsByDate = [];
        foreach ($unitTrendStmt->fetchAll() as $row) {
            $unitsByDate[$row['date']] = (int) $row['units'];
        }
        $dailyTrend = array_map(
            fn(array $row) => [
                'date' => $row['date'],
                'revenue' => (float) $row['revenue'],
                'orders' => (int) $row['orders'],
                'units' => $unitsByDate[$row['date']] ?? 0,
            ],
            $trendStmt->fetchAll(),
        );

        $productStmt = $this->db->prepare(
            "SELECT p.id,p.name,p.sku,p.category,p.cost_price,p.selling_price,
                    (SELECT url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC,display_order LIMIT 1) image,
                    COALESCE(s.units,0) units,COALESCE(s.revenue,0) revenue,
                    COALESCE(i.current_stock,0) current_stock
             FROM products p
             LEFT JOIN (
                 SELECT oi.product_id,SUM(oi.quantity) units,SUM(oi.subtotal) revenue
                 FROM order_items oi JOIN orders o ON o.id=oi.order_id
                 WHERE {$where} GROUP BY oi.product_id
             ) s ON s.product_id=p.id
             LEFT JOIN (
                 SELECT product_id,SUM(stock) current_stock FROM product_variants GROUP BY product_id
             ) i ON i.product_id=p.id
             ORDER BY revenue DESC LIMIT 100"
        );
        $productStmt->execute($params);
        $productPerformance = array_map(fn(array $row) => [
            'productId' => $row['id'], 'productName' => $row['name'], 'sku' => $row['sku'],
            'category' => $row['category'], 'image' => $row['image'] ?? '', 'unitsSold' => (int) $row['units'],
            'grossRevenue' => (float) $row['revenue'], 'currentStock' => (int) $row['current_stock'],
            'returnRatePercent' => 0,
        ], $productStmt->fetchAll());
        $inventory = $this->db->query(
            'SELECT COUNT(*) skus,COALESCE(SUM(v.stock),0) units,
                    COALESCE(SUM(v.stock*COALESCE(p.cost_price,0)),0) cost_value,
                    COALESCE(SUM(v.stock*COALESCE(v.price,p.selling_price)),0) retail_value,
                    SUM(v.stock BETWEEN 1 AND 5) low_stock,SUM(v.stock=0) out_of_stock
             FROM product_variants v JOIN products p ON p.id=v.product_id'
        )->fetch();

        return $this->result([
            'summary' => [
                'grossRevenue' => $gross,
                'netSales' => $gross - $discounts - $refunds,
                'totalOrders' => $totalOrders,
                'completedOrders' => (int) $summary['completed'],
                'cancelledOrders' => (int) $summary['cancelled'],
                'returnedOrders' => (int) $summary['returned'],
                'averageOrderValue' => $totalOrders ? round($gross / $totalOrders, 2) : 0,
                'totalDiscounts' => $discounts,
                'shippingCollected' => (float) $summary['shipping'],
                'taxCollected' => (float) $summary['tax'],
                'refundsIssued' => $refunds,
            ],
            'productPerformance' => $productPerformance,
            'categoryPerformance' => [],
            'couponUsage' => [],
            'customerAcquisition' => ['newCustomers' => 0, 'returningCustomers' => 0, 'repeatPurchaseRate' => 0, 'averageCustomerLifetimeValue' => 0],
            'inventoryValuation' => [
                'totalSkus' => (int) $inventory['skus'], 'totalUnitsInStock' => (int) $inventory['units'],
                'totalCostValue' => (float) $inventory['cost_value'], 'totalRetailValue' => (float) $inventory['retail_value'],
                'lowStockSkusCount' => (int) $inventory['low_stock'], 'outOfStockSkusCount' => (int) $inventory['out_of_stock'],
            ],
            'dailyTrend' => $dailyTrend,
            'salesOverTime' => $dailyTrend,
        ]);
    }

    private function reportDateRange(): array
    {
        $range = (string) ($this->body['dateRange'] ?? '30d');
        $end = new DateTimeImmutable('tomorrow', new DateTimeZone('UTC'));
        $start = match ($range) {
            'today' => new DateTimeImmutable('today', new DateTimeZone('UTC')),
            '7days', '7d' => $end->modify('-7 days'),
            'this_month', 'month' => new DateTimeImmutable('first day of this month', new DateTimeZone('UTC')),
            '90days', 'last_quarter' => $end->modify('-90 days'),
            'year' => new DateTimeImmutable('first day of January', new DateTimeZone('UTC')),
            'custom' => new DateTimeImmutable((string) ($this->body['startDate'] ?? '30 days ago'), new DateTimeZone('UTC')),
            default => $end->modify('-30 days'),
        };
        if ($range === 'custom' && !empty($this->body['endDate'])) {
            $end = (new DateTimeImmutable((string) $this->body['endDate'], new DateTimeZone('UTC')))->modify('+1 day');
        }
        return [$start->format('Y-m-d H:i:s'), $end->format('Y-m-d H:i:s')];
    }
}
