// Service worker intentionally left minimal.
// Only purpose: unregister itself to clean up old broken SWs.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Unregister self — we don't need a service worker for this app
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.claim();
    })
  );
});
