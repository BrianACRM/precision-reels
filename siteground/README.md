# Precision Reels SiteGround App

This folder is the real PHP/MySQL version for SiteGround.

## Deploy

1. Upload the contents of this `siteground/` folder to SiteGround `public_html`.
2. Copy `config.sample.php` to `config.php`.
3. Fill in the MySQL database name, user, and password in `config.php`.
4. In SiteGround MySQL/phpMyAdmin, import `database/schema.sql`.
5. Create an admin password hash:

   ```bash
   php -r "echo password_hash('YOUR_STRONG_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
   ```

6. Copy `database/seed-admin.example.sql`, replace the fake hash, and run it in phpMyAdmin.
7. Optional: import `database/seed-listings.example.sql` for sample listings.
8. Visit `/admin/login.php` and sign in.

## Security

- Admin is server-side, not JavaScript-only.
- Passwords use PHP `password_hash` / `password_verify`.
- Admin pages use HTTP-only, SameSite session cookies.
- Forms use CSRF tokens.
- Database writes use prepared PDO statements.
- Uploads are MIME-checked and size-limited.
- Uploaded files are renamed with random filenames.
- `/uploads/.htaccess` blocks PHP execution in upload storage.
- `config.php`, SQL files, and directory indexes are blocked by `.htaccess`.

## PWA

The public site includes `manifest.webmanifest` and `service-worker.js`. Admin pages are intentionally not cached by the service worker.
