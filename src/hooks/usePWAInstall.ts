import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as unknown as { __pwa_deferred_prompt?: BeforeInstallPromptEvent }).__pwa_deferred_prompt) {
      return (window as unknown as { __pwa_deferred_prompt: BeforeInstallPromptEvent }).__pwa_deferred_prompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasPromptTriggered, setHasPromptTriggered] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed as PWA or running in standalone window)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __pwa_deferred_prompt: BeforeInstallPromptEvent }).__pwa_deferred_prompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      (window as unknown as { __pwa_deferred_prompt?: BeforeInstallPromptEvent | null }).__pwa_deferred_prompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const promptToUse =
      deferredPrompt ||
      (typeof window !== 'undefined' ? (window as unknown as { __pwa_deferred_prompt?: BeforeInstallPromptEvent }).__pwa_deferred_prompt : null);

    if (!promptToUse) {
      return false;
    }
    setHasPromptTriggered(true);
    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        (window as unknown as { __pwa_deferred_prompt?: BeforeInstallPromptEvent | null }).__pwa_deferred_prompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
    hasPromptTriggered,
  };
}
