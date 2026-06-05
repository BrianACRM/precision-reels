<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

require_login();
$id = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);
$listing = get_listing($id);
if (!$listing) {
    http_response_code(404);
    exit('Listing not found.');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string) ($_POST['action'] ?? '');
    try {
        if ($action === 'update') {
            $errors = validate_listing_data($_POST);
            if ($errors) {
                throw new RuntimeException(implode(' ', $errors));
            }
            update_listing($id, $_POST, $_FILES);
            flash('Listing updated.');
        } elseif ($action === 'delete_image') {
            delete_image((int) ($_POST['image_id'] ?? 0));
            flash('Image deleted.');
        }
    } catch (Throwable $error) {
        flash($error->getMessage(), 'error');
    }
    redirect('/admin/edit.php?id=' . $id);
}

$flash = take_flash();
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Edit Listing | Precision Reels</title>
    <link rel="stylesheet" href="/admin.css">
  </head>
  <body>
    <main class="admin-shell">
      <header class="admin-header">
        <div>
          <img class="admin-logo" src="/assets/logos.png" alt="Precision Reels">
          <p>Edit listing</p>
          <h1><?= e($listing['stock_number']) ?></h1>
        </div>
        <nav class="admin-nav">
          <a href="/admin/">Back to admin</a>
          <a href="/" target="_blank" rel="noopener">View website</a>
        </nav>
      </header>
      <?php if ($flash): ?><div class="flash <?= e($flash['type']) ?>"><?= e($flash['message']) ?></div><?php endif; ?>

      <section class="edit-layout">
        <form class="listing-form" method="post" enctype="multipart/form-data">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="update">
          <input type="hidden" name="id" value="<?= (int) $listing['id'] ?>">
          <div class="field-grid">
            <label>Year <input name="year" value="<?= e($listing['year']) ?>" required></label>
            <label>Price <input name="price" value="<?= e($listing['price']) ?>" required></label>
          </div>
          <label>Model <input name="model" value="<?= e($listing['model']) ?>" required></label>
          <label>Short note <textarea name="note" required><?= e($listing['note']) ?></textarea></label>
          <div class="field-grid">
            <label>Stock # <input name="stock_number" value="<?= e($listing['stock_number']) ?>" required></label>
            <label>Status
              <select name="status">
                <?php foreach (['Available', 'Pending', 'Sold'] as $status): ?>
                  <option <?= $listing['status'] === $status ? 'selected' : '' ?>><?= e($status) ?></option>
                <?php endforeach; ?>
              </select>
            </label>
          </div>
          <label>Sort order <input name="sort_order" type="number" value="<?= (int) $listing['sort_order'] ?>"></label>
          <label>Add more photos <input name="images[]" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>
          <button type="submit">Save changes</button>
        </form>

        <section class="inventory-admin">
          <div class="section-bar"><div><span>Photos</span><strong><?= count($listing['images']) ?> uploaded</strong></div></div>
          <div class="admin-grid">
            <?php foreach ($listing['images'] as $image): ?>
              <article class="admin-card">
                <form method="post" onsubmit="return confirm('Delete this photo?');">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="delete_image">
                  <input type="hidden" name="image_id" value="<?= (int) $image['id'] ?>">
                  <button class="remove-button" type="submit">X</button>
                </form>
                <img class="card-image" src="<?= e(upload_url($image['file_path'])) ?>" alt="">
              </article>
            <?php endforeach; ?>
          </div>
        </section>
      </section>
    </main>
  </body>
</html>
