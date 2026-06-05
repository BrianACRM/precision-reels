<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

if (current_user()) {
    redirect('/admin/');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    if (login($username, $password)) {
        redirect('/admin/');
    }
    $error = 'Invalid username or password.';
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login | Precision Reels</title>
    <link rel="stylesheet" href="/admin.css">
  </head>
  <body>
    <main class="login-shell">
      <form class="login-card" method="post">
        <?= csrf_field() ?>
        <img class="admin-logo" src="/assets/logos.png" alt="Precision Reels">
        <p>Secure admin</p>
        <h1>Sign in</h1>
        <?php if ($error): ?><div class="flash error"><?= e($error) ?></div><?php endif; ?>
        <label>Username <input name="username" autocomplete="username" required></label>
        <label>Password <input name="password" type="password" autocomplete="current-password" required></label>
        <button type="submit">Login</button>
      </form>
    </main>
  </body>
</html>
