const CACHE = 'financas-v2';

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
  const accept = req.headers.get('accept') || '';

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

  // 🎯 HTML e navegações: NETWORK-FIRST
  // Motivo: o app é editado com frequência. Com cache-first, toda edição
  // ficava "presa" — só aparecia no segundo reload, e no mobile (onde
  // não existe Ctrl+Shift+R) exigia limpar o cache manualmente.
  //
  // Com network-first, o HTML sempre é buscado da rede. Se estiver
  // offline, cai no cache automaticamente — o modo offline continua
  // funcionando normalmente.
  const ehHTML = req.mode === 'navigate'
              || accept.includes('text/html')
              || url.endsWith('.html')
              || url.endsWith('/');

  if (ehHTML) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type !== 'opaqueredirect') {
            cache.put(req, res.clone());
          }
          return res;
        } catch (_) {
          const cached = await cache.match(req);
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // 🌐 Demais assets (fontes, Chart.js, SDK do Firebase, ícones):
  // cache-first com atualização em background. Esses arquivos são
  // versionados por URL — quando trocam, a URL troca, então o cache
  // nunca fica obsoleto.
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