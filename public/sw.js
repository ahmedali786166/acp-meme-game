// Network-only service worker: makes the app installable without caching
// stale builds (every deploy is fetched fresh).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
