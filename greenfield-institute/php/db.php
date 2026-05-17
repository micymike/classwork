<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                    DB_HOST,
                    DB_PORT,
                    DB_NAME
                );

                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];

                $sslRequired = getenv('DB_SSL') === 'true';
                if (!$sslRequired) {
                    $query = parse_url((string)getenv('DATABASE_URL'), PHP_URL_QUERY);
                    $sslRequired = $query && str_contains($query, 'ssl-mode=REQUIRED');
                }

                if ($sslRequired) {
                    $caPath = __DIR__ . '/ca.pem';
                    $options[PDO::MYSQL_ATTR_SSL_CA] = file_exists($caPath) ? $caPath : true;
                    $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                }

                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                die(json_encode([
                    'error' => 'Database connection failed: ' . $e->getMessage()
                ]));
            }
        }
        return self::$instance;
    }
}
