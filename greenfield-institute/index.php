<?php
// ==============================================================
// Greenfield Institute - Course Registration System
// Entry point
// ==============================================================

session_start();
require_once __DIR__ . '/php/db.php';

$currentUser = null;

if (isset($_SESSION['user_id'])) {
    try {
        $stmt = Database::getConnection()->prepare(
            'SELECT id, username, email, full_name, role, current_streak, longest_streak FROM users WHERE id = ?'
        );
        $stmt->execute([$_SESSION['user_id']]);
        $currentUser = $stmt->fetch();

        if (!$currentUser) {
            session_destroy();
        }
    } catch (Exception $e) {
        session_destroy();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Greenfield Institute – Course Registration</title>
    <meta name="description" content="Course registration system for Greenfield Institute">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css?v=<?=time()?>">
</head>
<body>

    <!-- ============ HEADER ============ -->
    <header style="display:none" id="mainHeader">
        <div class="container header-inner">
            <div class="logo">
                <h1>Greenfield Institute</h1>
                <span class="tagline">Course Registration System</span>
            </div>
            <nav id="main-nav"></nav>
        </div>
    </header>

    <!-- ============ MAIN CONTENT ============ -->
    <main class="container">

        <!-- Login View -->
        <section id="view-login" class="view"></section>

        <!-- Register View -->
        <section id="view-register" class="view"></section>

        <!-- Student Dashboard -->
        <section id="view-student" class="view"></section>

        <!-- Admin Dashboard -->
        <section id="view-admin" class="view"></section>

    </main>

    <!-- ============ MODAL ============ -->
    <div id="modal-overlay" class="modal-overlay hidden">
        <div class="modal" id="modal-content"></div>
    </div>

    <!-- ============ FOOTER ============ -->
    <footer>
        <div class="container">
            <p>&copy; 2026 Greenfield Institute. All rights reserved.</p>
        </div>
    </footer>

    <!-- ============ SCRIPTS ============ -->
    <script>
        window.__INITIAL_USER__ = <?php echo $currentUser ? json_encode($currentUser, JSON_UNESCAPED_UNICODE) : 'null'; ?>;
    </script>
    <script src="js/main.js?v=<?=time()?>"></script>

</body>
</html>
