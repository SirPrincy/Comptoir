export function registerServiceWorker(onOfflineReady?: () => void, onNeedRefresh?: () => void) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] Nouvelle version disponible.');
                  if (onNeedRefresh) onNeedRefresh();
                } else {
                  console.log('[PWA] Application prête pour une utilisation hors-ligne.');
                  if (onOfflineReady) onOfflineReady();
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    });
  }
}
