const CACHE = "vault-v2";
const ASSETS = [
  "./index.html", "./manifest.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Only handle same-origin app-shell requests.
// Cross-origin requests (Google Apps Script sync, fonts) pass straight through —
// the service worker must never touch them, or JSONP/API calls break.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // let the network handle it
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "daily-nudge") {
    e.waitUntil(
      self.registration.showNotification("Log today's spending", {
        body: "A quick tap keeps your streak alive and your fund on track.",
        icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "daily-nudge"
      })
    );
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./index.html?a=add"));
});
