const CACHE_NAME = "precision-reels-disabled-v1";
const APP_SHELL = [
  "/styles.css",
  "/script.js",
  "/contact.js",
  "/assets/logo-1200.webp",
  "/assets/logo-900.webp",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.delete(CACHE_NAME));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).then(() => self.registration.unregister())
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  return;
});
