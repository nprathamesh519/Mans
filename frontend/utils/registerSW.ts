import { isInIframe, isPreviewHost } from './pwaHelpers';

export const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  if (isPreviewHost() || isInIframe()) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {}
    return;
  }

  try {
    const { registerSW } = await import('virtual:pwa-register');
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        const ok = window.confirm('A new version is available. Reload now?');
        if (ok) updateSW(true);
      },
      onOfflineReady() {
        // eslint-disable-next-line no-console
        console.log('[PWA] Offline ready');
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[PWA] SW registration failed', e);
  }
};