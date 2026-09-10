<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/app/bootstrap.php';

$seedPath = __DIR__ . '/seed-data.json';
if (!is_readable($seedPath)) {
    fwrite(STDERR, "seed-data.json is missing. Run scripts/export-backend-seed.mjs first.\n");
    exit(1);
}

try {
    $seed = json_decode((string) file_get_contents($seedPath), true, 512, JSON_THROW_ON_ERROR);
    $db = Db::connection();
    $db->beginTransaction();

    saveDocument($db, 'store', $seed['settings'] ?? []);
    saveDocument($db, 'navigation_menu', $seed['navigationMenu'] ?? []);
    saveDocument($db, 'announcements', $seed['announcements'] ?? []);
    saveDocument($db, 'homepage_sections', $seed['homepageSections'] ?? []);
    saveDocument($db, 'size_boundary_tests', defaultSizeBoundaryTests());
    saveDocument($db, 'shipping', [
        'freeShippingThreshold' => (float) ($seed['settings']['freeShippingThreshold'] ?? 999),
        'standardShippingFee' => (float) ($seed['settings']['standardShippingFee'] ?? 99),
        'expressShippingFee' => 199,
        'expressAvailable' => true,
        'codAvailable' => (bool) ($seed['settings']['isCodEnabled'] ?? true),
        'codFee' => 49,
        'minCodOrderValue' => 499,
        'maxCodOrderValue' => 15000,
        'pincodeRuleMode' => 'all_india',
        'serviceablePincodes' => [],
        'blockedCodPincodes' => [],
    ]);
    saveDocument($db, 'payment', [
        'razorpayEnabled' => envValue('RAZORPAY_KEY_ID', '') !== '',
        'razorpayKeyId' => (string) envValue('RAZORPAY_KEY_ID', ''),
        'isRazorpayTestMode' => envBool('RAZORPAY_TEST_MODE', false),
        'codEnabled' => true,
        'upiDirectEnabled' => false,
        'currency' => 'INR',
        'currencySymbol' => '₹',
    ]);

    seedCategories($db, $seed['categories'] ?? []);
    seedCollections($db, $seed['collections'] ?? []);
    seedAttributes($db, $seed['attributes'] ?? []);
    seedProducts($db, $seed['products'] ?? []);
    seedBanners($db, $seed['banners'] ?? []);
    seedCoupons($db, $seed['coupons'] ?? []);
    seedUsers($db, $seed['users'] ?? []);
    seedSizeGroups($db, $seed['sizeGroups'] ?? []);
    seedColors($db, $seed['colors'] ?? []);
    seedSizeGuides($db, $seed['sizeGuides'] ?? []);
    seedGiniConfig($db, $seed['giniSettings'] ?? []);
    $adminCredentials = seedAdmin($db);

    $db->commit();
    echo "Seed completed successfully.\n";
    echo 'Products: ' . count($seed['products'] ?? []) . "\n";
    echo 'Categories: ' . count($seed['categories'] ?? []) . "\n";
    if ($adminCredentials) {
        echo "ADMIN_EMAIL={$adminCredentials['email']}\n";
        echo "ADMIN_PASSWORD={$adminCredentials['password']}\n";
        echo "Change this one-time administrator password after first use.\n";
    }
} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, 'Seed failed: ' . $e->getMessage() . "\n");
    exit(1);
}

function saveDocument(PDO $db, string $key, mixed $data): void
{
    $stmt = $db->prepare(
        'INSERT INTO settings_documents (document_key,data) VALUES (?,?)
         ON DUPLICATE KEY UPDATE data=VALUES(data)'
    );
    $stmt->execute([$key, jsonForDb($data)]);
}

function defaultSizeBoundaryTests(): array
{
    return [
        [
            'id' => 'size-boundary-s-01',
            'name' => 'Regular fit at the S garment boundary',
            'garmentCategory' => 'Kurtas & Kurtis',
            'fabricStretch' => 'non_stretch',
            'preferredFit' => 'regular',
            'inputMeasurements' => ['bust' => 34, 'unit' => 'inches'],
            'expectedRecommendedSize' => 'S',
            'expectedConfidenceLevel' => 'High',
            'expectedBetweenSizeFlag' => true,
            'description' => 'A 34-inch bust plus two inches of ease should select S.',
        ],
        [
            'id' => 'size-boundary-m-01',
            'name' => 'Regular fit at the M garment boundary',
            'garmentCategory' => 'Kurtas & Kurtis',
            'fabricStretch' => 'non_stretch',
            'preferredFit' => 'regular',
            'inputMeasurements' => ['bust' => 36, 'unit' => 'inches'],
            'expectedRecommendedSize' => 'M',
            'expectedConfidenceLevel' => 'High',
            'expectedBetweenSizeFlag' => true,
            'description' => 'A 36-inch bust plus two inches of ease should select M.',
        ],
        [
            'id' => 'size-boundary-cm-01',
            'name' => 'Centimetre conversion at the M boundary',
            'garmentCategory' => 'Kurtas & Kurtis',
            'fabricStretch' => 'non_stretch',
            'preferredFit' => 'regular',
            'inputMeasurements' => ['bust' => 91.44, 'unit' => 'cm'],
            'expectedRecommendedSize' => 'M',
            'expectedConfidenceLevel' => 'High',
            'expectedBetweenSizeFlag' => true,
            'description' => '91.44 cm is 36 inches and should select M.',
        ],
    ];
}

function seedCategories(PDO $db, array $categories): void
{
    $stmt = $db->prepare(
        'INSERT INTO categories (id,parent_id,name,slug,display_order,is_active,data) VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE parent_id=VALUES(parent_id),name=VALUES(name),slug=VALUES(slug),display_order=VALUES(display_order),is_active=VALUES(is_active),data=VALUES(data)'
    );
    foreach ($categories as $category) {
        $stmt->execute([
            $category['id'],
            $category['parentId'] ?? null,
            $category['name'],
            $category['slug'] ?? slugify($category['name']),
            (int) ($category['displayOrder'] ?? 0),
            ($category['isActive'] ?? true) ? 1 : 0,
            jsonForDb($category),
        ]);
    }
}

function seedCollections(PDO $db, array $collections): void
{
    $stmt = $db->prepare(
        'INSERT INTO collections (id,name,slug,display_order,is_active,assignment_type,rules_json,data)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),slug=VALUES(slug),display_order=VALUES(display_order),is_active=VALUES(is_active),assignment_type=VALUES(assignment_type),rules_json=VALUES(rules_json),data=VALUES(data)'
    );
    foreach ($collections as $collection) {
        $name = (string) ($collection['name'] ?? $collection['title'] ?? 'Collection');
        $stmt->execute([
            $collection['id'],
            $name,
            $collection['slug'] ?? slugify($name),
            (int) ($collection['displayOrder'] ?? 0),
            ($collection['isActive'] ?? true) ? 1 : 0,
            $collection['assignmentType'] ?? 'manual',
            jsonForDb($collection['rules'] ?? []),
            jsonForDb($collection),
        ]);
    }
}

function seedAttributes(PDO $db, array $attributes): void
{
    $stmt = $db->prepare(
        'INSERT INTO attributes (id,attribute_key,name,display_order,is_active,data) VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE attribute_key=VALUES(attribute_key),name=VALUES(name),display_order=VALUES(display_order),is_active=VALUES(is_active),data=VALUES(data)'
    );
    foreach ($attributes as $order => $attribute) {
        $stmt->execute([
            $attribute['id'],
            $attribute['key'] ?? slugify($attribute['name']),
            $attribute['name'],
            (int) ($attribute['displayOrder'] ?? $order),
            ($attribute['isActive'] ?? true) ? 1 : 0,
            jsonForDb($attribute),
        ]);
    }
}

function seedProducts(PDO $db, array $products): void
{
    $productStmt = $db->prepare(
        'INSERT INTO products (id,name,slug,sku,category,subcategory,sub_subcategory,brand,mrp,selling_price,cost_price,discount_percent,rating,review_count,is_bestseller,is_new_arrival,is_trending,is_plus_size,is_festive,is_active,data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),slug=VALUES(slug),sku=VALUES(sku),category=VALUES(category),subcategory=VALUES(subcategory),sub_subcategory=VALUES(sub_subcategory),brand=VALUES(brand),mrp=VALUES(mrp),selling_price=VALUES(selling_price),cost_price=VALUES(cost_price),discount_percent=VALUES(discount_percent),rating=VALUES(rating),review_count=VALUES(review_count),is_bestseller=VALUES(is_bestseller),is_new_arrival=VALUES(is_new_arrival),is_trending=VALUES(is_trending),is_plus_size=VALUES(is_plus_size),is_festive=VALUES(is_festive),is_active=VALUES(is_active),data=VALUES(data)'
    );
    $imageStmt = $db->prepare(
        'INSERT INTO product_images (id,product_id,url,alt_text,image_type,is_primary,display_order,data) VALUES (?,?,?,?,?,?,?,?)'
    );
    $variantStmt = $db->prepare(
        'INSERT INTO product_variants (id,product_id,sku,size,color,color_hex,stock,price,mrp,barcode,weight_in_grams,data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    foreach ($products as $product) {
        $payload = $product;
        unset($payload['images'], $payload['variants']);
        $mrp = max(0, (float) ($product['mrp'] ?? 0));
        $selling = max(0, (float) ($product['sellingPrice'] ?? 0));
        $productStmt->execute([
            $product['id'], $product['name'], $product['slug'], $product['sku'], $product['category'] ?? 'Uncategorized',
            $product['subcategory'] ?? null, $product['subSubCategory'] ?? null, $product['brand'] ?? null,
            $mrp, $selling, isset($product['costPrice']) ? max(0, (float) $product['costPrice']) : null,
            max(0, (float) ($product['discountPercent'] ?? ($mrp > 0 ? (($mrp - $selling) / $mrp * 100) : 0))),
            min(5, max(0, (float) ($product['rating'] ?? 0))), max(0, (int) ($product['reviewCount'] ?? 0)),
            !empty($product['isBestseller']) ? 1 : 0,
            !empty($product['isNewArrival']) ? 1 : 0,
            !empty($product['isTrending']) ? 1 : 0,
            !empty($product['isPlusSize']) ? 1 : 0,
            !empty($product['isFestive']) ? 1 : 0,
            ($product['isActive'] ?? true) ? 1 : 0,
            jsonForDb($payload),
        ]);
        $db->prepare('DELETE FROM product_images WHERE product_id=?')->execute([$product['id']]);
        foreach ($product['images'] ?? [] as $order => $image) {
            if (!is_array($image) || empty($image['url'])) continue;
            $imageStmt->execute([
                $image['id'] ?? apiId('img'), $product['id'], $image['url'], $image['altText'] ?? $product['name'],
                $image['type'] ?? null,
                !empty($image['isPrimary']) ? 1 : 0,
                (int) ($image['order'] ?? $order),
                jsonForDb($image),
            ]);
        }
        $db->prepare('DELETE FROM product_variants WHERE product_id=?')->execute([$product['id']]);
        foreach ($product['variants'] ?? [] as $order => $variant) {
            if (!is_array($variant)) continue;
            $variantStmt->execute([
                $variant['id'] ?? apiId('variant'), $product['id'], $variant['sku'] ?? ($product['sku'] . '-' . ($order + 1)),
                $variant['size'] ?? 'One Size', $variant['color'] ?? 'Standard', $variant['colorHex'] ?? null,
                max(0, (int) ($variant['stock'] ?? 0)), isset($variant['price']) ? max(0, (float) $variant['price']) : null,
                isset($variant['mrp']) ? max(0, (float) $variant['mrp']) : null, $variant['barcode'] ?? null,
                isset($variant['weightInGrams']) ? max(0, (int) $variant['weightInGrams']) : null, jsonForDb($variant),
            ]);
        }
    }
}

function seedBanners(PDO $db, array $banners): void
{
    $stmt = $db->prepare(
        'INSERT INTO banners (id,title,display_order,is_active,starts_at,ends_at,data) VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title),display_order=VALUES(display_order),is_active=VALUES(is_active),starts_at=VALUES(starts_at),ends_at=VALUES(ends_at),data=VALUES(data)'
    );
    foreach ($banners as $banner) {
        $stmt->execute([
            $banner['id'], $banner['title'], (int) ($banner['displayOrder'] ?? 0),
            ($banner['isActive'] ?? $banner['active'] ?? true) ? 1 : 0,
            nullableSqlDate($banner['startDate'] ?? null), nullableSqlDate($banner['endDate'] ?? null), jsonForDb($banner),
        ]);
    }
}

function seedCoupons(PDO $db, array $coupons): void
{
    $stmt = $db->prepare(
        'INSERT INTO coupons (id,code,discount_type,discount_value,min_order_amount,max_discount_amount,first_order_only,is_active,valid_until,usage_limit,usage_count,data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE code=VALUES(code),discount_type=VALUES(discount_type),discount_value=VALUES(discount_value),min_order_amount=VALUES(min_order_amount),max_discount_amount=VALUES(max_discount_amount),first_order_only=VALUES(first_order_only),is_active=VALUES(is_active),valid_until=VALUES(valid_until),usage_limit=VALUES(usage_limit),data=VALUES(data)'
    );
    foreach ($coupons as $coupon) {
        $id = $coupon['id'] ?? ('coupon-' . strtolower($coupon['code']));
        $stmt->execute([
            $id, strtoupper($coupon['code']), $coupon['discountType'] ?? 'percentage', max(0, (float) ($coupon['discountValue'] ?? 0)),
            max(0, (float) ($coupon['minOrderAmount'] ?? $coupon['minOrderValue'] ?? 0)),
            isset($coupon['maxDiscountAmount']) || isset($coupon['maxDiscount']) ? max(0, (float) ($coupon['maxDiscountAmount'] ?? $coupon['maxDiscount'])) : null,
            !empty($coupon['firstOrderOnly']) ? 1 : 0,
            ($coupon['isActive'] ?? $coupon['active'] ?? true) ? 1 : 0,
            nullableSqlDate($coupon['validUntil'] ?? $coupon['expiryDate'] ?? null),
            isset($coupon['usageLimit']) ? max(0, (int) $coupon['usageLimit']) : null,
            max(0, (int) ($coupon['usageCount'] ?? 0)), jsonForDb(array_merge($coupon, ['id' => $id])),
        ]);
    }
}

function seedUsers(PDO $db, array $users): void
{
    $stmt = $db->prepare(
        'INSERT INTO users (id,email,name,phone,avatar_url,role,auth_provider,data,last_login_at) VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),phone=VALUES(phone),avatar_url=VALUES(avatar_url),data=VALUES(data)'
    );
    $addressStmt = $db->prepare(
        'INSERT INTO user_addresses (id,user_id,is_default,data) VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE is_default=VALUES(is_default),data=VALUES(data)'
    );
    foreach ($users as $user) {
        $email = strtolower($user['email']);
        $stmt->execute([
            $user['id'], $email, $user['name'], $user['phone'] ?? null, $user['avatarUrl'] ?? null,
            $user['role'] ?? 'customer', $user['authProvider'] ?? 'guest', jsonForDb($user), nullableSqlDate($user['lastLoginAt'] ?? null),
        ]);
        foreach ($user['addresses'] ?? [] as $address) {
            $id = $address['id'] ?? apiId('addr');
            $addressStmt->execute([
                $id,
                $user['id'],
                !empty($address['isDefault']) ? 1 : 0,
                jsonForDb(array_merge($address, ['id' => $id])),
            ]);
        }
    }
}

function seedSizeGroups(PDO $db, array $groups): void
{
    $stmt = $db->prepare(
        'INSERT INTO size_groups (id,name,is_default,is_active,data) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),is_default=VALUES(is_default),is_active=VALUES(is_active),data=VALUES(data)'
    );
    $valueStmt = $db->prepare('INSERT INTO size_group_values (size_group_id,size_value,display_order) VALUES (?,?,?)');
    foreach ($groups as $group) {
        $stmt->execute([
            $group['id'],
            $group['name'],
            !empty($group['isDefault']) ? 1 : 0,
            ($group['isActive'] ?? true) ? 1 : 0,
            jsonForDb($group),
        ]);
        $db->prepare('DELETE FROM size_group_values WHERE size_group_id=?')->execute([$group['id']]);
        foreach ($group['sizes'] ?? [] as $order => $size) {
            $valueStmt->execute([$group['id'], $size, $order]);
        }
    }
}

function seedColors(PDO $db, array $colors): void
{
    $stmt = $db->prepare(
        'INSERT INTO store_colors (id,name,hex,display_order,is_active,data) VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),hex=VALUES(hex),display_order=VALUES(display_order),is_active=VALUES(is_active),data=VALUES(data)'
    );
    foreach ($colors as $order => $color) {
        $stmt->execute([$color['id'], $color['name'], strtoupper($color['hex']), (int) ($color['order'] ?? $order), ($color['isActive'] ?? true) ? 1 : 0, jsonForDb($color)]);
    }
}

function seedSizeGuides(PDO $db, array $guides): void
{
    $stmt = $db->prepare(
        'INSERT INTO size_guides (id,title,measurement_type,precedence_level,version,is_default,is_active,data)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title),measurement_type=VALUES(measurement_type),precedence_level=VALUES(precedence_level),is_default=VALUES(is_default),is_active=VALUES(is_active),data=VALUES(data)'
    );
    $versionStmt = $db->prepare(
        'INSERT IGNORE INTO size_guide_versions (size_guide_id,version,snapshot,created_by,change_summary) VALUES (?,?,?,?,?)'
    );
    foreach ($guides as $guide) {
        $version = max(1, (int) ($guide['version'] ?? 1));
        $stmt->execute([
            $guide['id'], $guide['title'], $guide['measurementType'] ?? 'garment', $guide['precedenceLevel'] ?? 'default',
            $version,
            !empty($guide['isDefault']) ? 1 : 0,
            ($guide['isActive'] ?? true) ? 1 : 0,
            jsonForDb($guide),
        ]);
        $versionStmt->execute([$guide['id'], $version, jsonForDb($guide), 'Initial seed', 'Imported from storefront data']);
    }
}

function seedGiniConfig(PDO $db, array $config): void
{
    if (!$config) return;
    $exists = (int) $db->query('SELECT COUNT(*) FROM gini_config_versions')->fetchColumn();
    if ($exists > 0) return;
    $version = max(1, (int) ($config['version'] ?? 1));
    $stmt = $db->prepare("INSERT INTO gini_config_versions (version,status,config,created_by,published_at) VALUES (?,'published',?,'initial-seed',UTC_TIMESTAMP())");
    $stmt->execute([$version, jsonForDb($config)]);
}

function seedAdmin(PDO $db): ?array
{
    if ((int) $db->query('SELECT COUNT(*) FROM admin_users')->fetchColumn() > 0) {
        return null;
    }
    $email = strtolower((string) envValue('ADMIN_INITIAL_EMAIL', 'admin@vedaaya.com'));
    $password = (string) envValue('ADMIN_INITIAL_PASSWORD', '');
    if ($password === '') {
        $password = rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
    }
    $permissions = [
        'manage_products', 'manage_categories', 'manage_orders', 'manage_customers', 'manage_settings',
        'manage_cms', 'manage_coupons', 'manage_attributes', 'manage_banners', 'manage_inventory',
        'manage_reviews', 'manage_returns', 'view_analytics', 'view_reports', 'view_audit_logs', 'manage_admins',
    ];
    $stmt = $db->prepare(
        "INSERT INTO admin_users (id,email,name,password_hash,role,permissions,is_active)
         VALUES ('adm-initial',?,?,?,'super_admin',?,1)"
    );
    $stmt->execute([$email, 'Vedaaya Administrator', password_hash($password, PASSWORD_DEFAULT), jsonForDb($permissions)]);
    return ['email' => $email, 'password' => $password];
}

function nullableSqlDate(mixed $value): ?string
{
    if (!$value) return null;
    return (new DateTimeImmutable((string) $value))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
}
