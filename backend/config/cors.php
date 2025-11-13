<?php
// config/cors.php

return [

    'paths' => [
        'api/*',
        'login',
        'logout',
        'sanctum/csrf-cookie',
        'user',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        // Production URLs
        'https://mysol360.com',
        'http://mysol360.com',
        'https://hrm.mysol360.com',

        // Development URLs (only in development)
        env('APP_ENV') === 'local' ? 'http://192.168.1.118:3000' : null,
        env('APP_ENV') === 'local' ? 'http://192.168.1.118:3001' : null,
        env('APP_ENV') === 'local' ? 'http://localhost:3000' : null,
        env('APP_ENV') === 'local' ? 'http://localhost:3001' : null,
        env('APP_ENV') === 'local' ? 'http://127.0.0.1:3000' : null,
        env('APP_ENV') === 'local' ? 'http://127.0.0.1:3001' : null,

        // Dynamic frontend URL from environment
        env('FRONTEND_URL'),
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // This is crucial for session-based auth
];
