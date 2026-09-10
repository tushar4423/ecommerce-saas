<?php

declare(strict_types=1);

trait GiniApiTrait
{
    private function giniConfig(): array
    {
        $config = $this->publishedGiniConfig();
        return $this->result($this->publicGiniConfig($config), 200, 30);
    }

    private function publishedGiniConfig(): array
    {
        $stmt = $this->db->query("SELECT config FROM gini_config_versions WHERE status='published' ORDER BY version DESC LIMIT 1");
        $config = $stmt->fetchColumn();
        if ($config !== false) {
            return jsonFromDb($config, []);
        }
        return [
            'state' => 'on',
            'assistantName' => 'Gini',
            'greeting' => 'Namaste! I am Gini, your shopping assistant. What are you looking for today?',
            'hindiGreeting' => 'नमस्ते! मैं गिनी हूँ। आज आप क्या खरीदना चाहेंगे?',
            'supportedLanguages' => ['en-IN', 'hi-IN'],
            'defaultLanguage' => 'en-IN',
            'speakingRate' => 1,
            'version' => 1,
        ];
    }

    private function publicGiniConfig(array $config): array
    {
        unset($config['internalPrompt'], $config['apiKey'], $config['secrets']);
        return $config;
    }

    private function createGiniSession(): array
    {
        $config = $this->publishedGiniConfig();
        if (in_array($config['state'] ?? 'on', ['off', 'paused', 'maintenance'], true)) {
            throw new ApiException('Gini is temporarily unavailable.', 503);
        }
        $sessionId = apiId('gini-session');
        $customerId = trim((string) ($this->body['customerId'] ?? ''));
        if ($customerId !== '') {
            $this->ensureUser($customerId);
        }
        $locale = (string) ($this->body['locale'] ?? $config['defaultLanguage'] ?? 'en-IN');
        $context = [
            'deviceType' => $this->body['deviceType'] ?? 'unknown',
            'ipHash' => hash('sha256', $this->clientIp() . (string) envValue('APP_KEY', 'vedaaya')),
        ];
        $stmt = $this->db->prepare('INSERT INTO gini_sessions (id,user_id,channel,status,locale,context) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$sessionId, $customerId ?: null, $this->body['channel'] ?? 'text', 'active', $locale, jsonForDb($context)]);
        return $this->result(['success' => true, 'sessionId' => $sessionId, 'locale' => $locale, 'startedAt' => isoDate()], 201);
    }

    private function deleteGiniSession(string $sessionId): array
    {
        $stmt = $this->db->prepare("UPDATE gini_sessions SET status='ended',ended_at=UTC_TIMESTAMP() WHERE id=?");
        $stmt->execute([$sessionId]);
        if (!$stmt->rowCount()) {
            throw new ApiException('Gini session not found.', 404);
        }
        return $this->result(['success' => true]);
    }

    private function giniTurn(): array
    {
        $this->enforceRateLimit('gini-turn', 60, 60);
        $sessionId = trim((string) ($this->body['sessionId'] ?? ''));
        $transcript = trim((string) ($this->body['transcript'] ?? $this->body['message'] ?? ''));
        if ($sessionId === '' || $transcript === '') {
            throw new ApiException('sessionId and transcript are required.', 422);
        }
        $session = $this->giniSessionRow($sessionId);
        if (!$session || $session['status'] !== 'active') {
            throw new ApiException('Gini session is not active.', 404);
        }
        $config = $this->publishedGiniConfig();
        if (($config['state'] ?? 'on') !== 'on') {
            throw new ApiException('Gini is temporarily paused.', 503);
        }

        $started = hrtime(true);
        $userTurnId = apiId('gini-turn');
        $this->db->prepare('INSERT INTO gini_turns (id,session_id,role,message,data) VALUES (?,?,\'customer\',?,?)')
            ->execute([$userTurnId, $sessionId, $transcript, jsonForDb($this->body['context'] ?? [])]);
        $result = $this->interpretGiniText($transcript, $this->body['context'] ?? [], (string) ($this->body['language'] ?? $session['locale']));
        $latency = (int) round((hrtime(true) - $started) / 1_000_000);
        $assistantTurnId = apiId('gini-turn');
        $turnData = deepMerge($result, ['latencyMs' => $latency]);
        $this->db->prepare('INSERT INTO gini_turns (id,session_id,role,message,intent,data,latency_ms) VALUES (?,?,\'gini\',?,?,?,?)')
            ->execute([$assistantTurnId, $sessionId, $result['speechResponse'], $result['intent'], jsonForDb($turnData), $latency]);
        $this->db->prepare('UPDATE gini_sessions SET context=? WHERE id=?')->execute([jsonForDb($this->body['context'] ?? []), $sessionId]);
        return $this->result(deepMerge($result, ['turnId' => $assistantTurnId, 'sessionId' => $sessionId, 'latencyMs' => $latency]));
    }

    private function giniSessionRow(string $sessionId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM gini_sessions WHERE id=? LIMIT 1');
        $stmt->execute([$sessionId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    private function interpretGiniText(string $text, array $context = [], string $language = 'en-IN'): array
    {
        $normalized = mb_strtolower(trim($text));
        $parameters = [];
        $action = 'search_products';
        $intent = 'catalog_search';
        $policy = 'allowed';
        $chips = ['Show cotton kurtis', 'Festive collection', 'Open size guide', 'View my cart'];

        if (preg_match('/\b(cart|bag|basket)\b/u', $normalized) && preg_match('/\b(open|show|view|देख|खोल)\b/u', $normalized)) {
            $action = 'navigate_route';
            $intent = 'view_cart';
            $parameters = ['route' => '/cart'];
        } elseif (preg_match('/\b(checkout|payment|pay|चेकआउट|भुगतान)\b/u', $normalized)) {
            $action = 'open_checkout';
            $intent = 'checkout';
            $parameters = ['route' => '/checkout'];
        } elseif (preg_match('/\b(size|fit|measurement|नाप|साइज़)\b/u', $normalized)) {
            $action = 'open_size_guide';
            $intent = 'size_help';
            $parameters = ['productId' => $context['selectedProduct']['id'] ?? null];
        } elseif (preg_match('/\b(remove|delete)\b.*\b(cart|bag)\b/u', $normalized)) {
            $action = 'remove_cart_item';
            $intent = 'remove_cart_item';
            $policy = 'requires_confirmation';
            $parameters = ['productId' => $context['selectedProduct']['id'] ?? null];
        } elseif (preg_match('/\b(place|confirm)\b.*\border\b/u', $normalized)) {
            $action = 'place_order';
            $intent = 'place_order';
            $policy = 'requires_confirmation';
            $parameters = ['paymentMethod' => str_contains($normalized, 'cash') || str_contains($normalized, 'cod') ? 'cod' : 'online'];
        } else {
            $parameters['query'] = $text;
            if (preg_match('/(?:under|below|less than|तक)\s*(?:₹|rs\.?|rupees?)?\s*([0-9,]+)/u', $normalized, $match)) {
                $parameters['maxPrice'] = (float) str_replace(',', '', $match[1]);
            }
            foreach (['cotton', 'linen', 'silk', 'rayon', 'georgette'] as $fabric) {
                if (str_contains($normalized, $fabric)) $parameters['fabric'] = ucfirst($fabric);
            }
            foreach (['red', 'blue', 'green', 'pink', 'black', 'white', 'yellow', 'maroon'] as $color) {
                if (str_contains($normalized, $color)) $parameters['color'] = ucfirst($color);
            }
            foreach (['kurti', 'kurta', 'saree', 'anarkali', 'dress', 'shirt'] as $category) {
                if (str_contains($normalized, $category)) $parameters['category'] = $category;
            }
        }

        $suggestedProducts = [];
        if ($action === 'search_products') {
            $products = $this->listProducts()[0];
            $suggestedProducts = array_values(array_filter($products, function (array $product) use ($parameters): bool {
                if (isset($parameters['maxPrice']) && (float) ($product['sellingPrice'] ?? 0) > (float) $parameters['maxPrice']) return false;
                if (isset($parameters['fabric']) && strcasecmp((string) ($product['fabric'] ?? ''), (string) $parameters['fabric']) !== 0) return false;
                if (isset($parameters['color'])) {
                    $hasColor = array_filter($product['variants'] ?? [], fn(array $variant) => strcasecmp((string) ($variant['color'] ?? ''), (string) $parameters['color']) === 0);
                    if (!$hasColor) return false;
                }
                if (isset($parameters['category'])) {
                    $haystack = strtolower(implode(' ', [$product['name'] ?? '', $product['category'] ?? '', $product['subcategory'] ?? '']));
                    if (!str_contains($haystack, strtolower((string) $parameters['category']))) return false;
                }
                return true;
            }));
            $suggestedProducts = array_slice($suggestedProducts, 0, 8);
        }

        $speech = match ($intent) {
            'view_cart' => 'Opening your shopping bag now.',
            'checkout' => 'Taking you to checkout. Please review the server-calculated total before paying.',
            'size_help' => 'Opening the size and fit guide. Add your measurements for a personalized recommendation.',
            'remove_cart_item' => 'Please confirm that you want to remove this item from your bag.',
            'place_order' => 'Please confirm the items, delivery address, payment method, and final total before placing the order.',
            default => count($suggestedProducts)
                ? 'I found ' . count($suggestedProducts) . ' matching options. Here are the best results.'
                : 'I could not find an exact match. Try a fabric, color, category, or price range.',
        };
        if ($language === 'hi-IN') {
            $speech = count($suggestedProducts)
                ? 'मुझे ' . count($suggestedProducts) . ' विकल्प मिले हैं। सबसे अच्छे परिणाम ये हैं।'
                : 'मैं आपकी मदद के लिए तैयार हूँ। कृपया रंग, कपड़ा, श्रेणी या कीमत बताइए।';
        }

        $pending = null;
        if ($policy === 'requires_confirmation') {
            $pending = $this->createGiniConfirmation($context['sessionId'] ?? null, $action, $parameters);
        }
        return [
            'success' => true,
            'intent' => $intent,
            'speechResponse' => $speech,
            'hindiSpeechResponse' => $language === 'hi-IN' ? $speech : null,
            'proposedAction' => $action,
            'parameters' => $parameters,
            'policyResult' => $policy,
            'pendingConfirmation' => $pending,
            'suggestedProducts' => $suggestedProducts,
            'suggestedChips' => $chips,
            'executionResult' => ['success' => true, 'data' => ['suggestedProducts' => $suggestedProducts]],
        ];
    }

    private function createGiniConfirmation(?string $sessionId, string $action, array $parameters): ?array
    {
        $sessionId = $sessionId ?: (string) ($this->body['sessionId'] ?? '');
        if ($sessionId === '') return null;
        $id = apiId('gini-confirm');
        $expires = gmdate('Y-m-d H:i:s', time() + 10 * 60);
        $stmt = $this->db->prepare('INSERT INTO gini_confirmations (id,session_id,action_name,parameters,status,expires_at) VALUES (?,?,?,?,\'pending\',?)');
        $stmt->execute([$id, $sessionId, $action, jsonForDb($parameters), $expires]);
        return ['id' => $id, 'actionId' => $action, 'parameters' => $parameters, 'status' => 'pending', 'expiresAt' => isoDate($expires)];
    }

    private function resolveGiniConfirmation(string $id): array
    {
        $decision = (string) ($this->body['decision'] ?? 'rejected');
        if (!in_array($decision, ['confirmed', 'rejected'], true)) {
            throw new ApiException('decision must be confirmed or rejected.', 422);
        }
        $stmt = $this->db->prepare("SELECT * FROM gini_confirmations WHERE id=? AND status='pending' AND expires_at>UTC_TIMESTAMP() LIMIT 1");
        $stmt->execute([$id]);
        $confirmation = $stmt->fetch();
        if (!$confirmation) {
            throw new ApiException('Confirmation is missing, expired, or already resolved.', 409);
        }
        $this->db->prepare('UPDATE gini_confirmations SET status=?,resolved_at=UTC_TIMESTAMP() WHERE id=?')->execute([$decision, $id]);
        return $this->result([
            'success' => true,
            'decision' => $decision,
            'executionResult' => [
                'success' => $decision === 'confirmed',
                'action' => $confirmation['action_name'],
                'parameters' => jsonFromDb($confirmation['parameters'], []),
            ],
        ]);
    }

    private function giniFeedback(): array
    {
        $id = apiId('gini-feedback');
        $sessionId = trim((string) ($this->body['sessionId'] ?? ''));
        $turnId = trim((string) ($this->body['turnId'] ?? ''));
        $rating = isset($this->body['rating']) ? (int) $this->body['rating'] : null;
        $stmt = $this->db->prepare('INSERT INTO gini_feedback (id,session_id,turn_id,rating,data) VALUES (?,?,?,?,?)');
        $stmt->execute([$id, $sessionId ?: null, $turnId ?: null, $rating, jsonForDb($this->body)]);
        return $this->result(['success' => true, 'id' => $id], 201);
    }

    private function giniTextToSpeech(): array
    {
        $key = trim((string) envValue('GOOGLE_CLOUD_API_KEY', ''));
        $text = trim((string) ($this->body['text'] ?? ''));
        if ($key === '' || $text === '') {
            throw new ApiException('Cloud text-to-speech is not configured; browser speech remains available.', 503);
        }
        $language = (string) ($this->body['language'] ?? 'en-IN');
        $payload = [
            'input' => ['text' => mb_substr($text, 0, 4500)],
            'voice' => ['languageCode' => $language, 'name' => $this->body['voiceName'] ?? ($language === 'hi-IN' ? 'hi-IN-Wavenet-A' : 'en-IN-Wavenet-A')],
            'audioConfig' => ['audioEncoding' => 'MP3', 'speakingRate' => min(2, max(0.5, (float) ($this->body['speakingRate'] ?? 1)))],
        ];
        $response = $this->httpJson('https://texttospeech.googleapis.com/v1/text:synthesize?key=' . rawurlencode($key), 'POST', $payload);
        if (($response['status'] ?? 500) !== 200 || empty($response['body']['audioContent'])) {
            throw new ApiException('Cloud text-to-speech request failed.', 502);
        }
        return $this->result(['success' => true, 'audioBase64' => $response['body']['audioContent'], 'audioContentType' => 'audio/mpeg']);
    }

    private function giniSpeechToText(): array
    {
        $key = trim((string) envValue('GOOGLE_CLOUD_API_KEY', ''));
        $audio = trim((string) ($this->body['audioBase64'] ?? ''));
        if ($key === '' || $audio === '') {
            throw new ApiException('Cloud speech-to-text is not configured; browser recognition remains available.', 503);
        }
        $payload = [
            'config' => [
                'languageCode' => $this->body['language'] ?? 'en-IN',
                'alternativeLanguageCodes' => ['hi-IN'],
                'enableAutomaticPunctuation' => true,
            ],
            'audio' => ['content' => preg_replace('#^data:[^;]+;base64,#', '', $audio)],
        ];
        $response = $this->httpJson('https://speech.googleapis.com/v1/speech:recognize?key=' . rawurlencode($key), 'POST', $payload);
        if (($response['status'] ?? 500) !== 200) {
            throw new ApiException('Cloud speech recognition failed.', 502);
        }
        $transcript = '';
        foreach ($response['body']['results'] ?? [] as $result) {
            $transcript .= ($result['alternatives'][0]['transcript'] ?? '') . ' ';
        }
        return $this->result(['success' => true, 'transcript' => trim($transcript)]);
    }

    private function giniAudioTurn(): array
    {
        $speech = $this->giniSpeechToText()[0];
        $payload = $this->body;
        $payload['transcript'] = $speech['transcript'];
        $result = $this->interpretGiniText((string) $payload['transcript'], $payload['context'] ?? [], (string) ($payload['language'] ?? 'en-IN'));
        return $this->result(deepMerge($result, ['transcript' => $speech['transcript']]));
    }

    private function giniVisionTurn(): array
    {
        $sessionId = trim((string) ($this->body['sessionId'] ?? ''));
        $prompt = trim((string) ($this->body['prompt'] ?? $this->body['transcript'] ?? 'Find products similar to this image'));
        if ($sessionId === '' && isset($this->body['sessionId'])) {
            throw new ApiException('A valid sessionId is required.', 422);
        }
        $result = $this->interpretGiniText($prompt, $this->body['context'] ?? [], (string) ($this->body['language'] ?? 'en-IN'));
        $result['intent'] = 'visual_search';
        $result['speechResponse'] = 'I can use your description to search the catalog. For image understanding, configure the server vision model key.';
        return $this->result($result);
    }

    private function giniChirpInfo(): array
    {
        return $this->result([
            'configured' => trim((string) envValue('GOOGLE_CLOUD_API_KEY', '')) !== '',
            'speechToText' => 'Google Cloud Speech-to-Text',
            'textToSpeech' => 'Google Cloud Text-to-Speech',
            'browserFallbackAvailable' => true,
        ]);
    }

    private function adminGiniSettings(): array
    {
        $draft = $this->db->query("SELECT config FROM gini_config_versions WHERE status='draft' ORDER BY version DESC LIMIT 1")->fetchColumn();
        $settings = $draft !== false ? jsonFromDb($draft, []) : $this->publishedGiniConfig();
        $rows = $this->db->query('SELECT version,status,config,created_at,published_at FROM gini_config_versions ORDER BY version DESC')->fetchAll();
        $versions = array_map(fn(array $row) => [
            'version' => (int) $row['version'],
            'status' => $row['status'],
            'settings' => jsonFromDb($row['config'], []),
            'createdAt' => isoDate($row['created_at']),
            'publishedAt' => $row['published_at'] ? isoDate($row['published_at']) : null,
        ], $rows);
        return $this->result(['settings' => $settings, 'versions' => $versions]);
    }

    private function updateAdminGiniSettings(): array
    {
        $current = $this->adminGiniSettings()[0]['settings'];
        $settings = deepMerge($current, $this->body);
        $version = max(1, (int) ($settings['version'] ?? $current['version'] ?? 1));
        $settings['version'] = $version;
        $stmt = $this->db->prepare(
            "INSERT INTO gini_config_versions (version,status,config,created_by) VALUES (?,'draft',?,?)
             ON DUPLICATE KEY UPDATE status='draft',config=VALUES(config),created_by=VALUES(created_by)"
        );
        $stmt->execute([$version, jsonForDb($settings), $this->admin['id']]);
        $this->audit('gini_settings_update', 'GiniSettings', (string) $version, 'Updated Gini draft settings', $current, $settings);
        return $this->result(['success' => true, 'settings' => $settings]);
    }

    private function publishGiniSettings(): array
    {
        $draftRow = $this->db->query("SELECT * FROM gini_config_versions WHERE status='draft' ORDER BY version DESC LIMIT 1")->fetch();
        $current = $draftRow ? jsonFromDb($draftRow['config'], []) : $this->publishedGiniConfig();
        $nextVersion = max((int) ($current['version'] ?? 0) + 1, (int) $this->db->query('SELECT COALESCE(MAX(version),0)+1 FROM gini_config_versions')->fetchColumn());
        $current['version'] = $nextVersion;
        $current['releaseNote'] = $this->body['releaseNote'] ?? "Published version {$nextVersion}";
        $this->db->beginTransaction();
        try {
            $this->db->exec("UPDATE gini_config_versions SET status='archived' WHERE status='published'");
            $this->db->prepare("INSERT INTO gini_config_versions (version,status,config,created_by,published_at) VALUES (?,'published',?,?,UTC_TIMESTAMP())")
                ->execute([$nextVersion, jsonForDb($current), $this->admin['id']]);
            if ($draftRow) {
                $this->db->prepare("UPDATE gini_config_versions SET status='archived' WHERE id=?")->execute([$draftRow['id']]);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
        return $this->result(['success' => true, 'version' => $nextVersion, 'settings' => $current], 201);
    }

    private function rollbackGiniSettings(): array
    {
        $target = filter_var($this->body['targetVersion'] ?? null, FILTER_VALIDATE_INT);
        if ($target === false) throw new ApiException('A valid targetVersion is required.', 422);
        $stmt = $this->db->prepare('SELECT config FROM gini_config_versions WHERE version=?');
        $stmt->execute([$target]);
        $config = $stmt->fetchColumn();
        if ($config === false) throw new ApiException('Gini configuration version not found.', 404);
        $restored = jsonFromDb($config, []);
        $restored['version'] = (int) $this->db->query('SELECT COALESCE(MAX(version),0)+1 FROM gini_config_versions')->fetchColumn();
        $this->db->beginTransaction();
        try {
            $this->db->exec("UPDATE gini_config_versions SET status='archived' WHERE status='published'");
            $this->db->prepare("INSERT INTO gini_config_versions (version,status,config,created_by,published_at) VALUES (?,'published',?,?,UTC_TIMESTAMP())")
                ->execute([$restored['version'], jsonForDb($restored), $this->admin['id']]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
        return $this->result(['success' => true, 'version' => $restored['version'], 'settings' => $restored]);
    }

    private function testGini(): array
    {
        $text = trim((string) ($this->body['utterance'] ?? ''));
        if ($text === '') throw new ApiException('A test utterance is required.', 422);
        $result = $this->interpretGiniText($text, $this->body['mockContext'] ?? []);
        return $this->result(['success' => true, 'dryRunResult' => $result]);
    }

    private function giniAnalytics(): array
    {
        $summary = $this->db->query(
            'SELECT COUNT(*) total_sessions,
                    SUM(status=\'active\') active_sessions,
                    AVG(TIMESTAMPDIFF(SECOND,started_at,COALESCE(ended_at,last_activity_at))) avg_duration
             FROM gini_sessions'
        )->fetch();
        $turns = $this->db->query(
            "SELECT COUNT(*) turns,AVG(latency_ms) latency,
                    SUM(JSON_UNQUOTE(JSON_EXTRACT(data,'$.policyResult'))='requires_confirmation') confirmations
             FROM gini_turns WHERE role='gini'"
        )->fetch();
        $feedback = $this->db->query('SELECT AVG(rating) average_rating,COUNT(*) count FROM gini_feedback')->fetch();
        return $this->result([
            'totalSessions' => (int) $summary['total_sessions'],
            'activeSessions' => (int) $summary['active_sessions'],
            'averageSessionDurationSeconds' => round((float) ($summary['avg_duration'] ?? 0), 2),
            'totalTurns' => (int) $turns['turns'],
            'averageLatencyMs' => round((float) ($turns['latency'] ?? 0), 2),
            'confirmationsRequested' => (int) ($turns['confirmations'] ?? 0),
            'averageFeedbackRating' => round((float) ($feedback['average_rating'] ?? 0), 2),
            'feedbackCount' => (int) $feedback['count'],
        ]);
    }

    private function adminGiniSessions(): array
    {
        $rows = $this->db->query(
            'SELECT s.*,COUNT(t.id) turn_count FROM gini_sessions s LEFT JOIN gini_turns t ON t.session_id=s.id
             GROUP BY s.id ORDER BY s.started_at DESC LIMIT 500'
        )->fetchAll();
        return $this->result(array_map(fn(array $row) => [
            'id' => $row['id'], 'customerId' => $row['user_id'], 'channel' => $row['channel'],
            'status' => $row['status'], 'locale' => $row['locale'], 'context' => jsonFromDb($row['context'], []),
            'turnCount' => (int) $row['turn_count'], 'startedAt' => isoDate($row['started_at']),
            'endedAt' => $row['ended_at'] ? isoDate($row['ended_at']) : null,
            'lastActivityAt' => isoDate($row['last_activity_at']),
        ], $rows));
    }

    private function pauseGini(): array
    {
        $config = $this->publishedGiniConfig();
        $config['state'] = !empty($this->body['pause']) ? 'paused' : 'on';
        $version = (int) $this->db->query('SELECT COALESCE(MAX(version),0)+1 FROM gini_config_versions')->fetchColumn();
        $config['version'] = $version;
        $this->db->beginTransaction();
        try {
            $this->db->exec("UPDATE gini_config_versions SET status='archived' WHERE status='published'");
            $this->db->prepare("INSERT INTO gini_config_versions (version,status,config,created_by,published_at) VALUES (?,'published',?,?,UTC_TIMESTAMP())")
                ->execute([$version, jsonForDb($config), $this->admin['id']]);
            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
        return $this->result(['success' => true, 'state' => $config['state']]);
    }
}
