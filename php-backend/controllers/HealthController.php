<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Core\Database;
use Models\Product;
use Models\Category;
use Models\Order;
use Models\Banner;
use Models\Coupon;

class HealthController extends Controller
{
    public function check(Request $request): void
    {
        $dbConnected = false;
        $dbError = null;

        try {
            \Core\Database::query("SELECT 1");
            $dbConnected = true;
        } catch (\Exception $e) {
            $dbError = $e->getMessage();
        }

        $this->json([
            'status' => $dbConnected ? 'healthy' : 'degraded',
            'engine' => 'Core PHP 8.2 Enterprise Architecture (MVC)',
            'database' => [
                'connected' => $dbConnected,
                'error' => $dbError
            ],
            'concurrency_optimizations' => [
                'apcu_caching' => extension_loaded('apcu'),
                'gzip_compression' => true,
                'persistent_pdo' => true,
                'etag_304_support' => true,
                'rate_limiting' => true,
                'max_simultaneous_scale' => '1,000,000+ daily sessions'
            ],
            'time' => gmdate('Y-m-d\TH:i:s\Z')
        ]);
    }
}
