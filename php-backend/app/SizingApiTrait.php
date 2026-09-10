<?php

declare(strict_types=1);

trait SizingApiTrait
{
    private function listSizeGroups(): array
    {
        $groups = $this->listSimpleEntities('size_groups', 'is_default DESC,name');
        return $this->result($groups, 200, 300);
    }

    private function createSizeGroup(): array
    {
        return $this->saveSizeGroup(null);
    }

    private function updateSizeGroup(string $id): array
    {
        return $this->saveSizeGroup($id);
    }

    private function saveSizeGroup(?string $id): array
    {
        $existing = $id ? $this->simpleEntity('size_groups', $id) : null;
        if ($id && !$existing) {
            throw new ApiException('Size group not found.', 404);
        }
        $group = $existing ? deepMerge($existing, $this->body) : $this->body;
        $id = $id ?: (string) ($group['id'] ?? apiId('size-group'));
        $name = trim((string) ($group['name'] ?? ''));
        $sizes = array_values(array_unique(array_filter(array_map('strval', $group['sizes'] ?? []))));
        if ($name === '' || !$sizes) {
            throw new ApiException('Size group name and at least one size are required.', 422);
        }
        $group = deepMerge($group, [
            'id' => $id,
            'name' => $name,
            'sizes' => $sizes,
            'isActive' => $group['isActive'] ?? true,
            'createdAt' => $group['createdAt'] ?? isoDate(),
        ]);

        $this->db->beginTransaction();
        try {
            if (!empty($group['isDefault'])) {
                $this->db->exec('UPDATE size_groups SET is_default=0');
            }
            $stmt = $this->db->prepare(
                'INSERT INTO size_groups (id,name,is_default,is_active,data) VALUES (?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE name=VALUES(name),is_default=VALUES(is_default),is_active=VALUES(is_active),data=VALUES(data)'
            );
            $stmt->execute([
                $id,
                $name,
                !empty($group['isDefault']) ? 1 : 0,
                !empty($group['isActive']) ? 1 : 0,
                jsonForDb($group),
            ]);
            $this->db->prepare('DELETE FROM size_group_values WHERE size_group_id=?')->execute([$id]);
            $insert = $this->db->prepare('INSERT INTO size_group_values (size_group_id,size_value,display_order) VALUES (?,?,?)');
            foreach ($sizes as $order => $size) {
                $insert->execute([$id, $size, $order]);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
        $this->audit($existing ? 'size_group_update' : 'size_group_create', 'SizeGroup', $id, ($existing ? 'Updated' : 'Created') . ' size group', $existing, $group);
        return $this->result($group, $existing ? 200 : 201);
    }

    private function deleteSizeGroup(string $id): array
    {
        return $this->deleteSimpleEntity('size_groups', $id, 'SizeGroup');
    }

    private function listColors(): array
    {
        return $this->result($this->listSimpleEntities('store_colors'), 200, 300);
    }

    private function createColor(): array
    {
        return $this->saveColor(null);
    }

    private function updateColor(string $id): array
    {
        return $this->saveColor($id);
    }

    private function saveColor(?string $id): array
    {
        $existing = $id ? $this->simpleEntity('store_colors', $id) : null;
        if ($id && !$existing) {
            throw new ApiException('Color not found.', 404);
        }
        $color = $existing ? deepMerge($existing, $this->body) : $this->body;
        $id = $id ?: (string) ($color['id'] ?? apiId('color'));
        $name = trim((string) ($color['name'] ?? ''));
        $hex = strtoupper(trim((string) ($color['hex'] ?? '')));
        if ($name === '' || !preg_match('/^#[0-9A-F]{6}$/', $hex)) {
            throw new ApiException('Color name and a six-digit hex value are required.', 422);
        }
        $color = deepMerge($color, [
            'id' => $id,
            'name' => $name,
            'hex' => $hex,
            'isActive' => $color['isActive'] ?? true,
            'createdAt' => $color['createdAt'] ?? isoDate(),
        ]);
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO store_colors (id,name,hex,display_order,is_active,data) VALUES (?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE name=VALUES(name),hex=VALUES(hex),display_order=VALUES(display_order),is_active=VALUES(is_active),data=VALUES(data)'
            );
            $stmt->execute([
                $id,
                $name,
                $hex,
                (int) ($color['order'] ?? 0),
                !empty($color['isActive']) ? 1 : 0,
                jsonForDb($color),
            ]);
        } catch (PDOException $e) {
            if ((int) $e->getCode() === 23000) {
                throw new ApiException('A color with that name already exists.', 409);
            }
            throw $e;
        }
        $this->audit($existing ? 'color_update' : 'color_create', 'StoreColor', $id, ($existing ? 'Updated' : 'Created') . ' store color', $existing, $color);
        return $this->result($color, $existing ? 200 : 201);
    }

    private function deleteColor(string $id): array
    {
        return $this->deleteSimpleEntity('store_colors', $id, 'StoreColor');
    }

    private function listSizeGuides(): array
    {
        return $this->result($this->listSimpleEntities('size_guides', 'is_default DESC,updated_at DESC'), 200, 120);
    }

    private function createSizeGuide(): array
    {
        return $this->saveSizeGuide(null);
    }

    private function updateSizeGuide(string $id): array
    {
        return $this->saveSizeGuide($id);
    }

    private function saveSizeGuide(?string $id): array
    {
        $existing = $id ? $this->simpleEntity('size_guides', $id) : null;
        if ($id && !$existing) {
            throw new ApiException('Size guide not found.', 404);
        }
        $guide = $existing ? deepMerge($existing, $this->body) : $this->body;
        $id = $id ?: (string) ($guide['id'] ?? apiId('size-guide'));
        $title = trim((string) ($guide['title'] ?? ''));
        $measurementType = (string) ($guide['measurementType'] ?? 'garment');
        $precedence = (string) ($guide['precedenceLevel'] ?? 'default');
        if ($title === '' || !in_array($measurementType, ['garment', 'body'], true) || !in_array($precedence, ['product', 'collection', 'category', 'default'], true)) {
            throw new ApiException('A title, valid measurement type, and valid precedence level are required.', 422);
        }
        if (!is_array($guide['measurements'] ?? null) || !$guide['measurements']) {
            throw new ApiException('At least one measurement row is required.', 422);
        }
        $version = $existing ? ((int) ($existing['version'] ?? 1) + 1) : 1;
        $guide = deepMerge($guide, [
            'id' => $id,
            'title' => $title,
            'measurementType' => $measurementType,
            'precedenceLevel' => $precedence,
            'version' => $version,
            'isActive' => $guide['isActive'] ?? true,
            'createdAt' => $guide['createdAt'] ?? isoDate(),
            'updatedAt' => isoDate(),
        ]);

        $this->db->beginTransaction();
        try {
            if (!empty($guide['isDefault'])) {
                $this->db->exec('UPDATE size_guides SET is_default=0');
            }
            $stmt = $this->db->prepare(
                'INSERT INTO size_guides (id,title,measurement_type,precedence_level,version,is_default,is_active,data)
                 VALUES (?,?,?,?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE title=VALUES(title),measurement_type=VALUES(measurement_type),precedence_level=VALUES(precedence_level),version=VALUES(version),is_default=VALUES(is_default),is_active=VALUES(is_active),data=VALUES(data)'
            );
            $stmt->execute([
                $id,
                $title,
                $measurementType,
                $precedence,
                $version,
                !empty($guide['isDefault']) ? 1 : 0,
                !empty($guide['isActive']) ? 1 : 0,
                jsonForDb($guide),
            ]);
            $versionStmt = $this->db->prepare(
                'INSERT INTO size_guide_versions (size_guide_id,version,snapshot,created_by,change_summary) VALUES (?,?,?,?,?)'
            );
            $versionStmt->execute([
                $id,
                $version,
                jsonForDb($guide),
                $this->admin['name'] ?? 'administrator',
                (string) ($this->body['changeSummary'] ?? ($existing ? 'Updated size guide' : 'Created size guide')),
            ]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
        $this->sizeFitAudit($existing ? 'update_guide' : 'create_guide', $id, $title, $existing, $guide);
        return $this->result($guide, $existing ? 200 : 201);
    }

    private function deleteSizeGuide(string $id): array
    {
        $guide = $this->simpleEntity('size_guides', $id);
        if (!$guide) {
            throw new ApiException('Size guide not found.', 404);
        }
        $this->db->prepare('DELETE FROM size_guides WHERE id=?')->execute([$id]);
        $this->sizeFitAudit('delete_guide', $id, (string) ($guide['title'] ?? $id), $guide, null);
        return $this->result(['success' => true]);
    }

    private function sizeGuideVersions(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM size_guide_versions WHERE size_guide_id=? ORDER BY version DESC');
        $stmt->execute([$id]);
        $versions = array_map(fn(array $row) => [
            'version' => (int) $row['version'],
            'sizeGuideId' => $row['size_guide_id'],
            'timestamp' => isoDate($row['created_at']),
            'createdBy' => $row['created_by'],
            'changeSummary' => $row['change_summary'],
            'snapshot' => jsonFromDb($row['snapshot'], []),
        ], $stmt->fetchAll());
        return $this->result(['success' => true, 'versions' => $versions]);
    }

    private function rollbackSizeGuide(string $id): array
    {
        $target = filter_var($this->body['targetVersion'] ?? null, FILTER_VALIDATE_INT);
        if ($target === false || $target < 1) {
            throw new ApiException('A valid targetVersion is required.', 422);
        }
        $stmt = $this->db->prepare('SELECT snapshot FROM size_guide_versions WHERE size_guide_id=? AND version=?');
        $stmt->execute([$id, $target]);
        $snapshot = $stmt->fetchColumn();
        if ($snapshot === false) {
            throw new ApiException('Target size guide version not found.', 404);
        }
        $current = $this->simpleEntity('size_guides', $id);
        if (!$current) {
            throw new ApiException('Size guide not found.', 404);
        }
        $restored = jsonFromDb($snapshot, []);
        $this->bodyForSizing = deepMerge($restored, ['changeSummary' => "Rolled back to version {$target}"]);
        $saved = $this->persistSizeGuidePayload($id, $current, $this->bodyForSizing);
        $this->sizeFitAudit('rollback_guide', $id, (string) ($saved['title'] ?? $id), $current, $saved);
        return $this->result(['success' => true, 'restoredGuide' => $saved]);
    }

    private array $bodyForSizing = [];

    private function persistSizeGuidePayload(string $id, array $existing, array $payload): array
    {
        $version = (int) ($existing['version'] ?? 1) + 1;
        $payload['id'] = $id;
        $payload['version'] = $version;
        $payload['updatedAt'] = isoDate();
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('UPDATE size_guides SET title=?,measurement_type=?,precedence_level=?,version=?,is_default=?,is_active=?,data=? WHERE id=?');
            $stmt->execute([
                $payload['title'],
                $payload['measurementType'] ?? 'garment',
                $payload['precedenceLevel'] ?? 'default',
                $version,
                !empty($payload['isDefault']) ? 1 : 0,
                !empty($payload['isActive']) ? 1 : 0,
                jsonForDb($payload),
                $id,
            ]);
            $this->db->prepare('INSERT INTO size_guide_versions (size_guide_id,version,snapshot,created_by,change_summary) VALUES (?,?,?,?,?)')
                ->execute([$id, $version, jsonForDb($payload), $this->admin['name'] ?? 'administrator', $payload['changeSummary'] ?? 'Rolled back size guide']);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
        return $payload;
    }

    private function sizeGuideConflicts(): array
    {
        $guides = $this->listSimpleEntities('size_guides', 'precedence_level,title');
        $conflicts = [];
        for ($i = 0; $i < count($guides); $i++) {
            if (empty($guides[$i]['isActive'])) continue;
            for ($j = $i + 1; $j < count($guides); $j++) {
                if (empty($guides[$j]['isActive']) || ($guides[$i]['precedenceLevel'] ?? '') !== ($guides[$j]['precedenceLevel'] ?? '')) continue;
                $scopeKey = match ($guides[$i]['precedenceLevel'] ?? 'default') {
                    'product' => 'productIds',
                    'collection' => 'collectionIds',
                    'category' => 'categoryIds',
                    default => null,
                };
                $overlap = $scopeKey === null
                    ? (!empty($guides[$i]['isDefault']) && !empty($guides[$j]['isDefault']) ? ['default'] : [])
                    : array_values(array_intersect($guides[$i][$scopeKey] ?? [], $guides[$j][$scopeKey] ?? []));
                if ($overlap) {
                    $conflicts[] = [
                        'guideA' => ['id' => $guides[$i]['id'], 'title' => $guides[$i]['title']],
                        'guideB' => ['id' => $guides[$j]['id'], 'title' => $guides[$j]['title']],
                        'precedenceLevel' => $guides[$i]['precedenceLevel'],
                        'overlappingScopes' => $overlap,
                    ];
                }
            }
        }
        return $this->result(['success' => true, 'totalConflicts' => count($conflicts), 'conflicts' => $conflicts]);
    }

    private function getWidgetSettings(): array
    {
        $defaults = [
            'buttonText' => 'Smart Size & Fit Assistant',
            'buttonColorStyle' => 'primary_crimson',
            'placement' => 'above_size_selector',
            'layoutMode' => 'modal',
            'mobileBehavior' => 'bottom_sheet',
            'defaultUnit' => 'inches',
            'showConfidenceScores' => true,
            'showOutOfStockTradeOffs' => true,
            'enableGuestStorage' => true,
            'requireExplicitConsent' => true,
        ];
        return $this->result($this->document('size_widget', $defaults), 200, 300);
    }

    private function updateWidgetSettings(): array
    {
        $old = $this->getWidgetSettings()[0];
        $settings = deepMerge($old, $this->body);
        $this->saveDocument('size_widget', $settings);
        $this->sizeFitAudit('update_widget_settings', 'size_widget', 'Size widget settings', $old, $settings);
        return $this->result(['success' => true, 'settings' => $settings]);
    }

    private function sizeFitPermissions(): array
    {
        $permissions = [
            ['key' => 'size_fit_create', 'label' => 'Create size guides', 'description' => 'Create draft size guides.', 'rolesAllowed' => ['super_admin','admin','content_manager']],
            ['key' => 'size_fit_edit', 'label' => 'Edit size guides', 'description' => 'Edit measurements and rules.', 'rolesAllowed' => ['super_admin','admin','content_manager']],
            ['key' => 'size_fit_publish', 'label' => 'Publish size guides', 'description' => 'Make size guides live.', 'rolesAllowed' => ['super_admin','admin']],
            ['key' => 'size_fit_rollback', 'label' => 'Rollback size guides', 'description' => 'Restore a previous version.', 'rolesAllowed' => ['super_admin','admin']],
            ['key' => 'size_fit_import_export', 'label' => 'Import or export', 'description' => 'Move size-guide data.', 'rolesAllowed' => ['super_admin','admin']],
            ['key' => 'size_fit_analytics', 'label' => 'View fit analytics', 'description' => 'View recommendation and override data.', 'rolesAllowed' => ['super_admin','admin']],
            ['key' => 'size_fit_customer_data', 'label' => 'Customer fit data', 'description' => 'Export or remove consented fit profiles.', 'rolesAllowed' => ['super_admin']],
        ];
        return $this->result(['success' => true, 'permissions' => $permissions]);
    }

    private function fitRecommendation(): array
    {
        return $this->result($this->recommendSize($this->body));
    }

    private function recommendSize(array $request): array
    {
        $unit = (string) ($request['unit'] ?? 'inches');
        $convert = fn(mixed $value): ?float => is_numeric($value) ? ((float) $value / ($unit === 'cm' ? 2.54 : 1)) : null;
        $body = [
            'bust' => $convert($request['bodyBust'] ?? $request['bust'] ?? null),
            'waist' => $convert($request['bodyWaist'] ?? $request['waist'] ?? null),
            'hip' => $convert($request['bodyHip'] ?? $request['hip'] ?? null),
            'shoulder' => $convert($request['bodyShoulder'] ?? $request['shoulder'] ?? null),
        ];
        if ($body['bust'] === null && $body['waist'] === null && $body['hip'] === null) {
            return [
                'recommendedSize' => null,
                'confidenceScore' => 0,
                'confidenceLevel' => 'Insufficient Information',
                'explanation' => 'Add at least one body measurement to receive a recommendation.',
                'guideUsed' => ['id' => '', 'title' => '', 'type' => 'garment', 'precedenceLevel' => 'default'],
                'measurementBreakdown' => ['easeApplied' => 0],
                'isConfident' => false,
                'safeCustomerMessage' => 'Please add your bust, waist, or hip measurement.',
            ];
        }

        $guides = array_values(array_filter($this->listSimpleEntities('size_guides', 'updated_at DESC'), fn(array $guide) => !empty($guide['isActive'])));
        $product = !empty($request['productId']) ? $this->findProduct((string) $request['productId']) : null;
        usort($guides, function (array $a, array $b) use ($request, $product): int {
            return $this->guideScore($b, $request, $product) <=> $this->guideScore($a, $request, $product);
        });
        $guide = $guides[0] ?? null;
        if (!$guide) {
            throw new ApiException('No active size guide is configured.', 404);
        }

        $guideUnit = (string) ($guide['unitDefault'] ?? 'inches');
        $rowFactor = $guideUnit === 'cm' ? 1 / 2.54 : 1;
        $preference = (string) ($request['preferredFit'] ?? 'regular');
        $ease = (float) ($guide['easeAllowanceInches'] ?? match ($preference) { 'snug' => 1, 'relaxed' => 3, default => 2 });
        $rows = $guide['measurements'] ?? [];
        $chosen = null;
        $previous = null;
        foreach ($rows as $row) {
            if (!is_array($row) || empty($row['size'])) continue;
            $fits = true;
            foreach (['bust', 'waist', 'hip'] as $field) {
                if ($body[$field] !== null && isset($row[$field])) {
                    $required = $body[$field] + (($guide['measurementType'] ?? 'garment') === 'garment' ? $ease : 0);
                    if ((float) $row[$field] * $rowFactor < $required) {
                        $fits = false;
                    }
                }
            }
            if ($fits) {
                $chosen = $row;
                break;
            }
            $previous = $row;
        }
        if (!$chosen && $rows) {
            $chosen = end($rows);
        }
        $size = is_array($chosen) ? (string) ($chosen['size'] ?? '') : '';
        $diffs = [];
        foreach (['bust', 'waist', 'hip'] as $field) {
            if ($body[$field] !== null && isset($chosen[$field])) {
                $diffs[$field . 'Diff'] = round((float) $chosen[$field] * $rowFactor - $body[$field], 2);
            }
        }
        $minimumDiff = $diffs ? min($diffs) : 0;
        $confidence = max(35, min(98, 92 - abs($minimumDiff - $ease) * 8));
        $level = $confidence >= 80 ? 'High' : ($confidence >= 60 ? 'Medium' : 'Low');
        $between = $previous && $minimumDiff < $ease + 0.75;

        $stockTradeOff = null;
        if ($product) {
            $stockForSize = array_sum(array_map(fn(array $variant) => ($variant['size'] ?? '') === $size ? (int) ($variant['stock'] ?? 0) : 0, $product['variants'] ?? []));
            if ($stockForSize <= 0) {
                $alternatives = [];
                foreach ($product['variants'] ?? [] as $variant) {
                    if ((int) ($variant['stock'] ?? 0) > 0) {
                        $alternatives[$variant['size']] = ($alternatives[$variant['size']] ?? 0) + (int) $variant['stock'];
                    }
                }
                $stockTradeOff = [
                    'isRecommendedOutOfStock' => true,
                    'recommendedSize' => $size,
                    'alternativeSizes' => array_map(fn($alternative, $stock) => ['size' => $alternative, 'stock' => $stock, 'fitType' => 'relaxed', 'chestEaseDiff' => 0, 'tradeOffExplanation' => "{$alternative} is available but may fit differently.", 'isSuggested' => true], array_keys($alternatives), array_values($alternatives)),
                    'notifyMeAvailable' => true,
                ];
            }
        }
        return [
            'recommendedSize' => $size ?: null,
            'confidenceScore' => round($confidence),
            'confidenceLevel' => $level,
            'explanation' => "Size {$size} best matches the supplied measurements with approximately {$ease} inches of fit allowance.",
            'guideUsed' => ['id' => $guide['id'], 'title' => $guide['title'], 'type' => $guide['measurementType'], 'precedenceLevel' => $guide['precedenceLevel']],
            'betweenSizesWarning' => $between ? ['isBetween' => true, 'lowerSize' => (string) ($previous['size'] ?? ''), 'upperSize' => $size, 'advice' => $preference === 'snug' ? 'Choose the lower size for a close fit.' : 'Choose the upper size for comfort.'] : null,
            'outOfStockTradeOff' => $stockTradeOff,
            'measurementBreakdown' => deepMerge($diffs, ['easeApplied' => $ease]),
            'conflictWarnings' => [],
            'isConfident' => $confidence >= 60,
            'safeCustomerMessage' => "We recommend size {$size}. Please compare it with the garment chart before ordering.",
        ];
    }

    private function guideScore(array $guide, array $request, ?array $product): int
    {
        $level = (string) ($guide['precedenceLevel'] ?? 'default');
        if ($level === 'product' && in_array((string) ($request['productId'] ?? ''), $guide['productIds'] ?? [], true)) return 400;
        if ($level === 'collection' && $product && array_intersect($product['collections'] ?? [], $guide['collectionIds'] ?? [])) return 300;
        if ($level === 'category' && $product && (in_array((string) ($product['category'] ?? ''), $guide['categoryIds'] ?? [], true) || in_array((string) ($product['category'] ?? ''), $guide['categoryNames'] ?? [], true))) return 200;
        return $level === 'default' || !empty($guide['isDefault']) ? 100 : 0;
    }

    private function boundaryTestSuite(): array
    {
        return $this->result($this->document('size_boundary_tests', []));
    }

    private function runBoundaryTests(): array
    {
        $tests = $this->body['testCases'] ?? $this->document('size_boundary_tests', []);
        if (!is_array($tests)) {
            throw new ApiException('testCases must be an array.', 422);
        }
        $results = [];
        foreach ($tests as $test) {
            $start = hrtime(true);
            $measurements = $test['inputMeasurements'] ?? [];
            $response = $this->recommendSize([
                'bodyBust' => $measurements['bust'] ?? null,
                'bodyWaist' => $measurements['waist'] ?? null,
                'bodyHip' => $measurements['hip'] ?? null,
                'unit' => $measurements['unit'] ?? 'inches',
                'preferredFit' => $test['preferredFit'] ?? 'regular',
            ]);
            $passed = ($response['recommendedSize'] ?? null) === ($test['expectedRecommendedSize'] ?? null)
                && ($response['confidenceLevel'] ?? null) === ($test['expectedConfidenceLevel'] ?? null)
                && !empty($response['betweenSizesWarning']) === !empty($test['expectedBetweenSizeFlag']);
            $results[] = [
                'testId' => $test['id'] ?? apiId('test'),
                'testName' => $test['name'] ?? 'Boundary test',
                'passed' => $passed,
                'actualSize' => $response['recommendedSize'],
                'expectedSize' => $test['expectedRecommendedSize'] ?? null,
                'actualConfidence' => $response['confidenceScore'],
                'actualConfidenceLevel' => $response['confidenceLevel'],
                'isBetweenDetected' => !empty($response['betweenSizesWarning']),
                'notes' => $passed ? 'Passed' : 'Recommendation differed from the expected result.',
                'executionTimeMs' => round((hrtime(true) - $start) / 1_000_000, 3),
            ];
        }
        $passed = count(array_filter($results, fn(array $result) => $result['passed']));
        $total = count($results);
        return $this->result(['success' => true, 'totalTests' => $total, 'passedCount' => $passed, 'failedCount' => $total - $passed, 'passRate' => $total ? round($passed / $total * 100, 2) : 100, 'results' => $results]);
    }

    private function getFitProfile(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $stmt = $this->db->prepare('SELECT * FROM fit_profiles WHERE user_id=? AND (expires_at IS NULL OR expires_at>UTC_TIMESTAMP())');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $this->result(['success' => true, 'profile' => $row ? jsonFromDb($row['data'], []) : null]);
    }

    private function saveFitProfile(): array
    {
        $userId = trim((string) ($this->body['userId'] ?? ''));
        if ($this->optionalAdmin() === null) {
            $customer = $this->requireCustomer();
            $userId = (string) $customer['id'];
        }
        if ($userId === '' || empty($this->body['hasConsented'])) {
            throw new ApiException('A user ID and explicit measurement-storage consent are required.', 422);
        }
        $this->ensureUser($userId, (string) ($this->body['email'] ?? ''), (string) ($this->body['name'] ?? 'Customer'));
        $retention = (int) ($this->body['retentionDays'] ?? 90);
        if (!in_array($retention, [30, 90, 365, -1], true)) {
            throw new ApiException('retentionDays must be 30, 90, 365, or -1.', 422);
        }
        $profile = deepMerge($this->body, ['userId' => $userId, 'createdAt' => $this->body['createdAt'] ?? isoDate(), 'updatedAt' => isoDate()]);
        $expires = $retention === -1 ? null : gmdate('Y-m-d H:i:s', time() + $retention * 86400);
        $stmt = $this->db->prepare(
            'INSERT INTO fit_profiles (user_id,has_consented,retention_days,data,expires_at) VALUES (?,?,?,?,?)
             ON DUPLICATE KEY UPDATE has_consented=VALUES(has_consented),retention_days=VALUES(retention_days),data=VALUES(data),expires_at=VALUES(expires_at)'
        );
        $stmt->execute([$userId, 1, $retention, jsonForDb($profile), $expires]);
        return $this->result(['success' => true, 'profile' => $profile]);
    }

    private function deleteFitProfile(string $userId): array
    {
        $this->authorizeCustomerResource($userId);
        $this->db->prepare('DELETE FROM fit_profiles WHERE user_id=?')->execute([$userId]);
        $this->sizeFitAudit('delete_customer_profile', $userId, 'Customer fit profile', null, null);
        return $this->result(['success' => true]);
    }

    private function exportFitProfile(string $userId): array
    {
        $profile = $this->getFitProfile($userId)[0]['profile'];
        $this->sizeFitAudit('export_customer_data', $userId, 'Customer fit profile', null, null);
        return $this->result(['success' => true, 'exportedAt' => isoDate(), 'profile' => $profile]);
    }

    private function sizeFitAuditLogs(): array
    {
        $rows = $this->db->query('SELECT data FROM size_fit_audit_logs ORDER BY created_at DESC LIMIT 1000')->fetchAll();
        return $this->result(array_map(fn(array $row) => jsonFromDb($row['data'], []), $rows));
    }

    private function sizeFitAudit(string $action, string $entityId, string $entityName, mixed $old, mixed $new): void
    {
        $id = apiId('sfa');
        $payload = [
            'id' => $id,
            'timestamp' => isoDate(),
            'actorId' => $this->admin['id'] ?? 'system',
            'actorName' => $this->admin['name'] ?? 'System',
            'actorRole' => $this->admin['role'] ?? 'system',
            'action' => $action,
            'entityId' => $entityId,
            'entityName' => $entityName,
            'previousValue' => $old,
            'newValue' => $new,
            'diffSummary' => str_replace('_', ' ', ucfirst($action)),
        ];
        $stmt = $this->db->prepare('INSERT INTO size_fit_audit_logs (id,action,entity_id,actor_id,data) VALUES (?,?,?,?,?)');
        $stmt->execute([$id, $action, $entityId, $this->admin['id'] ?? null, jsonForDb($payload)]);
    }

    private function logSizeOverride(): array
    {
        $this->requireFields(['productId', 'recommendedSize', 'chosenSize']);
        if (!$this->findProduct((string) $this->body['productId'])) {
            throw new ApiException('Product not found.', 404);
        }
        $userId = trim((string) ($this->body['userId'] ?? ''));
        if ($this->bearerToken() !== null && $this->optionalAdmin() === null) {
            $customer = $this->requireCustomer();
            $userId = (string) $customer['id'];
        } elseif ($userId !== '' && $this->optionalAdmin() === null) {
            throw new ApiException('Sign in before linking fit analytics to a customer account.', 401);
        }
        $id = apiId('override');
        $payload = deepMerge($this->body, [
            'id' => $id,
            'userId' => $userId ?: null,
            'timestamp' => isoDate(),
        ]);
        $stmt = $this->db->prepare('INSERT INTO size_override_analytics (id,product_id,user_id,recommended_size,chosen_size,confidence_score,data) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([$id, $this->body['productId'], $userId ?: null, $this->body['recommendedSize'], $this->body['chosenSize'], (float) ($this->body['confidenceScore'] ?? 0), jsonForDb($payload)]);
        return $this->result(['success' => true]);
    }

    private function sizeOverrideAnalytics(): array
    {
        $rows = $this->db->query('SELECT data FROM size_override_analytics ORDER BY created_at DESC LIMIT 2000')->fetchAll();
        return $this->result(array_map(fn(array $row) => jsonFromDb($row['data'], []), $rows));
    }
}
