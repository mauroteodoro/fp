// Service Worker — cache para abrir rápido e funcionar offline.
//
// Estratégias:
//  • Arquivos do próprio app (HTML, CSS, JS, ícones): REDE PRIMEIRO, cache como
//    reserva offline. Como o app agora é dividido em vários arquivos, isso evita
//    misturar um index.html novo com JS/CSS antigos vindos do cache.
//  • Bibliotecas externas (Tailwind, Chart.js, fontes, SDK do Firebase):
//    cache primeiro, atualizando em segundo plano.
//  • Firebase (dados, login): sempre rede, nunca cache.
//
// Ao mudar a estratégia, incremente CACHE para descartar o cache antigo.
const CACHE = 'financas-v2';

self.addEventListener('install', () => {
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

const ehFirebaseDados = (url) =>
  url.includes('firestore.googleapis.com') ||
  url.includes('identitytoolkit.googleapis.com') ||
  url.includes('securetoken.googleapis.com') ||
  url.includes('firebaseinstallations.googleapis.com') ||
  url.includes('firebaseapp.com') ||
  url.includes('firebaseio.com') ||
  url.includes('/v1/');

const guardar = (cache, req, res) => {
  if (res && res.status === 200 && res.type !== 'opaqueredirect') {
    cache.put(req, res.clone());
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (ehFirebaseDados(req.url)) return;

  const mesmoSite = new URL(req.url).origin === self.location.origin;

  if (mesmoSite) {
    // 🏠 App: rede primeiro, cache se estiver offline
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        fetch(req)
          .then((res) => guardar(cache, req, res))
          .catch(() => cache.match(req))
      )
    );
    return;
  }

  // 🌐 Bibliotecas externas: cache primeiro com atualização em segundo plano
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then((res) => guardar(cache, req, res))
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
