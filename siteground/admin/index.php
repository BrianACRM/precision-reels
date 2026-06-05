<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

$user = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string) ($_POST['action'] ?? '');
    try {
        if ($action === 'create') {
            $errors = validate_listing_data($_POST);
            if ($errors) {
                throw new RuntimeException(implode(' ', $errors));
            }
            create_listing($_POST, $_FILES);
            flash('Listing added.');
        } elseif ($action === 'delete') {
            delete_listing((int) ($_POST['id'] ?? 0));
            flash('Listing deleted.');
        } elseif ($action === 'mark_sold') {
            $stmt = db()->prepare("UPDATE listings SET status = 'Sold' WHERE id = ?");
            $stmt->execute([(int) ($_POST['id'] ?? 0)]);
            flash('Listing marked sold.');
        }
    } catch (Throwable $error) {
        flash($error->getMessage(), 'error');
    }
    redirect('/admin/');
}

$listings = get_admin_listings();
$flash = take_flash();
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mower Inventory Admin</title>
    <link rel="stylesheet" href="/admin.css">
    <link rel="manifest" href="/manifest.webmanifest">
  </head>
  <body>
    <main class="admin-shell">
      <header class="admin-header">
        <div>
          <img class="admin-logo" src="/assets/logos.png" alt="Precision Reels">
          <p>Inventory admin</p>
          <h1>Mower listings</h1>
        </div>
        <nav class="admin-nav">
          <a href="/" target="_blank" rel="noopener">View website</a>
          <a href="/admin/logout.php">Logout</a>
        </nav>
      </header>

      <?php if ($flash): ?><div class="flash <?= e($flash['type']) ?>"><?= e($flash['message']) ?></div><?php endif; ?>

      <section class="admin-board">
        <form class="listing-form" method="post" enctype="multipart/form-data">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="create">
          <div class="form-heading">
            <span>Add mower</span>
            <strong>New listing</strong>
          </div>
          <p class="form-note">Upload multiple photos, add the stock number, then publish the listing.</p>

          <label class="image-drop">
            <input id="imageInput" name="images[]" type="file" accept="image/jpeg,image/png,image/webp" multiple>
            <img id="imagePreview" alt="">
            <span id="imagePrompt">Add photos</span>
          </label>
          <div class="image-strip" id="imageStrip" aria-label="Selected image previews"></div>

          <div class="field-grid">
            <label>Year <input name="year" placeholder="2017" required></label>
            <label>Price <input name="price" placeholder="$4,850" required></label>
          </div>
          <label>Model <input name="model" placeholder="Jacobsen PGM22 Walk Reel" required></label>
          <label>Short note <textarea name="note" placeholder="22 inch walk-behind reel mower." required></textarea></label>
          <div class="field-grid">
            <label>Stock # <input name="stock_number" placeholder="JM-017" required></label>
            <label>Status
              <select name="status">
                <option>Available</option>
                <option>Pending</option>
                <option>Sold</option>
              </select>
            </label>
          </div>
          <label>Sort order <input name="sort_order" type="number" value="0"></label>
          <button type="submit">Add listing</button>
        </form>

        <section class="inventory-admin" aria-label="Current listings">
          <div class="section-bar">
            <div>
              <span>Current listings</span>
              <strong><?= count($listings) ?> active</strong>
            </div>
          </div>

          <div class="admin-grid">
            <?php foreach ($listings as $listing): ?>
              <?php $primary = $listing['images'][0]['file_path'] ?? 'assets/pgm22.png'; ?>
              <article class="admin-card">
                <form method="post" onsubmit="return confirm('Delete this listing?');">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="id" value="<?= (int) $listing['id'] ?>">
                  <button class="remove-button" type="submit" aria-label="Remove listing">X</button>
                </form>
                <a class="admin-card-link" href="/admin/edit.php?id=<?= (int) $listing['id'] ?>">
                  <img class="card-image" src="<?= e(upload_url($primary)) ?>" alt="<?= e($listing['model']) ?>">
                  <div class="card-copy">
                    <span class="stock-pill"><?= e($listing['stock_number']) ?></span>
                    <h2><?= e($listing['year'] . ' ' . $listing['model']) ?></h2>
                    <strong class="card-price"><?= e($listing['price']) ?></strong>
                    <p><?= e($listing['note']) ?></p>
                    <span class="status-pill" data-status="<?= e(strtolower($listing['status'])) ?>"><?= e($listing['status']) ?></span>
                  </div>
                </a>
                <?php if ($listing['status'] !== 'Sold'): ?>
                  <form class="quick-action" method="post">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="mark_sold">
                    <input type="hidden" name="id" value="<?= (int) $listing['id'] ?>">
                    <button type="submit">Mark sold</button>
                  </form>
                <?php endif; ?>
              </article>
            <?php endforeach; ?>
          </div>
        </section>
      </section>
    </main>
    <script src="/admin-preview.js"></script>
  </body>
</html>
