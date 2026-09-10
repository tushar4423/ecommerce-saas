<?php

declare(strict_types=1);

trait CatalogApiTrait
{
    private function listProducts(): array
    {
        $rows = $this->db->query('SELECT * FROM products ORDER BY created_at DESC')->fetchAll();
        $products = array_map(fn(array $row) => $this->productFromRow($row), $rows);
        $q = strtolower(trim((string) ($this->query['searchQuery'] ?? $this->query['search'] ?? $this->query['q'] ?? '')));
        $category = strtolower(trim((string) ($this->query['category'] ?? '')));
        $subcategory = strtolower(trim((string) ($this->query['subcategory'] ?? '')));
        $collection = strtolower(trim((string) ($this->query['collection'] ?? '')));
        $sizes = $this->queryList('sizes');
        $colors = $this->queryList('colors');
        $fabrics = $this->queryList('fabrics');
        $works = $this->queryList('works');
        $occasions = $this->queryList('occasions');
        $minPrice = isset($this->query['minPrice']) ? (float) $this->query['minPrice'] : null;
        $maxPrice = isset($this->query['maxPrice']) ? (float) $this->query['maxPrice'] : null;
        $minDiscount = isset($this->query['discountMin']) ? (float) $this->query['discountMin'] : null;
        $minRating = isset($this->query['ratingMin']) ? (float) $this->query['ratingMin'] : null;
        $inStockOnly = filter_var($this->query['inStockOnly'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $products = array_values(array_filter($products, function (array $product) use ($q, $category, $subcategory, $collection, $sizes, $colors, $fabrics, $works, $occasions, $minPrice, $maxPrice, $minDiscount, $minRating, $inStockOnly): bool {
            if (($product['isActive'] ?? true) === false && !isset($this->query['includeInactive'])) return false;
            if ($category !== '' && strtolower((string) ($product['category'] ?? '')) !== $category && strtolower((string) ($product['categorySlug'] ?? '')) !== $category) return false;
            if ($subcategory !== '' && strtolower((string) ($product['subcategory'] ?? '')) !== $subcategory) return false;
            if ($collection !== '' && !in_array($collection, array_map('strtolower', $product['collections'] ?? []), true)) return false;
            $price = (float) ($product['sellingPrice'] ?? 0);
            if ($minPrice !== null && $price < $minPrice) return false;
            if ($maxPrice !== null && $price > $maxPrice) return false;
            if ($minDiscount !== null && (float) ($product['discountPercent'] ?? 0) < $minDiscount) return false;
            if ($minRating !== null && (float) ($product['rating'] ?? 0) < $minRating) return false;
            if ($fabrics && !in_array(strtolower((string) ($product['fabric'] ?? '')), $fabrics, true)) return false;
            if ($works && !in_array(strtolower((string) ($product['work'] ?? '')), $works, true)) return false;
            if ($occasions && !in_array(strtolower((string) ($product['occasion'] ?? '')), $occasions, true)) return false;
            $variants = $product['variants'] ?? [];
            if ($sizes && !array_filter($variants, fn($v) => in_array(strtolower((string) ($v['size'] ?? '')), $sizes, true))) return false;
            if ($colors && !array_filter($variants, fn($v) => in_array(strtolower((string) ($v['color'] ?? '')), $colors, true))) return false;
            if ($inStockOnly && !array_filter($variants, fn($v) => (int) ($v['stock'] ?? 0) > 0)) return false;
            if ($q !== '') {
                $haystack = strtolower(implode(' ', [
                    $product['name'] ?? '', $product['sku'] ?? '', $product['category'] ?? '', $product['subcategory'] ?? '',
                    $product['fabric'] ?? '', $product['work'] ?? '', $product['occasion'] ?? '', implode(' ', $product['tags'] ?? []),
                ]));
                if (!str_contains($haystack, $q)) return false;
            }
            return true;
        }));

        $sort = (string) ($this->query['sortBy'] ?? 'recommended');
        usort($products, function (array $a, array $b) use ($sort): int {
            return match ($sort) {
                'price-asc', 'price_low' => ($a['sellingPrice'] ?? 0) <=> ($b['sellingPrice'] ?? 0),
                'price-desc', 'price_high' => ($b['sellingPrice'] ?? 0) <=> ($a['sellingPrice'] ?? 0),
                'rating' => ($b['rating'] ?? 0) <=> ($a['rating'] ?? 0),
                'discount' => ($b['discountPercent'] ?? 0) <=> ($a['discountPercent'] ?? 0),
                'newest' => strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? '')),
                'bestseller' => ($b['isBestseller'] ?? false) <=> ($a['isBestseller'] ?? false),
                default => (($b['isBestseller'] ?? false) <=> ($a['isBestseller'] ?? false)) ?: (($b['rating'] ?? 0) <=> ($a['rating'] ?? 0)),
            };
        });
        return $this->result($products, 200, 60);
    }

    private function queryList(string $key): array
    {
        $value = $this->query[$key] ?? [];
        $items = is_array($value) ? $value : explode(',', (string) $value);
        return array_values(array_filter(array_map(fn($item) => strtolower(trim((string) $item)), $items)));
    }

    private function getProduct(string $id): array
    {
        $product = $this->findProduct($id);
        if (!$product) throw new ApiException('Product not found.', 404);
        return $this->result($product, 200, 120);
    }

    private function findProduct(string $id, bool $forUpdate = false): ?array
    {
        $sql = 'SELECT * FROM products WHERE id=? OR slug=? LIMIT 1' . ($forUpdate ? ' FOR UPDATE' : '');
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $id]);
        $row = $stmt->fetch();
        return $row ? $this->productFromRow($row) : null;
    }

    private function productFromRow(array $row): array
    {
        $product = jsonFromDb($row['data'], []);
        $imagesStmt = $this->db->prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY display_order,id');
        $imagesStmt->execute([$row['id']]);
        $images = array_map(function (array $image): array {
            return deepMerge(jsonFromDb($image['data'], []), [
                'id' => $image['id'], 'url' => $image['url'], 'altText' => $image['alt_text'],
                'isPrimary' => (bool) $image['is_primary'], 'type' => $image['image_type'], 'order' => (int) $image['display_order'],
            ]);
        }, $imagesStmt->fetchAll());
        $variantStmt = $this->db->prepare('SELECT * FROM product_variants WHERE product_id=? ORDER BY id');
        $variantStmt->execute([$row['id']]);
        $variants = array_map(function (array $variant): array {
            $data = jsonFromDb($variant['data'], []);
            return deepMerge($data, [
                'id' => $variant['id'], 'sku' => $variant['sku'], 'size' => $variant['size'],
                'color' => $variant['color'], 'colorHex' => $variant['color_hex'], 'stock' => (int) $variant['stock'],
                'price' => $variant['price'] === null ? null : (float) $variant['price'],
                'mrp' => $variant['mrp'] === null ? null : (float) $variant['mrp'],
                'barcode' => $variant['barcode'],
                'weightInGrams' => $variant['weight_in_grams'] === null ? null : (int) $variant['weight_in_grams'],
            ]);
        }, $variantStmt->fetchAll());
        return deepMerge($product, [
            'id' => $row['id'], 'name' => $row['name'], 'slug' => $row['slug'], 'sku' => $row['sku'],
            'category' => $row['category'], 'subcategory' => $row['subcategory'], 'subSubCategory' => $row['sub_subcategory'],
            'brand' => $row['brand'], 'mrp' => (float) $row['mrp'], 'sellingPrice' => (float) $row['selling_price'],
            'costPrice' => $row['cost_price'] === null ? null : (float) $row['cost_price'],
            'discountPercent' => (float) $row['discount_percent'], 'rating' => (float) $row['rating'],
            'reviewCount' => (int) $row['review_count'], 'isBestseller' => (bool) $row['is_bestseller'],
            'isNewArrival' => (bool) $row['is_new_arrival'], 'isTrending' => (bool) $row['is_trending'],
            'isPlusSize' => (bool) $row['is_plus_size'], 'isFestive' => (bool) $row['is_festive'],
            'isActive' => (bool) $row['is_active'], 'images' => $images, 'variants' => $variants,
            'createdAt' => isoDate($row['created_at']), 'updatedAt' => isoDate($row['updated_at']),
        ]);
    }

    private function createProduct(): array
    {
        $product = $this->saveProductRecord($this->body, null);
        $this->audit('product_create', 'Product', $product['id'], 'Created product', null, $product);
        return $this->result($product, 201);
    }

    private function updateProduct(string $id): array
    {
        $existing = $this->findProduct($id);
        if (!$existing) throw new ApiException('Product not found.', 404);
        $product = $this->saveProductRecord(deepMerge($existing, $this->body), $existing['id']);
        $this->audit('product_update', 'Product', $product['id'], 'Updated product', $existing, $product);
        return $this->result($product);
    }

    private function saveProductRecord(array $product, ?string $forcedId): array
    {
        $name = trim((string) ($product['name'] ?? ''));
        if ($name === '') throw new ApiException('Product name is required.', 422);
        $id = $forcedId ?: trim((string) ($product['id'] ?? apiId('prd')));
        $slug = slugify((string) ($product['slug'] ?? $name));
        $sku = trim((string) ($product['sku'] ?? strtoupper(substr(hash('sha256', $id), 0, 12))));
        $mrp = round(max(0, (float) ($product['mrp'] ?? 0)), 2);
        $selling = round(max(0, (float) ($product['sellingPrice'] ?? 0)), 2);
        if ($mrp > 0 && $selling > $mrp) throw new ApiException('Selling price cannot exceed MRP.', 422);
        $variants = isset($product['variants']) && is_array($product['variants']) ? $product['variants'] : [];
        $images = isset($product['images']) && is_array($product['images']) ? $product['images'] : [];
        $payload = $product;
        unset($payload['images'], $payload['variants']);

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO products (id,name,slug,sku,category,subcategory,sub_subcategory,brand,mrp,selling_price,cost_price,discount_percent,rating,review_count,is_bestseller,is_new_arrival,is_trending,is_plus_size,is_festive,is_active,data)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE name=VALUES(name),slug=VALUES(slug),sku=VALUES(sku),category=VALUES(category),subcategory=VALUES(subcategory),sub_subcategory=VALUES(sub_subcategory),brand=VALUES(brand),mrp=VALUES(mrp),selling_price=VALUES(selling_price),cost_price=VALUES(cost_price),discount_percent=VALUES(discount_percent),rating=VALUES(rating),review_count=VALUES(review_count),is_bestseller=VALUES(is_bestseller),is_new_arrival=VALUES(is_new_arrival),is_trending=VALUES(is_trending),is_plus_size=VALUES(is_plus_size),is_festive=VALUES(is_festive),is_active=VALUES(is_active),data=VALUES(data)'
            );
            $stmt->execute([
                $id, $name, $slug, $sku, trim((string) ($product['category'] ?? 'Uncategorized')),
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

            $this->db->prepare('DELETE FROM product_images WHERE product_id=?')->execute([$id]);
            $imageStmt = $this->db->prepare('INSERT INTO product_images (id,product_id,url,alt_text,image_type,is_primary,display_order,data) VALUES (?,?,?,?,?,?,?,?)');
            foreach ($images as $index => $image) {
                if (!is_array($image) || trim((string) ($image['url'] ?? '')) === '') continue;
                $imageId = (string) ($image['id'] ?? apiId('img'));
                $imageStmt->execute([
                    $imageId,
                    $id,
                    $image['url'],
                    (string) ($image['altText'] ?? $name),
                    $image['type'] ?? null,
                    !empty($image['isPrimary']) ? 1 : 0,
                    (int) ($image['order'] ?? $index),
                    jsonForDb($image),
                ]);
            }

            $this->db->prepare('DELETE FROM product_variants WHERE product_id=?')->execute([$id]);
            $variantStmt = $this->db->prepare('INSERT INTO product_variants (id,product_id,sku,size,color,color_hex,stock,price,mrp,barcode,weight_in_grams,data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
            $seenSkus = [];
            foreach ($variants as $index => $variant) {
                if (!is_array($variant)) continue;
                $variantId = (string) ($variant['id'] ?? apiId('var'));
                $variantSku = trim((string) ($variant['sku'] ?? ($sku . '-' . ($index + 1))));
                if ($variantSku === '' || isset($seenSkus[strtolower($variantSku)])) throw new ApiException('Every product variant must have a unique SKU.', 422);
                $seenSkus[strtolower($variantSku)] = true;
                $stock = filter_var($variant['stock'] ?? 0, FILTER_VALIDATE_INT);
                if ($stock === false || $stock < 0) throw new ApiException('Variant stock must be a non-negative integer.', 422);
                $variantStmt->execute([
                    $variantId, $id, $variantSku, (string) ($variant['size'] ?? 'One Size'),
                    (string) ($variant['color'] ?? 'Standard'), $variant['colorHex'] ?? null, $stock,
                    isset($variant['price']) ? max(0, (float) $variant['price']) : null,
                    isset($variant['mrp']) ? max(0, (float) $variant['mrp']) : null,
                    $variant['barcode'] ?? null, isset($variant['weightInGrams']) ? max(0, (int) $variant['weightInGrams']) : null,
                    jsonForDb($variant),
                ]);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            if ($e instanceof ApiException) throw $e;
            if ($e instanceof PDOException && (int) $e->getCode() === 23000) throw new ApiException('Product slug, SKU, image ID, or variant SKU already exists.', 409);
            throw $e;
        }
        return $this->findProduct($id) ?? throw new ApiException('Unable to reload saved product.', 500);
    }

    private function deleteProduct(string $id): array
    {
        $product = $this->findProduct($id);
        if (!$product) throw new ApiException('Product not found.', 404);
        try {
            $stmt = $this->db->prepare('DELETE FROM products WHERE id=?');
            $stmt->execute([$product['id']]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) throw new ApiException('This product is referenced by an order and cannot be deleted. Deactivate it instead.', 409);
            throw $e;
        }
        $this->audit('product_delete', 'Product', $product['id'], 'Deleted product', $product, null);
        return $this->result(['success' => true]);
    }

    private function relatedProducts(string $id): array
    {
        $current = $this->findProduct($id);
        if (!$current) throw new ApiException('Product not found.', 404);
        $products = $this->listProducts()[0];
        $products = array_values(array_filter($products, fn($product) => $product['id'] !== $current['id']));
        usort($products, function ($a, $b) use ($current): int {
            $score = fn($p) => (($p['category'] ?? '') === ($current['category'] ?? '') ? 20 : 0)
                + (($p['subcategory'] ?? '') === ($current['subcategory'] ?? '') ? 12 : 0)
                + (($p['fabric'] ?? '') === ($current['fabric'] ?? '') ? 8 : 0)
                + (($p['work'] ?? '') === ($current['work'] ?? '') ? 5 : 0);
            return $score($b) <=> $score($a);
        });
        return $this->result(array_slice($products, 0, 8), 200, 120);
    }

    private function listSimpleEntities(string $table, string $orderBy = 'display_order,id'): array
    {
        $allowed = ['categories', 'collections', 'attributes', 'banners', 'coupons', 'size_groups', 'store_colors', 'size_guides'];
        if (!in_array($table, $allowed, true)) throw new LogicException('Invalid entity table.');
        $rows = $this->db->query("SELECT * FROM {$table} ORDER BY {$orderBy}")->fetchAll();
        return array_map(function (array $row): array {
            $data = jsonFromDb($row['data'], []);
            $data['id'] = $row['id'];
            if (isset($row['created_at'])) $data['createdAt'] = $data['createdAt'] ?? isoDate($row['created_at']);
            if (isset($row['updated_at'])) $data['updatedAt'] = isoDate($row['updated_at']);
            return $data;
        }, $rows);
    }

    private function listCategories(): array { return $this->result($this->listSimpleEntities('categories'), 200, 300); }
    private function listCollections(): array { return $this->result($this->listSimpleEntities('collections'), 200, 300); }
    private function listAttributes(): array { return $this->result($this->listSimpleEntities('attributes'), 200, 300); }
    private function listBanners(): array { return $this->result($this->listSimpleEntities('banners'), 200, 120); }
    private function listCoupons(): array { return $this->result($this->listSimpleEntities('coupons', 'created_at DESC'), 200, 0); }

    private function createCategory(): array { return $this->saveSimpleEntity('categories', null, 'category'); }
    private function updateCategory(string $id): array { return $this->saveSimpleEntity('categories', $id, 'category'); }
    private function deleteCategory(string $id): array { return $this->deleteSimpleEntity('categories', $id, 'Category'); }
    private function createCollection(): array { return $this->saveSimpleEntity('collections', null, 'collection'); }
    private function updateCollection(string $id): array { return $this->saveSimpleEntity('collections', $id, 'collection'); }
    private function deleteCollection(string $id): array { return $this->deleteSimpleEntity('collections', $id, 'Collection'); }
    private function createAttribute(): array { return $this->saveSimpleEntity('attributes', null, 'attribute'); }
    private function updateAttribute(string $id): array { return $this->saveSimpleEntity('attributes', $id, 'attribute'); }
    private function deleteAttribute(string $id): array { return $this->deleteSimpleEntity('attributes', $id, 'Attribute'); }
    private function saveBanner(): array { return $this->saveSimpleEntity('banners', isset($this->body['id']) ? (string) $this->body['id'] : null, 'banner'); }
    private function updateBanner(string $id): array { return $this->saveSimpleEntity('banners', $id, 'banner'); }
    private function deleteBanner(string $id): array { return $this->deleteSimpleEntity('banners', $id, 'Banner'); }
    private function saveCoupon(): array { return $this->saveSimpleEntity('coupons', isset($this->body['id']) ? (string) $this->body['id'] : null, 'coupon'); }
    private function updateCoupon(string $id): array { return $this->saveSimpleEntity('coupons', $id, 'coupon'); }
    private function deleteCoupon(string $id): array { return $this->deleteSimpleEntity('coupons', $id, 'Coupon'); }

    private function saveSimpleEntity(string $table, ?string $id, string $prefix): array
    {
        $existing = $id ? $this->simpleEntity($table, $id) : null;
        if ($id && !$existing && !isset($this->body['id'])) throw new ApiException(ucfirst($prefix) . ' not found.', 404);
        $entity = $existing ? deepMerge($existing, $this->body) : $this->body;
        $id = $id ?: (string) ($entity['id'] ?? apiId($prefix));
        $entity['id'] = $id;
        $entity['createdAt'] = $entity['createdAt'] ?? isoDate();
        $entity['updatedAt'] = isoDate();

        if ($table === 'categories') {
            $name = trim((string) ($entity['name'] ?? ''));
            if ($name === '') throw new ApiException('Category name is required.', 422);
            $slug = slugify((string) ($entity['slug'] ?? $name));
            $stmt = $this->db->prepare('INSERT INTO categories (id,parent_id,name,slug,display_order,is_active,data) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE parent_id=VALUES(parent_id),name=VALUES(name),slug=VALUES(slug),display_order=VALUES(display_order),is_active=VALUES(is_active),data=VALUES(data)');
            $stmt->execute([$id, $entity['parentId'] ?? null, $name, $slug, (int) ($entity['displayOrder'] ?? 0), ($entity['isActive'] ?? true) ? 1 : 0, jsonForDb($entity)]);
        } elseif ($table === 'collections') {
            $name = trim((string) ($entity['name'] ?? $entity['title'] ?? ''));
            if ($name === '') throw new ApiException('Collection name is required.', 422);
            $stmt = $this->db->prepare('INSERT INTO collections (id,name,slug,display_order,is_active,assignment_type,rules_json,data) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),slug=VALUES(slug),display_order=VALUES(display_order),is_active=VALUES(is_active),assignment_type=VALUES(assignment_type),rules_json=VALUES(rules_json),data=VALUES(data)');
            $stmt->execute([$id, $name, slugify((string) ($entity['slug'] ?? $name)), (int) ($entity['displayOrder'] ?? 0), ($entity['isActive'] ?? true) ? 1 : 0, $entity['assignmentType'] ?? 'manual', jsonForDb($entity['rules'] ?? []), jsonForDb($entity)]);
        } elseif ($table === 'attributes') {
            $name = trim((string) ($entity['name'] ?? ''));
            $key = trim((string) ($entity['key'] ?? slugify($name)));
            if ($name === '' || $key === '') throw new ApiException('Attribute name and key are required.', 422);
            $stmt = $this->db->prepare('INSERT INTO attributes (id,attribute_key,name,display_order,is_active,data) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE attribute_key=VALUES(attribute_key),name=VALUES(name),display_order=VALUES(display_order),is_active=VALUES(is_active),data=VALUES(data)');
            $stmt->execute([$id, $key, $name, (int) ($entity['displayOrder'] ?? 0), ($entity['isActive'] ?? true) ? 1 : 0, jsonForDb($entity)]);
        } elseif ($table === 'banners') {
            $title = trim((string) ($entity['title'] ?? ''));
            if ($title === '') throw new ApiException('Banner title is required.', 422);
            $stmt = $this->db->prepare('INSERT INTO banners (id,title,display_order,is_active,starts_at,ends_at,data) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),display_order=VALUES(display_order),is_active=VALUES(is_active),starts_at=VALUES(starts_at),ends_at=VALUES(ends_at),data=VALUES(data)');
            $stmt->execute([$id, $title, (int) ($entity['displayOrder'] ?? 0), ($entity['isActive'] ?? $entity['active'] ?? true) ? 1 : 0, $this->sqlDate($entity['startDate'] ?? null), $this->sqlDate($entity['endDate'] ?? null), jsonForDb($entity)]);
        } elseif ($table === 'coupons') {
            $code = strtoupper(trim((string) ($entity['code'] ?? '')));
            $type = (string) ($entity['discountType'] ?? 'percentage');
            if ($code === '' || !in_array($type, ['percentage', 'flat'], true)) throw new ApiException('Coupon code and a valid discount type are required.', 422);
            $value = max(0, (float) ($entity['discountValue'] ?? 0));
            if ($type === 'percentage' && $value > 100) throw new ApiException('Percentage discount cannot exceed 100.', 422);
            $entity['code'] = $code;
            $stmt = $this->db->prepare('INSERT INTO coupons (id,code,discount_type,discount_value,min_order_amount,max_discount_amount,first_order_only,is_active,valid_until,usage_limit,usage_count,data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE code=VALUES(code),discount_type=VALUES(discount_type),discount_value=VALUES(discount_value),min_order_amount=VALUES(min_order_amount),max_discount_amount=VALUES(max_discount_amount),first_order_only=VALUES(first_order_only),is_active=VALUES(is_active),valid_until=VALUES(valid_until),usage_limit=VALUES(usage_limit),data=VALUES(data)');
            $stmt->execute([
                $id,
                $code,
                $type,
                $value,
                max(0, (float) ($entity['minOrderAmount'] ?? $entity['minOrderValue'] ?? 0)),
                isset($entity['maxDiscountAmount']) || isset($entity['maxDiscount'])
                    ? max(0, (float) ($entity['maxDiscountAmount'] ?? $entity['maxDiscount']))
                    : null,
                !empty($entity['firstOrderOnly']) ? 1 : 0,
                ($entity['isActive'] ?? $entity['active'] ?? true) ? 1 : 0,
                $this->sqlDate($entity['validUntil'] ?? $entity['expiryDate'] ?? null),
                isset($entity['usageLimit']) ? max(0, (int) $entity['usageLimit']) : null,
                max(0, (int) ($entity['usageCount'] ?? 0)),
                jsonForDb($entity),
            ]);
        } else {
            throw new LogicException('Unsupported entity table.');
        }
        $saved = $this->simpleEntity($table, $id) ?? $entity;
        $this->audit($prefix . ($existing ? '_update' : '_create'), ucfirst($prefix), $id, ($existing ? 'Updated ' : 'Created ') . $prefix, $existing, $saved);
        return $this->result($saved, $existing ? 200 : 201);
    }

    private function simpleEntity(string $table, string $id): ?array
    {
        $allowed = ['categories', 'collections', 'attributes', 'banners', 'coupons', 'size_groups', 'store_colors', 'size_guides'];
        if (!in_array($table, $allowed, true)) throw new LogicException('Invalid entity table.');
        $stmt = $this->db->prepare("SELECT * FROM {$table} WHERE id=? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $entity = jsonFromDb($row['data'], []);
        $entity['id'] = $row['id'];
        if (isset($row['created_at'])) $entity['createdAt'] = $entity['createdAt'] ?? isoDate($row['created_at']);
        if (isset($row['updated_at'])) $entity['updatedAt'] = isoDate($row['updated_at']);
        return $entity;
    }

    private function deleteSimpleEntity(string $table, string $id, string $type): array
    {
        $existing = $this->simpleEntity($table, $id);
        if (!$existing) throw new ApiException("{$type} not found.", 404);
        try {
            $this->db->prepare("DELETE FROM {$table} WHERE id=?")->execute([$id]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) throw new ApiException("{$type} is still referenced and cannot be deleted.", 409);
            throw $e;
        }
        $this->audit(strtolower($type) . '_delete', $type, $id, "Deleted {$type}", $existing, null);
        return $this->result(['success' => true]);
    }

    private function sqlDate(mixed $value): ?string
    {
        if (!$value) return null;
        try { return (new DateTimeImmutable((string) $value))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'); }
        catch (Throwable) { throw new ApiException('An invalid date value was supplied.', 422); }
    }

    private function reorderCategories(): array
    {
        $ids = $this->body['orderedIds'] ?? [];
        if (!is_array($ids)) throw new ApiException('orderedIds must be an array.', 422);
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('UPDATE categories SET display_order=? WHERE id=?');
            foreach (array_values(array_unique(array_map('strval', $ids))) as $index => $id) $stmt->execute([$index, $id]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
        $categories = $this->listCategories()[0];
        $this->audit('category_reorder', 'Category', 'all', 'Reordered categories', null, $ids);
        return $this->result(['success' => true, 'categories' => $categories]);
    }

    private function searchCatalog(): array
    {
        $query = trim((string) ($this->query['q'] ?? ''));
        if (mb_strlen($query) < 2) return $this->result(['products' => [], 'categories' => [], 'collections' => [], 'suggestions' => []]);
        $original = $this->query;
        $products = array_values(array_filter($this->listProducts()[0], fn($p) => str_contains(strtolower(implode(' ', [$p['name'] ?? '', $p['sku'] ?? '', $p['category'] ?? '', $p['fabric'] ?? '', $p['work'] ?? ''])), strtolower($query))));
        $categories = array_values(array_filter($this->listCategories()[0], fn($c) => str_contains(strtolower((string) ($c['name'] ?? '')), strtolower($query))));
        $collections = array_values(array_filter($this->listCollections()[0], fn($c) => str_contains(strtolower((string) ($c['name'] ?? $c['title'] ?? '')), strtolower($query))));
        $suggestions = array_values(array_unique(array_slice(array_map(fn($p) => $p['name'], $products), 0, 8)));
        return $this->result(['products' => array_slice($products, 0, 12), 'categories' => array_slice($categories, 0, 4), 'collections' => array_slice($collections, 0, 4), 'suggestions' => $suggestions], 200, 30);
    }

    private function getStoreSettings(): array
    {
        return $this->result($this->document('store', ['storeName' => 'Nandita Fashion', 'currencySymbol' => '₹', 'freeShippingThreshold' => 999, 'standardShippingFee' => 99, 'isCodEnabled' => true]), 200, 120);
    }

    private function updateStoreSettings(): array
    {
        $old = $this->document('store', []);
        $updated = deepMerge(is_array($old) ? $old : [], $this->body);
        $updated['lastUpdatedAt'] = isoDate();
        $this->saveDocument('store', $updated);
        $this->audit('settings_update', 'StoreBranding', 'store', 'Updated store settings', $old, $updated);
        return $this->result($updated);
    }

    private function getPaymentSettings(): array
    {
        return $this->result($this->document('payment', ['razorpayEnabled' => false, 'codEnabled' => true, 'upiDirectEnabled' => false, 'currency' => 'INR', 'currencySymbol' => '₹']));
    }

    private function updatePaymentSettings(): array
    {
        $old = $this->document('payment', []);
        $updated = deepMerge(is_array($old) ? $old : [], $this->body);
        unset($updated['razorpayKeySecret'], $updated['webhookSecret']);
        $this->saveDocument('payment', $updated);
        $this->audit('payment_settings_update', 'PaymentGatewayConfig', 'payment', 'Updated payment settings', $old, $updated);
        return $this->result($updated);
    }

    private function getShippingSettings(): array
    {
        return $this->result($this->shippingSettings());
    }

    private function shippingSettings(): array
    {
        return $this->document('shipping', ['freeShippingThreshold' => 999, 'standardShippingFee' => 99, 'expressShippingFee' => 199, 'expressAvailable' => true, 'codAvailable' => true, 'codFee' => 49, 'minCodOrderValue' => 499, 'maxCodOrderValue' => 15000, 'pincodeRuleMode' => 'all_india', 'serviceablePincodes' => [], 'blockedCodPincodes' => []]);
    }

    private function updateShippingSettings(): array
    {
        $old = $this->shippingSettings();
        $updated = deepMerge($old, $this->body);
        foreach (['freeShippingThreshold', 'standardShippingFee', 'expressShippingFee', 'codFee', 'minCodOrderValue', 'maxCodOrderValue'] as $key) {
            if (isset($updated[$key]) && (float) $updated[$key] < 0) throw new ApiException("{$key} cannot be negative.", 422);
        }
        $this->saveDocument('shipping', $updated);
        $this->audit('shipping_update', 'ShippingConfig', 'shipping', 'Updated shipping settings', $old, $updated);
        return $this->result($updated);
    }

    private function getNavigationMenu(): array { return $this->result($this->document('navigation_menu', []), 200, 120); }
    private function saveNavigationMenu(): array { $items = array_is_list($this->body) ? $this->body : ($this->body['items'] ?? []); $this->saveDocument('navigation_menu', $items); $this->audit('menu_update', 'Menu', 'navigation', 'Updated navigation menu', null, $items); return $this->result($items); }
    private function getAnnouncements(): array { return $this->result($this->document('announcements', []), 200, 60); }
    private function saveAnnouncements(): array { $items = array_is_list($this->body) ? $this->body : ($this->body['items'] ?? []); $this->saveDocument('announcements', $items); $this->audit('cms_update', 'CMS', 'announcements', 'Updated announcements', null, $items); return $this->result($items); }
    private function getHomepageSections(): array { return $this->result($this->document('homepage_sections', []), 200, 60); }
    private function saveHomepageSections(): array { $items = array_is_list($this->body) ? $this->body : ($this->body['items'] ?? []); $this->saveDocument('homepage_sections', $items); $this->audit('cms_update', 'CMS', 'homepage', 'Updated homepage sections', null, $items); return $this->result($items); }
}
