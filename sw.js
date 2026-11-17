// Offline support for Sudoku in pencil.
// - The app's own files: network first (so a new version shows up as soon as it's online),
//   falling back to the saved copy when offline or when the network is too slow.
// - The pinned Supabase library and Google Fonts: saved copy first (those URLs never change).
// - Supabase API calls (sign-in, syncing games) are never cached; the app handles being offline itself.
// Bump VERSION only if the list below changes; normal edits to index.html don't need it.
const VERSION = "v1";
const CACHE = "sudoku-" + VERSION;
const APP = ["./", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
const FONTS_CSS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Kalam:wght@400;700&display=swap";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP); // required: without these the app can't open offline
    // Best effort: the library, the fonts stylesheet, and every font file it points to.
    await Promise.allSettled([
      cache.add(SUPABASE_JS),
      (async () => {
        const res = await fetch(FONTS_CSS);
        if (!res.ok) return;
        await cache.put(FONTS_CSS, res.clone());
        const css = await res.text();
        const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]);
        await Promise.allSettled(urls.map(u => cache.add(u)));
      })(),
    ]);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith("sudoku-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

const fromCache = req => caches.match(req, { ignoreSearch: req.mode === "navigate" });

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // Give up on a hanging connection (plane Wi-Fi, captive portals) after a few seconds.
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error("slow")), 4000))]);
    if (res.ok) cache.put(req.mode === "navigate" ? "./" : req, res.clone());
    return res;
  } catch (e) {
    const hit = (await fromCache(req)) || (req.mode === "navigate" ? await caches.match("./") : null);
    if (hit) return hit;
    throw e;
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) { event.respondWith(networkFirst(req)); return; }
  if (url.href === SUPABASE_JS || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(req));
  }
  // Everything else (Supabase API, etc.) goes straight to the network.
});
