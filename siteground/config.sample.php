<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'YOUR_DATABASE_NAME',
        'user' => 'YOUR_DATABASE_USER',
        'pass' => 'YOUR_DATABASE_PASSWORD',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'base_url' => 'https://example.com',
        'session_name' => 'precision_reels_admin',
        'upload_dir' => __DIR__ . '/uploads',
        'upload_url' => '/uploads',
        'max_upload_bytes' => 8 * 1024 * 1024,
        'max_images_per_listing' => 8,
        'inquiry_recipient' => 'seller@example.com',
    ],
];
