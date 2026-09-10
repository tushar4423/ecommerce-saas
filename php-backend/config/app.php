<?php
/**
 * Application Configuration
 * High-performance configuration with environment detection and cache TTL settings.
 */

return [
    'app_name' => 'Vedaaya Ethnic & Festive API',
    'version'  => '2.0.0',
    'env'      => getenv('APP_ENV') ?: 'production', // 'development' | 'production'
    'debug'    => getenv('APP_DEBUG') === 'true',
    
    // Base URL configuration
    'base_url' => getenv('APP_URL') ?: '',
    'api_prefix' => '/api',

    // Caching Strategy for High Concurrency (1 Million+ Users)
    'cache' => [
        'enabled'      => true,
        'driver'       => extension_loaded('apcu') ? 'apcu' : (extension_loaded('redis') ? 'redis' : 'file'),
        'default_ttl'  => 300,        // 5 minutes for general endpoints
        'products_ttl' => 600,        // 10 minutes for product listings
        'settings_ttl' => 3600,       // 1 hour for store branding/settings
        'banners_ttl'  => 1800,       // 30 minutes for hero banners
        'categories_ttl' => 3600,     // 1 hour for category tree
        'file_cache_dir' => sys_get_temp_dir() . '/vedaaya_cache',
    ],

    // Security & Rate Limiting (Token bucket / IP throttle)
    'rate_limit' => [
        'enabled'        => true,
        'max_requests'   => 300,      // Max requests per window
        'window_seconds' => 60,       // Window size in seconds (300 req / min per IP)
    ],

    // Pagination defaults
    'pagination' => [
        'default_limit' => 24,
        'max_limit'     => 100,
    ]
];
