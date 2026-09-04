// src/api/androidBridge.ts
// Pont natif Android / Capacitor pour Comptoir Central ERP.
// Gère le bouton Retour matériel Android, la barre de statut, le safe-area et les fonctionnalités natives.

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export interface AndroidDeviceInfo {
  isNative: boolean;
  platform: string;
  isAndroid: boolean;
  isIos: boolean;
  isWeb: boolean;
  userAgent: string;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  storageStatus: string;
}

/**
 * Détecte si l'application s'exécute dans un conteneur natif Android
 */
export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Détecte si la plateforme est mobile (Android natif ou navigateur Android)
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isAndroidNative() || /Android/i.test(navigator.userAgent);
}

/**
 * Informations système sur l'environnement Android
 */
export function getAndroidDeviceInfo(): AndroidDeviceInfo {
  const isNat = Capacitor.isNativePlatform();
  const plat = Capacitor.getPlatform();
  return {
    isNative: isNat,
    platform: plat,
    isAndroid: plat === 'android' || (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)),
    isIos: plat === 'ios',
    isWeb: plat === 'web',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    screen: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    },
    storageStatus: 'IndexedDB + LocalStorage Mirror',
  };
}

/**
 * Initialise les optimisations et listeners Android
 */
export async function initAndroidBridge(options?: {
  onHardwareBack?: () => boolean; // Retourne true si le retour a été consommé (ex: fermeture de modal)
}): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Définir des classes CSS utilitaires pour Android
  const root = document.documentElement;
  if (isAndroidDevice()) {
    root.classList.add('is-android');
  }
  if (Capacitor.isNativePlatform()) {
    root.classList.add('is-native-app');
  }

  // 2. Configuration Native Android (StatusBar & SplashScreen)
  if (Capacitor.isNativePlatform()) {
    try {
      // Configuration de la barre de statut aux couleurs du thème du logo (#0B0D12)
      await StatusBar.setStyle({ style: Style.Dark });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#0B0D12' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    } catch (err) {
      console.warn('[Android Bridge] StatusBar non disponible ou ignoré:', err);
    }

    try {
      // Masquer le SplashScreen en douceur
      await SplashScreen.hide({ fadeOutDuration: 300 });
    } catch (err) {
      console.warn('[Android Bridge] SplashScreen non disponible:', err);
    }

    // 3. Gestion du bouton Retour Matériel Android (Hardware Back Button)
    try {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // Si un gestionnaire de retour personnalisé (modale/tiroir) consomme l'événement
        if (options?.onHardwareBack && options.onHardwareBack()) {
          return;
        }

        // Vérifier si un modal ou drawer HTML est ouvert dans le DOM
        const activeModalCloseBtn = document.querySelector('.modal-container button[title="Fermer"]') as HTMLButtonElement | null;
        if (activeModalCloseBtn) {
          activeModalCloseBtn.click();
          return;
        }

        // Vérifier si un drawer de navigation est ouvert
        const activeDrawerCloseBtn = document.querySelector('button[title="Fermer"]') as HTMLButtonElement | null;
        if (activeDrawerCloseBtn) {
          activeDrawerCloseBtn.click();
          return;
        }

        if (canGoBack) {
          window.history.back();
        } else {
          // Minimiser l'application plutôt que de forcer un crash
          CapacitorApp.minimizeApp();
        }
      });
    } catch (err) {
      console.warn('[Android Bridge] Listener backButton non disponible:', err);
    }
  }

  // 4. Fallback pour navigateur Android standard (événement window 'popstate' et 'backbutton')
  window.addEventListener('popstate', () => {
    if (options?.onHardwareBack) {
      options.onHardwareBack();
    }
  });

  // 5. Exposer sur window pour le débogage et l'intégration WebView
  (window as any).ComptoirAndroidBridge = {
    getInfo: getAndroidDeviceInfo,
    isNative: isAndroidNative,
    vibrate: (pattern = [50]) => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
    share: async (title: string, text: string, url?: string) => {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title, text, url: url || window.location.href });
          return true;
        } catch (e) {
          console.log('[Android Share] Annulé ou non supporté');
          return false;
        }
      }
      return false;
    },
  };
}
