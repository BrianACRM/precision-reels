<?php
declare(strict_types=1);

function get_public_listings(): array
{
    $stmt = db()->query(
        "SELECT * FROM listings WHERE status IN ('Available','Pending') ORDER BY sort_order ASC, id DESC"
    );
    $listings = $stmt->fetchAll();
    attach_images($listings);
    return $listings;
}

function get_admin_listings(): array
{
    $stmt = db()->query('SELECT * FROM listings ORDER BY sort_order ASC, id DESC');
    $listings = $stmt->fetchAll();
    attach_images($listings);
    return $listings;
}

function get_listing(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM listings WHERE id = ?');
    $stmt->execute([$id]);
    $listing = $stmt->fetch();
    if (!$listing) {
        return null;
    }
    $listings = [$listing];
    attach_images($listings);
    return $listings[0];
}

function attach_images(array &$listings): void
{
    if (!$listings) {
        return;
    }

    $ids = array_column($listings, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = db()->prepare("SELECT * FROM listing_images WHERE listing_id IN ($placeholders) ORDER BY sort_order ASC, id ASC");
    $stmt->execute($ids);
    $images = $stmt->fetchAll();

    $byListing = [];
    foreach ($images as $image) {
        $byListing[(int) $image['listing_id']][] = $image;
    }

    foreach ($listings as &$listing) {
        $listing['images'] = $byListing[(int) $listing['id']] ?? [];
    }
}

function create_listing(array $data, array $files): int
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO listings (stock_number, year, model, price, note, status, sort_order)
             VALUES (:stock_number, :year, :model, :price, :note, :status, :sort_order)'
        );
        $stmt->execute(clean_listing_data($data));
        $listingId = (int) $pdo->lastInsertId();
        save_uploaded_images($listingId, $files);
        $pdo->commit();
        return $listingId;
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function update_listing(int $id, array $data, array $files): void
{
    $stmt = db()->prepare(
        'UPDATE listings
         SET stock_number = :stock_number, year = :year, model = :model, price = :price,
             note = :note, status = :status, sort_order = :sort_order
         WHERE id = :id'
    );
    $clean = clean_listing_data($data);
    $clean['id'] = $id;
    $stmt->execute($clean);
    save_uploaded_images($id, $files);
}

function delete_listing(int $id): void
{
    $listing = get_listing($id);
    if ($listing) {
        foreach ($listing['images'] as $image) {
            delete_upload_file($image['file_path']);
        }
    }
    $stmt = db()->prepare('DELETE FROM listings WHERE id = ?');
    $stmt->execute([$id]);
}

function delete_image(int $id): void
{
    $stmt = db()->prepare('SELECT file_path FROM listing_images WHERE id = ?');
    $stmt->execute([$id]);
    $image = $stmt->fetch();
    if ($image) {
        delete_upload_file($image['file_path']);
        $delete = db()->prepare('DELETE FROM listing_images WHERE id = ?');
        $delete->execute([$id]);
    }
}

function clean_listing_data(array $data): array
{
    $status = $data['status'] ?? 'Available';
    if (!in_array($status, ['Available', 'Pending', 'Sold'], true)) {
        $status = 'Available';
    }

    return [
        'stock_number' => trim((string) ($data['stock_number'] ?? '')),
        'year' => trim((string) ($data['year'] ?? '')),
        'model' => trim((string) ($data['model'] ?? '')),
        'price' => trim((string) ($data['price'] ?? '')),
        'note' => trim((string) ($data['note'] ?? '')),
        'status' => $status,
        'sort_order' => (int) ($data['sort_order'] ?? 0),
    ];
}

function validate_listing_data(array $data): array
{
    $errors = [];
    foreach (['stock_number', 'year', 'model', 'price', 'note'] as $field) {
        if (trim((string) ($data[$field] ?? '')) === '') {
            $errors[] = ucfirst(str_replace('_', ' ', $field)) . ' is required.';
        }
    }
    return $errors;
}

function save_uploaded_images(int $listingId, array $files): void
{
    global $config;
    if (empty($files['images']) || !is_array($files['images']['name'])) {
        return;
    }

    $uploadDir = $config['app']['upload_dir'];
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $count = min(count($files['images']['name']), (int) $config['app']['max_images_per_listing']);
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    for ($i = 0; $i < $count; $i++) {
        if (($files['images']['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if (($files['images']['error'][$i] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Image upload failed.');
        }
        if (($files['images']['size'][$i] ?? 0) > $config['app']['max_upload_bytes']) {
            throw new RuntimeException('Image is too large.');
        }

        $tmp = $files['images']['tmp_name'][$i];
        $mime = $finfo->file($tmp);
        if (!isset($allowed[$mime]) || !getimagesize($tmp)) {
            throw new RuntimeException('Only JPG, PNG, and WebP images are allowed.');
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
        $destination = $uploadDir . '/' . $filename;
        if (!move_uploaded_file($tmp, $destination)) {
            throw new RuntimeException('Could not save uploaded image.');
        }
        chmod($destination, 0644);

        $stmt = db()->prepare(
            'INSERT INTO listing_images (listing_id, file_path, alt_text, sort_order)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$listingId, $filename, '', $i]);
    }
}

function upload_url(string $filePath): string
{
    global $config;
    if (str_starts_with($filePath, 'assets/')) {
        return '/' . ltrim($filePath, '/');
    }
    return rtrim($config['app']['upload_url'], '/') . '/' . rawurlencode($filePath);
}

function delete_upload_file(string $filePath): void
{
    global $config;
    if (str_contains($filePath, '/') || str_contains($filePath, '\\')) {
        return;
    }
    $path = $config['app']['upload_dir'] . '/' . $filePath;
    if (is_file($path)) {
        unlink($path);
    }
}
