// Günlük Xərclər — Service Worker
// Yalnız tətbiqin öz faylını (HTML/manifest/ikonlar) offline üçün keşləyir.
// Google Drive / Chart.js / Google Identity kimi xarici sorğulara toxunmur —
// onlar həmişə şəbəkədən (internet varsa) çəkilir.

const CACHE_ADI = 'gider-takibi-cache-v1';
const KESLENECEK_FAYLLAR = [
  './kanan.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ADI).then((cache) => cache.addAll(KESLENECEK_FAYLLAR)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((adlar) =>
      Promise.all(adlar.filter((ad) => ad !== CACHE_ADI).map((ad) => caches.delete(ad)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Yalnız öz origin-imizdəki GET sorğularını keşlə; xarici (Google, CDN) sorğulara toxunma.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const shebekeden = fetch(event.request)
        .then((cavab) => {
          if (cavab && cavab.ok) {
            const kopya = cavab.clone();
            caches.open(CACHE_ADI).then((cache) => cache.put(event.request, kopya));
          }
          return cavab;
        })
        .catch(() => cached); // offline-dırsa, keşdən qaytar
      return cached || shebekeden;
    })
  );
});
