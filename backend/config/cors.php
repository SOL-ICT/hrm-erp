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

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001', // if you're using a different port
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // This is crucial for session-based auth
];
