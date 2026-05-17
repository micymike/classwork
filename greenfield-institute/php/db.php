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
                if (DB_DRIVER === 'sqlite') {
                    self::$instance = new PDO('sqlite:' . DB_SQLITE_PATH);
                    self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                    self::$instance->exec('PRAGMA journal_mode=WAL');
                    self::$instance->exec('PRAGMA foreign_keys=ON');
                    self::initSqliteSchema();
                } else {
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
                        if (!file_exists($caPath)) {
                            $caPath = openssl_get_cert_locations()['default_cert_file'];
                        }
                        $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
                        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                    }

                    self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
                }
            } catch (PDOException $e) {
                error_log('DB CONNECTION ERROR: ' . $e->getMessage());
                http_response_code(500);
                header('Content-Type: application/json');
                die(json_encode([
                    'error' => 'Database connection failed: ' . $e->getMessage()
                ]));
            }
        }
        return self::$instance;
    }

    private static function initSqliteSchema(): void
    {
        $schemaFile = __DIR__ . '/../database/schema-sqlite.sql';
        if (!file_exists($schemaFile)) {
            return;
        }
        $stmt = self::$instance->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        if ($stmt->fetch()) {
            return;
        }
        $sql = file_get_contents($schemaFile);
        self::$instance->exec($sql);
    }
}
