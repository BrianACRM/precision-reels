<?php
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';

$listings = get_public_listings();
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Precision Reels | Walk Reel Mowers For Sale</title>
    <meta name="description" content="Available walk-behind reel mowers for sale.">
    <link rel="manifest" href="/manifest.webmanifest">
    <meta name="theme-color" content="#101b15">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main>
      <section class="showroom-hero">
        <div class="ambient-field" aria-hidden="true"></div>
        <div class="inventory-intro">
          <img class="hero-logo" src="/assets/logos.png" alt="Precision Reels">
          <p>Current inventory</p>
          <h1>Available walk-behind reel mowers</h1>
          <span>Click any mower to open photos, details, and the inquiry form.</span>
        </div>
      </section>

      <section class="inventory-grid" aria-label="Mower inventory">
        <?php if (!$listings): ?>
          <article class="inventory-card empty-card">
            <h2>No mowers listed right now</h2>
            <p class="card-note">Check back soon or contact the seller for incoming inventory.</p>
          </article>
        <?php endif; ?>

        <?php foreach ($listings as $listing): ?>
          <?php $primary = $listing['images'][0]['file_path'] ?? 'assets/pgm22.png'; ?>
          <article class="inventory-card" tabindex="0" data-listing-id="<?= (int) $listing['id'] ?>">
            <div class="photo-box">
              <img src="<?= e(upload_url($primary)) ?>" alt="<?= e($listing['year'] . ' ' . $listing['model']) ?>">
            </div>
            <h2><?= e($listing['year'] . ' ' . $listing['model']) ?></h2>
            <p class="price"><?= e($listing['price']) ?></p>
            <p class="card-note"><?= e($listing['note']) ?></p>
            <button type="button">Inquire to buy</button>
          </article>
        <?php endforeach; ?>
      </section>

      <section class="detail-panel" id="details" aria-live="polite">
        <button class="close-detail" type="button" aria-label="Close details">Close</button>
        <div class="detail-gallery" id="detailGallery"></div>
        <div class="detail-image"><img id="detailImage" src="/assets/pgm22.png" alt="Selected mower"></div>
        <article class="detail-copy">
          <h2 id="detailTitle"></h2>
          <p class="detail-price" id="detailPrice"></p>
          <p class="shipping">Pickup or shipping quote confirmed with seller.</p>
          <form class="inline-inquiry" method="post" action="/inquiry.php">
            <?= csrf_field() ?>
            <input type="hidden" id="listingId" name="listing_id" value="">
            <h3>Inquire to buy</h3>
            <input type="text" name="name" placeholder="Name" required>
            <input type="text" name="contact" placeholder="Phone or email" required>
            <textarea id="detailMessage" name="message" placeholder="I am interested in this mower." required></textarea>
            <button type="submit">Send inquiry</button>
          </form>
          <div class="description">
            <h3>Description</h3>
            <dl id="detailSpecs"></dl>
          </div>
        </article>
      </section>
    </main>

    <script>
      window.PRECISION_LISTINGS = <?= json_encode(array_map(static function (array $listing): array {
          return [
              'id' => (int) $listing['id'],
              'stock' => $listing['stock_number'],
              'title' => $listing['year'] . ' ' . $listing['model'],
              'price' => $listing['price'],
              'note' => $listing['note'],
              'status' => $listing['status'],
              'images' => array_map(static fn(array $image): string => upload_url($image['file_path']), $listing['images']),
          ];
      }, $listings), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;
    </script>
    <script src="/app.js"></script>
  </body>
</html>
