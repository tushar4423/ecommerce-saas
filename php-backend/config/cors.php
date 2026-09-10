<?php
/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 */

return [
    'allowed_origins' => ['*'], // In production, specify exact client domains
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'If-None-Match'
    ],
    'exposed_headers' => ['ETag', 'X-Total-Count', 'X-Cache'],
    'max_age'         => 86400, // 24 hours pre-flight caching to reduce OPTIONS traffic by 90%
    'supports_credentials' => false,
];
