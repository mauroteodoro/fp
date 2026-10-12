const CACHE = 'financas-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = req.url;

  // 🔥 Firebase/Firestore/Auth: sempre direto pela rede, nunca cacheia
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('firebaseinstallations.googleapis.com') ||
    url.includes('firebaseapp.com') ||
    url.includes('firebaseio.com') ||
    url.includes('/v1/')
  ) {
    return;
  }

  // 🌐 HTML, fontes, Chart.js, SDK: cache-first com atualização em background
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);

      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type !== 'opaqueredirect') {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});