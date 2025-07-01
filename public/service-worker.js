self.addEventListener('install', function (event) {
    self.skipWaiting();
});
self.addEventListener('activate', function (event) {
    self.clients.claim();
});
// Optional: Add fetch event for offline support 