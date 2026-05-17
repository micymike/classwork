<?php
declare(strict_types=1);

header('Content-Type: application/json');

session_start();
require_once __DIR__ . '/db.php';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json_response(mixed $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_input(): array
{
    $raw = file_get_contents('php://input');
    $parsed = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $parsed = $_POST;
    }
    return $parsed ?? [];
}

function require_auth(): array
{
    if (!isset($_SESSION['user_id'])) {
        json_response(['error' => 'Authentication required'], 401);
    }
    try {
        $stmt = Database::getConnection()->prepare(
            'SELECT id, username, email, full_name, role, current_streak, longest_streak FROM users WHERE id = ?'
        );
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if (!$user) {
            session_destroy();
            json_response(['error' => 'User not found'], 401);
        }
        return $user;
    } catch (Exception $e) {
        json_response(['error' => 'Server error'], 500);
    }
}

function require_admin(): array
{
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        json_response(['error' => 'Administrator privileges required'], 403);
    }
    return $user;
}

function update_streak(PDO $db, int $userId): array
{
    $stmt = $db->prepare(
        'SELECT current_streak, longest_streak, last_active_date FROM users WHERE id = ?'
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    $today     = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    if ($user['last_active_date'] === null) {
        $currentStreak = 1;
    } elseif ($user['last_active_date'] === $today) {
        return [
            'current_streak' => (int)$user['current_streak'],
            'longest_streak' => (int)$user['longest_streak'],
        ];
    } elseif ($user['last_active_date'] === $yesterday) {
        $currentStreak = (int)$user['current_streak'] + 1;
    } else {
        $currentStreak = 1;
    }

    $longestStreak = max($currentStreak, (int)$user['longest_streak']);

    $stmt = $db->prepare(
        'UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?'
    );
    $stmt->execute([$currentStreak, $longestStreak, $today, $userId]);

    return [
        'current_streak' => $currentStreak,
        'longest_streak' => $longestStreak,
    ];
}

// ---------------------------------------------------------------------------
// Request routing
// ---------------------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'];
$input  = get_input();
$action = $input['action'] ?? $_GET['action'] ?? '';

try {
    $db = Database::getConnection();

    switch ($action) {

        // ---- Authentication -------------------------------------------------

        case 'login':
            $username = trim($input['username'] ?? '');
            $password = $input['password'] ?? '';

            if ($username === '' || $password === '') {
                json_response(['error' => 'Username and password are required.'], 400);
            }

            $stmt = $db->prepare(
                'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1'
            );
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                json_response(['error' => 'Invalid username or password.'], 401);
            }

            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$user['id'];

            $streak = update_streak($db, (int)$user['id']);

            json_response([
                'success' => true,
                'user'    => [
                    'id'             => $user['id'],
                    'username'       => $user['username'],
                    'full_name'      => $user['full_name'],
                    'email'          => $user['email'],
                    'role'           => $user['role'],
                    'current_streak' => $streak['current_streak'],
                    'longest_streak' => $streak['longest_streak'],
                ],
            ]);
            break;

        case 'register':
            $username  = trim($input['username'] ?? '');
            $email     = trim($input['email'] ?? '');
            $password  = $input['password'] ?? '';
            $full_name = trim($input['full_name'] ?? '');

            if ($username === '' || $email === '' || $password === '' || $full_name === '') {
                json_response(['error' => 'All fields are required.'], 400);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_response(['error' => 'Invalid email address.'], 400);
            }
            if (strlen($password) < 8) {
                json_response(['error' => 'Password must be at least 8 characters.'], 400);
            }
            if (!preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username)) {
                json_response([
                    'error' => 'Username must be 3–50 characters using only letters, numbers, and underscores.'
                ], 400);
            }

            $stmt = $db->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                json_response(['error' => 'Username or email is already taken.'], 409);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

            $stmt = $db->prepare(
                'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([$username, $email, $hash, $full_name, 'student']);

            $userId = (int)$db->lastInsertId();
            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;

            json_response([
                'success' => true,
                'user'    => [
                    'id'        => $userId,
                    'username'  => $username,
                    'full_name' => $full_name,
                    'email'     => $email,
                    'role'      => 'student',
                ],
            ], 201);
            break;

        case 'logout':
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params['path'],
                    $params['domain'],
                    $params['secure'],
                    $params['httponly']
                );
            }
            session_destroy();
            json_response(['success' => true]);
            break;

        case 'get_session':
            if (isset($_SESSION['user_id'])) {
                $user = require_auth();
                json_response(['authenticated' => true, 'user' => $user]);
            } else {
                json_response(['authenticated' => false]);
            }
            break;

        // ---- Courses (student) ----------------------------------------------

        case 'get_courses':
            $search  = trim($input['search'] ?? $_GET['search'] ?? '');
            $page    = max(1, (int)($input['page'] ?? $_GET['page'] ?? 1));
            $perPage = max(1, min(50, (int)($input['per_page'] ?? $_GET['per_page'] ?? 6)));
            $offset  = ($page - 1) * $perPage;

            $countSql = 'SELECT COUNT(*) FROM courses WHERE status = ?';
            $dataSql  = 'SELECT * FROM courses WHERE status = ?';
            $params   = ['active'];

            if ($search !== '') {
                $searchSql = ' AND (title LIKE ? OR code LIKE ? OR instructor LIKE ? OR description LIKE ?)';
                $term      = "%{$search}%";
                $countSql .= $searchSql;
                $dataSql  .= $searchSql;
                $params    = array_merge($params, [$term, $term, $term, $term]);
            }

            $stmt = $db->prepare($countSql);
            $stmt->execute($params);
            $total = (int)$stmt->fetchColumn();
            $pages = max(1, (int)ceil($total / $perPage));

            $dataSql .= ' ORDER BY code ASC LIMIT ? OFFSET ?';
            $stmt     = $db->prepare($dataSql);
            $stmt->execute(array_merge($params, [$perPage, $offset]));

            json_response([
                'courses' => $stmt->fetchAll(),
                'total'   => $total,
                'pages'   => $pages,
                'page'    => $page,
            ]);
            break;

        case 'get_course':
            $user = require_auth();
            $id = (int)($input['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                json_response(['error' => 'Course ID is required.'], 400);
            }
            $stmt = $db->prepare('SELECT * FROM courses WHERE id = ?');
            $stmt->execute([$id]);
            $course = $stmt->fetch();
            if (!$course) {
                json_response(['error' => 'Course not found.'], 404);
            }

            // Get enrollment data if enrolled
            $regData = null;
            $stmt = $db->prepare(
                'SELECT id AS reg_id, notes FROM registrations WHERE user_id = ? AND course_id = ? AND status = ?'
            );
            $stmt->execute([$user['id'], $id, 'enrolled']);
            $regData = $stmt->fetch();

            $streak = update_streak($db, (int)$user['id']);
            json_response([
                'course' => $course,
                'streak' => $streak,
                'enrollment' => $regData,
            ]);
            break;

        case 'get_streak':
            $user = require_auth();
            $streak = update_streak($db, (int)$user['id']);
            json_response($streak);
            break;

        // ---- Courses (admin) ------------------------------------------------

        case 'get_all_courses':
            require_admin();
            $search  = trim($input['search'] ?? $_GET['search'] ?? '');
            $page    = max(1, (int)($input['page'] ?? $_GET['page'] ?? 1));
            $perPage = max(1, min(100, (int)($input['per_page'] ?? $_GET['per_page'] ?? 8)));
            $offset  = ($page - 1) * $perPage;

            $countSql = 'SELECT COUNT(*) FROM courses';
            $dataSql  = 'SELECT * FROM courses';
            $params   = [];

            if ($search !== '') {
                $searchSql = ' WHERE (code LIKE ? OR title LIKE ? OR instructor LIKE ?)';
                $term      = "%{$search}%";
                $countSql .= $searchSql;
                $dataSql  .= $searchSql;
                $params    = [$term, $term, $term];
            }

            $stmt = $db->prepare($countSql);
            $stmt->execute($params);
            $total = (int)$stmt->fetchColumn();
            $pages = max(1, (int)ceil($total / $perPage));

            $dataSql .= ' ORDER BY code ASC LIMIT ? OFFSET ?';
            $stmt     = $db->prepare($dataSql);
            $stmt->execute(array_merge($params, [$perPage, $offset]));

            json_response([
                'courses' => $stmt->fetchAll(),
                'total'   => $total,
                'pages'   => $pages,
                'page'    => $page,
            ]);
            break;

        case 'add_course':
            require_admin();
            $code        = strtoupper(trim($input['code'] ?? ''));
            $title       = trim($input['title'] ?? '');
            $description = trim($input['description'] ?? '');
            $instructor  = trim($input['instructor'] ?? '');
            $capacity    = max(1, (int)($input['capacity'] ?? 30));
            $schedule    = trim($input['schedule'] ?? '');
            $credits     = max(1, (int)($input['credits'] ?? 3));

            if ($code === '' || $title === '' || $instructor === '' || $schedule === '') {
                json_response(['error' => 'Code, title, instructor, and schedule are required.'], 400);
            }

            $stmt = $db->prepare('SELECT id FROM courses WHERE code = ?');
            $stmt->execute([$code]);
            if ($stmt->fetch()) {
                json_response(['error' => 'A course with this code already exists.'], 409);
            }

            $stmt = $db->prepare(
                'INSERT INTO courses (code, title, description, instructor, capacity, schedule, credits)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$code, $title, $description, $instructor, $capacity, $schedule, $credits]);

            json_response([
                'success'   => true,
                'message'   => "Course {$code} has been created.",
                'course_id' => (int)$db->lastInsertId(),
            ], 201);
            break;

        case 'update_course':
            require_admin();
            $id          = (int)($input['id'] ?? 0);
            $title       = trim($input['title'] ?? '');
            $description = trim($input['description'] ?? '');
            $instructor  = trim($input['instructor'] ?? '');
            $capacity    = max(1, (int)($input['capacity'] ?? 30));
            $schedule    = trim($input['schedule'] ?? '');
            $credits     = max(1, (int)($input['credits'] ?? 3));
            $status      = in_array($input['status'] ?? '', ['active', 'inactive'], true)
                ? $input['status']
                : 'active';

            if ($id <= 0 || $title === '' || $instructor === '' || $schedule === '') {
                json_response(['error' => 'All required fields must be provided.'], 400);
            }

            $stmt = $db->prepare(
                'UPDATE courses
                    SET title = ?, description = ?, instructor = ?, capacity = ?,
                        schedule = ?, credits = ?, status = ?
                  WHERE id = ?'
            );
            $stmt->execute([$title, $description, $instructor, $capacity, $schedule, $credits, $status, $id]);

            if ($stmt->rowCount() === 0) {
                json_response(['error' => 'Course not found or no changes were made.'], 404);
            }

            json_response(['success' => true, 'message' => 'Course updated successfully.']);
            break;

        case 'delete_course':
            require_admin();
            $id = (int)($input['id'] ?? 0);

            if ($id <= 0) {
                json_response(['error' => 'Course ID is required.'], 400);
            }

            $db->prepare('DELETE FROM registrations WHERE course_id = ?')->execute([$id]);
            $stmt = $db->prepare('DELETE FROM courses WHERE id = ?');
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                json_response(['error' => 'Course not found.'], 404);
            }

            json_response(['success' => true, 'message' => 'Course deleted successfully.']);
            break;

        // ---- Enrollment -----------------------------------------------------

        case 'enroll':
            $user     = require_auth();
            $courseId = (int)($input['course_id'] ?? 0);

            if ($courseId <= 0) {
                json_response(['error' => 'Course ID is required.'], 400);
            }

            $stmt = $db->prepare('SELECT * FROM courses WHERE id = ? AND status = ?');
            $stmt->execute([$courseId, 'active']);
            $course = $stmt->fetch();

            if (!$course) {
                json_response(['error' => 'Course not found or is no longer active.'], 404);
            }
            if ((int)$course['enrolled'] >= (int)$course['capacity']) {
                json_response(['error' => 'This course is already full.'], 400);
            }

            $stmt = $db->prepare(
                'SELECT id, status FROM registrations WHERE user_id = ? AND course_id = ?'
            );
            $stmt->execute([$user['id'], $courseId]);
            $existing = $stmt->fetch();

            if ($existing) {
                if ($existing['status'] === 'enrolled') {
                    json_response(['error' => 'You are already enrolled in this course.'], 400);
                }
                $db->prepare(
                    'UPDATE registrations SET status = ?, registered_at = CURRENT_TIMESTAMP WHERE id = ?'
                )->execute(['enrolled', $existing['id']]);

                $db->prepare('UPDATE courses SET enrolled = enrolled + 1 WHERE id = ?')
                   ->execute([$courseId]);
            } else {
                $db->prepare(
                    'INSERT INTO registrations (user_id, course_id, status) VALUES (?, ?, ?)'
                )->execute([$user['id'], $courseId, 'enrolled']);

                $db->prepare('UPDATE courses SET enrolled = enrolled + 1 WHERE id = ?')
                   ->execute([$courseId]);
            }

            json_response(['success' => true, 'message' => 'You have been enrolled successfully!']);
            break;

        case 'drop':
            $user     = require_auth();
            $courseId = (int)($input['course_id'] ?? 0);

            if ($courseId <= 0) {
                json_response(['error' => 'Course ID is required.'], 400);
            }

            $stmt = $db->prepare(
                'SELECT id FROM registrations WHERE user_id = ? AND course_id = ? AND status = ?'
            );
            $stmt->execute([$user['id'], $courseId, 'enrolled']);
            $reg = $stmt->fetch();

            if (!$reg) {
                json_response(['error' => 'You are not enrolled in this course.'], 404);
            }

            $db->prepare('UPDATE registrations SET status = ? WHERE id = ?')
               ->execute(['dropped', $reg['id']]);

            $db->prepare('UPDATE courses SET enrolled = GREATEST(enrolled - 1, 0) WHERE id = ?')
               ->execute([$courseId]);

            json_response(['success' => true, 'message' => 'You have been unenrolled from the course.']);
            break;

        case 'get_my_courses':
            $user = require_auth();
            $stmt = $db->prepare(
                'SELECT c.*, r.status AS reg_status, r.registered_at AS enrolled_date, r.notes, r.id AS reg_id
                   FROM registrations r
                   JOIN courses c ON r.course_id = c.id
                  WHERE r.user_id = ? AND r.status = ?
                  ORDER BY c.code ASC'
            );
            $stmt->execute([$user['id'], 'enrolled']);
            json_response(['courses' => $stmt->fetchAll()]);
            break;

        case 'get_registrations':
            require_admin();
            $courseId = isset($input['course_id']) ? (int)$input['course_id'] : null;

            $sql = 'SELECT r.id             AS reg_id,
                           r.registered_at,
                           r.status         AS reg_status,
                           u.id             AS user_id,
                           u.username,
                           u.full_name      AS student_name,
                           u.email          AS student_email,
                           c.code           AS course_code,
                           c.title          AS course_title
                    FROM registrations r
                    JOIN users   u ON r.user_id   = u.id
                    JOIN courses c ON r.course_id = c.id';

            $params = [];
            if ($courseId) {
                $sql     .= ' WHERE r.course_id = ?';
                $params[] = $courseId;
            }

            $sql  .= ' ORDER BY r.registered_at DESC';
            $stmt  = $db->prepare($sql);
            $stmt->execute($params);

            json_response(['registrations' => $stmt->fetchAll()]);
            break;

        // ---- Profile ---------------------------------------------------------

        case 'update_profile':
            $user = require_auth();
            $userId    = (int)$user['id'];
            $fullName  = trim($input['full_name'] ?? '');
            $email     = trim($input['email'] ?? '');

            if ($fullName === '' || $email === '') {
                json_response(['error' => 'Name and email are required.'], 400);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_response(['error' => 'Invalid email address.'], 400);
            }

            // Check email uniqueness (exclude current user)
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
            $stmt->execute([$email, $userId]);
            if ($stmt->fetch()) {
                json_response(['error' => 'Email is already in use.'], 409);
            }

            // Password change
            $currentPw = $input['current_password'] ?? '';
            $newPw     = $input['new_password'] ?? '';

            if ($newPw !== '') {
                if ($currentPw === '') {
                    json_response(['error' => 'Current password is required to set a new password.'], 400);
                }
                if (strlen($newPw) < 8) {
                    json_response(['error' => 'New password must be at least 8 characters.'], 400);
                }

                $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
                $stmt->execute([$userId]);
                $row = $stmt->fetch();

                if (!password_verify($currentPw, $row['password_hash'])) {
                    json_response(['error' => 'Current password is incorrect.'], 403);
                }

                $hash = password_hash($newPw, PASSWORD_BCRYPT, ['cost' => 12]);
                $stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
                $stmt->execute([$hash, $userId]);
            }

            $stmt = $db->prepare('UPDATE users SET full_name = ?, email = ? WHERE id = ?');
            $stmt->execute([$fullName, $email, $userId]);

            json_response([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'user'    => [
                    'id'        => $userId,
                    'username'  => $user['username'],
                    'full_name' => $fullName,
                    'email'     => $email,
                    'role'      => $user['role'],
                ],
            ]);
            break;

        // ---- Admin: Student Management ---------------------------------------

        case 'get_students':
            require_admin();
            $stmt = $db->query(
                'SELECT u.id, u.username, u.full_name, u.email, u.created_at,
                        (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status = ?) AS enrolled_count
                   FROM users u
                  WHERE u.role = ?
                  ORDER BY u.full_name ASC'
            );
            $stmt->execute(['enrolled', 'student']);
            json_response(['students' => $stmt->fetchAll()]);
            break;

        case 'admin_enroll_student':
            require_admin();
            $userId   = (int)($input['user_id'] ?? 0);
            $courseId = (int)($input['course_id'] ?? 0);

            if ($userId <= 0 || $courseId <= 0) {
                json_response(['error' => 'User ID and Course ID are required.'], 400);
            }

            // Check course exists and has capacity
            $stmt = $db->prepare('SELECT * FROM courses WHERE id = ?');
            $stmt->execute([$courseId]);
            $course = $stmt->fetch();
            if (!$course) {
                json_response(['error' => 'Course not found.'], 404);
            }
            if ((int)$course['enrolled'] >= (int)$course['capacity']) {
                json_response(['error' => 'Course is full.'], 400);
            }

            // Check existing registration
            $stmt = $db->prepare('SELECT id, status FROM registrations WHERE user_id = ? AND course_id = ?');
            $stmt->execute([$userId, $courseId]);
            $existing = $stmt->fetch();

            if ($existing) {
                if ($existing['status'] === 'enrolled') {
                    json_response(['error' => 'Student is already enrolled.'], 400);
                }
                $db->prepare('UPDATE registrations SET status = ? WHERE id = ?')
                   ->execute(['enrolled', $existing['id']]);
            } else {
                $db->prepare('INSERT INTO registrations (user_id, course_id, status) VALUES (?, ?, ?)')
                   ->execute([$userId, $courseId, 'enrolled']);
            }

            $db->prepare('UPDATE courses SET enrolled = enrolled + 1 WHERE id = ?')->execute([$courseId]);

            json_response(['success' => true, 'message' => 'Student enrolled successfully.']);
            break;

        case 'admin_drop_student':
            require_admin();
            $userId   = (int)($input['user_id'] ?? 0);
            $courseId = (int)($input['course_id'] ?? 0);

            if ($userId <= 0 || $courseId <= 0) {
                json_response(['error' => 'User ID and Course ID are required.'], 400);
            }

            $stmt = $db->prepare(
                'SELECT id FROM registrations WHERE user_id = ? AND course_id = ? AND status = ?'
            );
            $stmt->execute([$userId, $courseId, 'enrolled']);
            $reg = $stmt->fetch();

            if (!$reg) {
                json_response(['error' => 'Student is not enrolled in this course.'], 404);
            }

            $db->prepare('UPDATE registrations SET status = ? WHERE id = ?')
               ->execute(['dropped', $reg['id']]);
            $db->prepare('UPDATE courses SET enrolled = GREATEST(enrolled - 1, 0) WHERE id = ?')
               ->execute([$courseId]);

            json_response(['success' => true, 'message' => 'Student dropped from course.']);
            break;

        // ---- Notes -----------------------------------------------------------

        case 'save_notes':
            $user     = require_auth();
            $courseId = (int)($input['course_id'] ?? 0);
            $notes    = $input['notes'] ?? '';

            if ($courseId <= 0) {
                json_response(['error' => 'Course ID is required.'], 400);
            }

            $stmt = $db->prepare(
                'SELECT id FROM registrations WHERE user_id = ? AND course_id = ? AND status = ?'
            );
            $stmt->execute([$user['id'], $courseId, 'enrolled']);
            $reg = $stmt->fetch();

            if (!$reg) {
                json_response(['error' => 'You are not enrolled in this course.'], 404);
            }

            $stmt = $db->prepare('UPDATE registrations SET notes = ? WHERE id = ?');
            $stmt->execute([$notes, $reg['id']]);

            json_response(['success' => true, 'message' => 'Notes saved.']);
            break;

        // ---- Default --------------------------------------------------------

        default:
            json_response(['error' => "Unknown action: {$action}"], 400);
    }
} catch (PDOException $e) {
    error_log('API PDO ERROR: ' . $e->getMessage());
    json_response(['error' => 'A database error occurred. Please try again later.'], 500);
} catch (Exception $e) {
    error_log('API ERROR: ' . $e->getMessage());
    json_response(['error' => 'An unexpected error occurred.'], 500);
}
