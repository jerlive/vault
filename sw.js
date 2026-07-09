const CACHE = "vault-v1";
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

// cache-first for app shell, network fallback
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
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

// best-effort daily nudge (Chrome Android, app installed)
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "daily-nudge") {
    e.waitUntil(
      self.registration.showNotification("Log today's spending", {
        body: "A quick tap keeps your streak alive and your fund on track.",
        icon: "icons/icon-192.png",
        badge: "icons/icon-192.png",
        tag: "daily-nudge"
      })
    );
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./index.html?a=add"));
});
