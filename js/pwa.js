/**
 * PrimeNet - PWA Handler
 * Service worker registration + install prompt
 */

(function () {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently — PWA install still works if cached
      });
    });
  }

  // PWA Install Prompt
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const btn = document.getElementById('pwaInstallBtn');
    if (btn) {
      btn.style.display = 'flex';
      btn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          btn.style.display = 'none';
        });
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.style.display = 'none';
  });
})();
