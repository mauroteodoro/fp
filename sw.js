// ═══════════════════════════════════════════════════════════════
// 🧨 KILL SWITCH — substitui o service worker antigo
// Ao ativar: apaga TODOS os caches e se auto-desregistra.
// Depois disso, o app baixa tudo direto da rede.
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Apaga todos os caches do Cache Storage
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));

    // 2. Desregistra este service worker
    await self.registration.unregister();

    // 3. Recarrega todas as abas abertas (pra pegar versão fresca)
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
  })());
});
