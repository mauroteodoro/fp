// Registra o Service Worker (PWA: abre mais rápido e funciona offline).
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch((err) => console.warn('SW falhou:', err));
    });
}
