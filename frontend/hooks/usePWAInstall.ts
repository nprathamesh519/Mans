import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BIPEvent,
  isIOS,
  isInStandaloneMode,
  wasRecentlyDismissed,
  markDismissed,
  trackEvent,
} from '../utils/pwaHelpers';

interface UsePWAInstallReturn {
  visible: boolean;
  installed: boolean;
  canPrompt: boolean;
  isIOSDevice: boolean;
  show: () => void;
  hide: () => void;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  dismiss: () => void;
}

const SHOW_DELAY_MS = 5000;

export const usePWAInstall = (): UsePWAInstallReturn => {
  const promptRef = useRef<BIPEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => isInStandaloneMode());
  const isIOSDevice = isIOS();

  useEffect(() => {
    if (installed) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BIPEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      trackEvent('install_success');
    };

    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  useEffect(() => {
    if (installed || wasRecentlyDismissed()) return;
    if (!canPrompt && !isIOSDevice) return;
    const t = setTimeout(() => {
      setVisible(true);
      trackEvent('install_prompt_shown', { ios: isIOSDevice });
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [canPrompt, isIOSDevice, installed]);

  const show = useCallback(() => {
    if (installed || wasRecentlyDismissed()) return;
    if (!canPrompt && !isIOSDevice) return;
    setVisible(true);
    trackEvent('install_prompt_shown', { trigger: 'manual', ios: isIOSDevice });
  }, [canPrompt, isIOSDevice, installed]);

  const hide = useCallback(() => setVisible(false), []);

  const dismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
    trackEvent('install_dismissed');
  }, []);

  const install = useCallback(async () => {
    trackEvent('install_clicked');
    const ev = promptRef.current;
    if (!ev) return 'unavailable' as const;
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      promptRef.current = null;
      setCanPrompt(false);
      if (outcome === 'accepted') {
        setInstalled(true);
        setVisible(false);
      } else {
        markDismissed();
        setVisible(false);
        trackEvent('install_dismissed', { source: 'native' });
      }
      return outcome;
    } catch {
      return 'unavailable' as const;
    }
  }, []);

  return { visible, installed, canPrompt, isIOSDevice, show, hide, install, dismiss };
};