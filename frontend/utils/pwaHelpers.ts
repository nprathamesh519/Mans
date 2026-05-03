export type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'naaricare:pwa-dismissed-at';
const DISMISS_DAYS = 3;

export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
};

export const isInStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const isPreviewHost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h.includes('lovableproject.com') || h.includes('lovable.app') || h === 'localhost';
};

export const wasRecentlyDismissed = (): boolean => {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const at = parseInt(v, 10);
    if (!at) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

export const markDismissed = (): void => {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
};

export const clearDismissed = (): void => {
  try { localStorage.removeItem(DISMISS_KEY); } catch {}
};

export const trackEvent = (name: 'install_prompt_shown' | 'install_clicked' | 'install_success' | 'install_dismissed', meta: Record<string, any> = {}): void => {
  const payload = { event: name, ts: Date.now(), ...meta };
  // eslint-disable-next-line no-console
  console.log('[PWA]', payload);
  (window as any).dataLayer?.push?.(payload);
};