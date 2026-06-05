# Precision Reels

Standalone website and admin system for walk-behind reel mower inventory.

## Static demo

The repository root is a static GitHub Pages demo:

- `index.html`
- `admin.html`
- `styles.css`
- `admin.css`

## SiteGround app

The production-ready PHP/MySQL version is in `siteground/`.

It includes:

- Login-protected admin
- PHP sessions with HTTP-only cookies
- CSRF protection
- MySQL listings and listing images
- Add, edit, delete, and mark sold
- Multiple image uploads
- Stock numbers and listing status
- Upload validation and non-executable upload folder
- PWA manifest and service worker

See `siteground/README.md` for deployment steps.
