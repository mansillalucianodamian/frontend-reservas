import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private static readonly STORAGE_KEY = 'pwa_banner_dismissed_until';
  private static readonly COOLDOWN_DAYS = 7;

  /** Signal público que controla la visibilidad del banner */
  public readonly showBanner = signal<boolean>(false);

  /** Signal que indica si el usuario está en un dispositivo iOS (iPhone / iPad) */
  public readonly isIos = signal<boolean>(false);

  /** Evento beforeinstallprompt retenido */
  private deferredPrompt = signal<any>(null);

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // 1. Si ya está instalada en modo standalone, no hacer nada
    if (this.isAppInstalled()) {
      return;
    }

    // 2. Detectar si es iOS (iPhone / iPad / iPod)
    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    this.isIos.set(isIosDevice);

    // Si es iOS, no está instalada y no fue descartada en los últimos 7 días, mostrar banner
    if (isIosDevice && !this.isDismissedRecently()) {
      this.showBanner.set(true);
    }

    // 3. Escuchar evento beforeinstallprompt (Android, Chrome, Edge)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevenir el infobar por defecto del navegador
      e.preventDefault();

      // Guardar el evento para dispararlo cuando el usuario haga clic
      this.deferredPrompt.set(e);

      // Activar banner si no fue descartado recientemente
      if (!this.isDismissedRecently()) {
        this.showBanner.set(true);
      }
    });

    // 4. Escuchar cuando la app sea efectivamente instalada
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt.set(null);
      this.showBanner.set(false);
      console.log('✅ PWA instalada exitosamente en el sistema.');
    });
  }

  /**
   * Dispara el diálogo nativo de instalación
   */
  public async instalarApp(): Promise<void> {
    const prompt = this.deferredPrompt();
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      console.log(`Resultado de instalación PWA: ${choice.outcome}`);
      this.deferredPrompt.set(null);
    }
    this.showBanner.set(false);
  }

  /**
   * Oculta el banner y guarda una marca de 7 días en localStorage
   */
  public descartarPorAhora(): void {
    this.showBanner.set(false);
    if (typeof localStorage !== 'undefined') {
      const cooldownMs = PwaInstallService.COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const expireTimestamp = Date.now() + cooldownMs;
      localStorage.setItem(PwaInstallService.STORAGE_KEY, expireTimestamp.toString());
    }
  }

  /**
   * Verifica si la app ya está corriendo como PWA independiente (standalone)
   */
  private isAppInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    const isStandaloneMedia = typeof window.matchMedia === 'function' 
      ? window.matchMedia('(display-mode: standalone)').matches 
      : false;
    const isStandaloneNavigator = (navigator as any)?.standalone === true;
    return isStandaloneMedia || isStandaloneNavigator;
  }

  /**
   * Verifica si el usuario descartó el banner en los últimos 7 días
   */
  private isDismissedRecently(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const dismissedUntil = localStorage.getItem(PwaInstallService.STORAGE_KEY);
    if (!dismissedUntil) return false;

    const timestamp = parseInt(dismissedUntil, 10);
    return !isNaN(timestamp) && Date.now() < timestamp;
  }
}
