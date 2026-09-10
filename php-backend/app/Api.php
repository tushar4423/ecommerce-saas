<?php

declare(strict_types=1);

require_once __DIR__ . '/CatalogApiTrait.php';
require_once __DIR__ . '/CommerceApiTrait.php';
require_once __DIR__ . '/SizingApiTrait.php';
require_once __DIR__ . '/AdminApiTrait.php';
require_once __DIR__ . '/GiniApiTrait.php';

final class Api
{
    use CatalogApiTrait;
    use CommerceApiTrait;
    use SizingApiTrait;
    use AdminApiTrait;
    use GiniApiTrait;

    private ?array $admin = null;
    private ?array $customer = null;

    public function __construct(
        private readonly PDO $db,
        private readonly string $method,
        private readonly string $path,
        private readonly array $body,
        private readonly array $query,
        private readonly string $rawBody = '',
    ) {
    }

    public function dispatch(): array
    {
        $routes = [
            ['GET', '#^/$#', 'health', false],
            ['GET', '#^/(?:health|_health)$#', 'health', false],

            ['POST', '#^/admin/auth/login$#', 'adminLogin', false],
            ['GET', '#^/admin/auth/me$#', 'adminMe', true],
            ['PUT', '#^/admin/auth/me$#', 'updateAdminMe', true],
            ['POST', '#^/admin/auth/logout$#', 'adminLogout', true],
            ['GET', '#^/admin/users$#', 'adminUsers', true],
            ['GET', '#^/admin/analytics/dashboard$#', 'adminDashboard', true],
            ['GET', '#^/admin/audit-logs$#', 'auditLogs', true],
            ['POST', '#^/admin/audit-logs$#', 'createAuditLog', true],
            ['POST', '#^/admin/reports/sales$#', 'salesReport', true],

            ['GET', '#^/products/([^/]+)/related$#', 'relatedProducts', false],
            ['GET', '#^/products$#', 'listProducts', false],
            ['POST', '#^/products$#', 'createProduct', true],
            ['GET', '#^/products/([^/]+)$#', 'getProduct', false],
            ['PUT', '#^/products/([^/]+)$#', 'updateProduct', true],
            ['DELETE', '#^/products/([^/]+)$#', 'deleteProduct', true],

            ['GET', '#^/categories$#', 'listCategories', false],
            ['POST', '#^/categories/reorder$#', 'reorderCategories', true],
            ['POST', '#^/categories$#', 'createCategory', true],
            ['PUT', '#^/categories/([^/]+)$#', 'updateCategory', true],
            ['DELETE', '#^/categories/([^/]+)$#', 'deleteCategory', true],
            ['GET', '#^/collections$#', 'listCollections', false],
            ['POST', '#^/collections$#', 'createCollection', true],
            ['PUT', '#^/collections/([^/]+)$#', 'updateCollection', true],
            ['DELETE', '#^/collections/([^/]+)$#', 'deleteCollection', true],
            ['GET', '#^/attributes$#', 'listAttributes', false],
            ['POST', '#^/attributes$#', 'createAttribute', true],
            ['PUT', '#^/attributes/([^/]+)$#', 'updateAttribute', true],
            ['DELETE', '#^/attributes/([^/]+)$#', 'deleteAttribute', true],
            ['GET', '#^/search$#', 'searchCatalog', false],

            ['GET', '#^/banners$#', 'listBanners', false],
            ['POST', '#^/banners$#', 'saveBanner', true],
            ['PUT', '#^/banners/([^/]+)$#', 'updateBanner', true],
            ['DELETE', '#^/banners/([^/]+)$#', 'deleteBanner', true],
            ['GET', '#^/coupons$#', 'listCoupons', true],
            ['POST', '#^/coupons/validate$#', 'validateCouponEndpoint', false],
            ['GET', '#^/coupons/validate$#', 'validateCouponEndpoint', false],
            ['POST', '#^/coupons$#', 'saveCoupon', true],
            ['PUT', '#^/coupons/([^/]+)$#', 'updateCoupon', true],
            ['DELETE', '#^/coupons/([^/]+)$#', 'deleteCoupon', true],

            ['GET', '#^/settings$#', 'getStoreSettings', false],
            ['POST', '#^/settings$#', 'updateStoreSettings', true],
            ['PUT', '#^/settings$#', 'updateStoreSettings', true],
            ['GET', '#^/settings/payment$#', 'getPaymentSettings', false],
            ['PUT', '#^/settings/payment$#', 'updatePaymentSettings', true],
            ['GET', '#^/settings/shipping$#', 'getShippingSettings', false],
            ['PUT', '#^/settings/shipping$#', 'updateShippingSettings', true],
            ['GET', '#^/navigation-menu$#', 'getNavigationMenu', false],
            ['POST', '#^/navigation-menu$#', 'saveNavigationMenu', true],
            ['GET', '#^/announcements$#', 'getAnnouncements', false],
            ['POST', '#^/announcements$#', 'saveAnnouncements', true],
            ['GET', '#^/homepage-sections$#', 'getHomepageSections', false],
            ['POST', '#^/homepage-sections$#', 'saveHomepageSections', true],

            ['POST', '#^/checkout/summary$#', 'checkoutSummary', false],
            ['POST', '#^/cart/validate$#', 'cartValidate', false],
            ['POST', '#^/payment/razorpay/create-order$#', 'razorpayCreateOrder', false],
            ['POST', '#^/payment/razorpay/verify$#', 'razorpayVerify', false],
            ['POST', '#^/payment/razorpay/webhook$#', 'razorpayWebhook', false],
            ['GET', '#^/orders/track/([^/]+)$#', 'trackOrder', false],
            ['GET', '#^/orders$#', 'listOrders', false],
            ['POST', '#^/orders$#', 'createOrder', false],
            ['GET', '#^/orders/([^/]+)$#', 'getOrder', false],
            ['PUT', '#^/orders/([^/]+)$#', 'updateOrder', true],
            ['PUT', '#^/orders/([^/]+)/status$#', 'updateOrder', true],
            ['POST', '#^/orders/([^/]+)/cancel$#', 'cancelOrder', false],
            ['POST', '#^/orders/([^/]+)/return$#', 'requestReturn', false],
            ['PUT', '#^/orders/([^/]+)/return-status$#', 'updateReturnStatus', true],
            ['GET', '#^/returns$#', 'listReturns', true],
            ['PUT', '#^/returns/([^/]+)/status$#', 'updateReturnStatus', true],

            ['GET', '#^/users$#', 'listUsers', true],
            ['POST', '#^/users$#', 'saveUser', true],
            ['PUT', '#^/users/me$#', 'updateMyProfile', false],
            ['PUT', '#^/customers/([^/]+)$#', 'updateUser', true],
            ['GET', '#^/customers/([^/]+)/addresses$#', 'listAddresses', false],
            ['POST', '#^/customers/([^/]+)/addresses$#', 'createAddress', false],
            ['PUT', '#^/customers/([^/]+)/addresses/([^/]+)$#', 'updateAddress', false],
            ['DELETE', '#^/customers/([^/]+)/addresses/([^/]+)$#', 'deleteAddress', false],
            ['POST', '#^/customers/([^/]+)/addresses/([^/]+)/default$#', 'defaultAddress', false],
            ['POST', '#^/auth/google$#', 'googleAuth', false],

            ['GET', '#^/reviews$#', 'listReviews', false],
            ['POST', '#^/reviews$#', 'createReview', false],
            ['POST', '#^/reviews/([^/]+)/helpful$#', 'reviewHelpful', false],
            ['PUT', '#^/reviews/([^/]+)/status$#', 'updateReviewStatus', true],
            ['DELETE', '#^/reviews/([^/]+)$#', 'deleteReview', true],
            ['GET', '#^/inventory/logs$#', 'inventoryLogs', true],
            ['POST', '#^/inventory/update-variant$#', 'updateVariantStock', true],
            ['POST', '#^/media/upload$#', 'uploadMedia', true],
            ['GET', '#^/wishlist/([^/]+)$#', 'getWishlist', false],
            ['POST', '#^/wishlist/([^/]+)$#', 'syncWishlist', false],
            ['GET', '#^/cart/([^/]+)$#', 'getCart', false],
            ['POST', '#^/cart/([^/]+)$#', 'syncCart', false],
            ['GET', '#^/recently-viewed/([^/]+)$#', 'getRecentlyViewed', false],
            ['POST', '#^/recently-viewed/([^/]+)$#', 'recordRecentlyViewed', false],

            ['GET', '#^/size-groups$#', 'listSizeGroups', false],
            ['POST', '#^/size-groups$#', 'createSizeGroup', true],
            ['PUT', '#^/size-groups/([^/]+)$#', 'updateSizeGroup', true],
            ['DELETE', '#^/size-groups/([^/]+)$#', 'deleteSizeGroup', true],
            ['GET', '#^/colors$#', 'listColors', false],
            ['POST', '#^/colors$#', 'createColor', true],
            ['PUT', '#^/colors/([^/]+)$#', 'updateColor', true],
            ['DELETE', '#^/colors/([^/]+)$#', 'deleteColor', true],
            ['GET', '#^/size-guides/conflicts$#', 'sizeGuideConflicts', false],
            ['GET', '#^/size-guides/widget-settings$#', 'getWidgetSettings', false],
            ['POST', '#^/size-guides/widget-settings$#', 'updateWidgetSettings', true],
            ['GET', '#^/size-guides/permissions$#', 'sizeFitPermissions', true],
            ['POST', '#^/size-guides/recommend$#', 'fitRecommendation', false],
            ['GET', '#^/size-guides/boundary-test-suite$#', 'boundaryTestSuite', true],
            ['POST', '#^/size-guides/test-boundaries$#', 'runBoundaryTests', true],
            ['GET', '#^/size-guides/audit-logs$#', 'sizeFitAuditLogs', true],
            ['POST', '#^/size-guides/analytics/override$#', 'logSizeOverride', false],
            ['GET', '#^/size-guides/analytics/overrides$#', 'sizeOverrideAnalytics', true],
            ['GET', '#^/size-guides$#', 'listSizeGuides', false],
            ['POST', '#^/size-guides$#', 'createSizeGuide', true],
            ['GET', '#^/size-guides/([^/]+)/versions$#', 'sizeGuideVersions', true],
            ['POST', '#^/size-guides/([^/]+)/rollback$#', 'rollbackSizeGuide', true],
            ['PUT', '#^/size-guides/([^/]+)$#', 'updateSizeGuide', true],
            ['DELETE', '#^/size-guides/([^/]+)$#', 'deleteSizeGuide', true],
            ['GET', '#^/fit-profiles/([^/]+)/export$#', 'exportFitProfile', false],
            ['GET', '#^/fit-profiles/([^/]+)$#', 'getFitProfile', false],
            ['POST', '#^/fit-profiles$#', 'saveFitProfile', false],
            ['DELETE', '#^/fit-profiles/([^/]+)$#', 'deleteFitProfile', false],

            ['GET', '#^/gini/config$#', 'giniConfig', false],
            ['POST', '#^/gini/sessions$#', 'createGiniSession', false],
            ['DELETE', '#^/gini/sessions/([^/]+)$#', 'deleteGiniSession', false],
            ['POST', '#^/gini/turns$#', 'giniTurn', false],
            ['POST', '#^/gini/vision-turn$#', 'giniVisionTurn', false],
            ['POST', '#^/gini/vision-analysis$#', 'giniVisionTurn', false],
            ['POST', '#^/gini/speech-to-text$#', 'giniSpeechToText', false],
            ['POST', '#^/gini/text-to-speech$#', 'giniTextToSpeech', false],
            ['POST', '#^/gini/audio-turn$#', 'giniAudioTurn', false],
            ['GET', '#^/gini/chirp-info$#', 'giniChirpInfo', false],
            ['POST', '#^/gini/confirmations/([^/]+)$#', 'resolveGiniConfirmation', false],
            ['POST', '#^/gini/feedback$#', 'giniFeedback', false],
            ['GET', '#^/admin/gini/settings$#', 'adminGiniSettings', true],
            ['PUT', '#^/admin/gini/settings$#', 'updateAdminGiniSettings', true],
            ['POST', '#^/admin/gini/publish$#', 'publishGiniSettings', true],
            ['POST', '#^/admin/gini/rollback$#', 'rollbackGiniSettings', true],
            ['POST', '#^/admin/gini/test$#', 'testGini', true],
            ['GET', '#^/admin/gini/analytics$#', 'giniAnalytics', true],
            ['GET', '#^/admin/gini/sessions$#', 'adminGiniSessions', true],
            ['POST', '#^/admin/gini/emergency-pause$#', 'pauseGini', true],
        ];

        $allowedMethods = [];
        foreach ($routes as [$method, $pattern, $handler, $requiresAdmin]) {
            if (!preg_match($pattern, $this->path, $matches)) {
                continue;
            }
            $allowedMethods[] = $method;
            if ($method !== $this->method) {
                continue;
            }
            if ($requiresAdmin) {
                $this->requireAdmin();
            }
            array_shift($matches);
            return $this->{$handler}(...array_map('rawurldecode', $matches));
        }

        if ($allowedMethods) {
            $allowedMethods = array_values(array_unique($allowedMethods));
            header('Allow: ' . implode(', ', $allowedMethods));
            throw new ApiException(
                "Method '{$this->method}' is not allowed for '{$this->path}'.",
                405,
                ['allowedMethods' => $allowedMethods],
            );
        }

        throw new ApiException("Endpoint '{$this->method} {$this->path}' was not found.", 404);
    }

    private function result(mixed $payload, int $status = 200, int $cacheSeconds = 0): array
    {
        return [$payload, $status, $cacheSeconds];
    }

    private function requireFields(array $fields): void
    {
        $missing = [];
        foreach ($fields as $field) {
            if (!array_key_exists($field, $this->body) || $this->body[$field] === '' || $this->body[$field] === null) {
                $missing[] = $field;
            }
        }
        if ($missing) {
            throw new ApiException('Required fields are missing.', 422, ['fields' => $missing]);
        }
    }

    private function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        return preg_match('/^Bearer\s+(.+)$/i', trim($header), $matches) ? trim($matches[1]) : null;
    }

    private function requireAdmin(): array
    {
        if ($this->admin !== null) {
            return $this->admin;
        }
        $token = $this->bearerToken();
        if (!$token || strlen($token) < 32) {
            throw new ApiException('Administrator authentication is required.', 401);
        }
        $stmt = $this->db->prepare(
            "SELECT a.* FROM admin_sessions s JOIN admin_users a ON a.id=s.admin_id
             WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP() AND a.is_active=1 LIMIT 1"
        );
        $stmt->execute([hash('sha256', $token)]);
        $admin = $stmt->fetch();
        if (!$admin) {
            throw new ApiException('The administrator session is invalid or expired.', 401);
        }
        $admin['permissions'] = jsonFromDb($admin['permissions'], []);
        return $this->admin = $admin;
    }

    private function optionalAdmin(): ?array
    {
        if ($this->admin !== null) {
            return $this->admin;
        }

        $token = $this->bearerToken();
        if (!$token || strlen($token) < 32) {
            return null;
        }

        $stmt = $this->db->prepare(
            "SELECT a.* FROM admin_sessions s JOIN admin_users a ON a.id=s.admin_id
             WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP()
             AND a.is_active=1 LIMIT 1"
        );
        $stmt->execute([hash('sha256', $token)]);
        $admin = $stmt->fetch();
        if (!$admin) {
            return null;
        }

        $admin['permissions'] = jsonFromDb($admin['permissions'], []);
        return $this->admin = $admin;
    }

    private function requireCustomer(?string $expectedUserId = null): array
    {
        $token = $this->bearerToken();
        if (!$token || strlen($token) < 32) {
            throw new ApiException('Customer authentication is required.', 401);
        }

        if ($this->customer === null) {
            $stmt = $this->db->prepare(
                "SELECT u.* FROM user_sessions s JOIN users u ON u.id=s.user_id
                 WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP()
                 AND u.is_active=1 LIMIT 1"
            );
            $stmt->execute([hash('sha256', $token)]);
            $customer = $stmt->fetch();
            if (!$customer) {
                throw new ApiException('The customer session is invalid or expired.', 401);
            }
            $this->customer = $customer;
        }

        if ($expectedUserId !== null && !hash_equals((string) $this->customer['id'], $expectedUserId)) {
            throw new ApiException('You cannot access another customer account.', 403);
        }
        return $this->customer;
    }

    private function authorizeCustomerResource(string $userId): void
    {
        if ($this->optionalAdmin() !== null) {
            return;
        }
        $this->requireCustomer($userId);
    }

    private function clientIp(): string
    {
        $cloudflare = trim((string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
        if ($cloudflare !== '') {
            return $cloudflare;
        }

        $forwarded = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
        if ($forwarded !== '') {
            return $forwarded;
        }
        return trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    }

    private function verifyGoogleIdentityToken(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new ApiException('The Google identity token is malformed.', 401);
        }

        [$encodedHeader, $encodedClaims, $encodedSignature] = $parts;
        $header = json_decode($this->base64UrlDecode($encodedHeader), true);
        $claims = json_decode($this->base64UrlDecode($encodedClaims), true);
        if (!is_array($header) || !is_array($claims) || ($header['alg'] ?? '') !== 'RS256') {
            throw new ApiException('The Google identity token is invalid.', 401);
        }

        $issuer = (string) ($claims['iss'] ?? '');
        if (str_starts_with($issuer, 'https://securetoken.google.com/')) {
            return $this->verifyFirebaseToken(
                $encodedHeader . '.' . $encodedClaims,
                $encodedSignature,
                $header,
                $claims,
            );
        }

        $clientId = trim((string) envValue('GOOGLE_CLIENT_ID', ''));
        if ($clientId === '') {
            throw new ApiException('Google OAuth is not configured on the server.', 503);
        }
        $response = $this->httpJson(
            'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($token),
        );
        $verified = $response['body'];
        if (($response['status'] ?? 500) !== 200
            || !is_array($verified)
            || !hash_equals($clientId, (string) ($verified['aud'] ?? ''))
        ) {
            throw new ApiException('Google identity token verification failed.', 401);
        }
        return $verified;
    }

    private function verifyFirebaseToken(
        string $signedData,
        string $encodedSignature,
        array $header,
        array $claims,
    ): array {
        $projectId = trim((string) envValue('FIREBASE_PROJECT_ID', ''));
        $expectedIssuer = 'https://securetoken.google.com/' . $projectId;
        $now = time();

        if ($projectId === ''
            || !hash_equals($projectId, (string) ($claims['aud'] ?? ''))
            || !hash_equals($expectedIssuer, (string) ($claims['iss'] ?? ''))
            || empty($claims['sub'])
            || (int) ($claims['exp'] ?? 0) <= $now
            || (int) ($claims['iat'] ?? PHP_INT_MAX) > $now + 300
            || ($claims['email_verified'] ?? true) === false
        ) {
            throw new ApiException('Firebase identity token verification failed.', 401);
        }

        $kid = (string) ($header['kid'] ?? '');
        $response = $this->httpJson(
            'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
        );
        $certificates = $response['body'];
        $certificate = is_array($certificates) ? ($certificates[$kid] ?? null) : null;
        if (($response['status'] ?? 500) !== 200 || !is_string($certificate)) {
            throw new ApiException('Firebase signing certificate is unavailable.', 503);
        }

        $verified = openssl_verify(
            $signedData,
            $this->base64UrlDecode($encodedSignature),
            $certificate,
            OPENSSL_ALGO_SHA256,
        );
        if ($verified !== 1) {
            throw new ApiException('Firebase identity token signature is invalid.', 401);
        }
        return $claims;
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = (4 - strlen($value) % 4) % 4;
        $decoded = base64_decode(strtr($value . str_repeat('=', $padding), '-_', '+/'), true);
        if ($decoded === false) {
            throw new ApiException('The identity token contains invalid encoding.', 401);
        }
        return $decoded;
    }

    private function document(string $key, mixed $default): mixed
    {
        $stmt = $this->db->prepare('SELECT data FROM settings_documents WHERE document_key=?');
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? jsonFromDb($row['data'], $default) : $default;
    }

    private function saveDocument(string $key, mixed $value): mixed
    {
        $stmt = $this->db->prepare(
            'INSERT INTO settings_documents (document_key,data) VALUES (?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)'
        );
        $stmt->execute([$key, jsonForDb($value)]);
        return $value;
    }

    private function audit(string $action, string $entityType, string $entityId, string $details, mixed $previous = null, mixed $next = null): void
    {
        $admin = $this->admin;
        $payload = [
            'id' => apiId('audit'), 'adminId' => $admin['id'] ?? 'system',
            'adminName' => $admin['name'] ?? 'System', 'adminEmail' => $admin['email'] ?? '',
            'action' => $action, 'entityType' => $entityType, 'entityId' => $entityId,
            'details' => $details, 'previousValue' => $previous, 'newValue' => $next,
            'ipAddress' => $this->clientIp(), 'createdAt' => isoDate(),
        ];
        $stmt = $this->db->prepare(
            'INSERT INTO audit_logs (id,admin_id,action,entity_type,entity_id,details,ip_address,data) VALUES (?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([$payload['id'], $admin['id'] ?? null, $action, $entityType, $entityId, $details, $payload['ipAddress'], jsonForDb($payload)]);
    }

    private function health(): array
    {
        $this->db->query('SELECT 1');
        return $this->result([
            'success' => true, 'service' => 'vedaaya-ecommerce-api', 'version' => '3.0.0',
            'database' => 'connected', 'timestamp' => isoDate(),
        ], 200, 0);
    }
}
