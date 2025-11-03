import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
}

interface PWAActions {
  install: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  showInstallPrompt: () => void;
}

export function usePWA(): PWAState & PWAActions {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se está rodando como PWA instalado
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    // Verificar status online/offline
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Event listeners para instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Inicializar
    checkStandalone();
    updateOnlineStatus();

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('Instalação não disponível');
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro durante instalação:', error);
      throw error;
    }
  };

  const checkForUpdates = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    }
  };

  const showInstallPrompt = (): void => {
    if (isInstallable && deferredPrompt) {
      install().catch(console.error);
    }
  };

  return {
    // Estado
    isInstallable,
    isInstalled,
    isOnline,
    isStandalone,
    canInstall: isInstallable && !isInstalled,

    // Ações
    install,
    checkForUpdates,
    showInstallPrompt,
  };
}
