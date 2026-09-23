// Minimal service worker to make Quizzey installable (PWA).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
// A fetch handler must exist for install eligibility; pass through to network.
self.addEventListener("fetch", () => {});
