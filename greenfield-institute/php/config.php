<?php
declare(strict_types=1);

$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        putenv($line);
        $_ENV[substr($line, 0, strpos($line, '='))] = substr($line, strpos($line, '=') + 1);
    }
}

$dbUrl = getenv('DATABASE_URL');
if (!$dbUrl) {
    http_response_code(500);
    die('DATABASE_URL environment variable is not set.');
}
$parts = parse_url($dbUrl);
define('DB_HOST', $parts['host'] ?? '');
define('DB_PORT', (string)($parts['port'] ?? ''));
define('DB_NAME', ltrim($parts['path'] ?? '', '/'));
define('DB_USER', $parts['user'] ?? '');
define('DB_PASS', $parts['pass'] ?? '');

date_default_timezone_set('America/New_York');

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
