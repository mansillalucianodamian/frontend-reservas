// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PwaInstallService } from './pwa-install.service';

describe('PwaInstallService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe crearse con showBanner en false por defecto si no hay evento', () => {
    const service = new PwaInstallService();
    expect(service).toBeTruthy();
    expect(service.showBanner()).toBe(false);
  });

  it('debe activar showBanner cuando se dispara beforeinstallprompt', () => {
    const service = new PwaInstallService();
    const fakeEvent = new Event('beforeinstallprompt');
    (fakeEvent as any).prompt = vi.fn().mockResolvedValue(undefined);
    (fakeEvent as any).userChoice = Promise.resolve({ outcome: 'accepted' });

    window.dispatchEvent(fakeEvent);

    expect(service.showBanner()).toBe(true);
  });

  it('debe ocultar el banner y registrar marca de 7 días al llamar descartarPorAhora()', () => {
    const service = new PwaInstallService();
    const fakeEvent = new Event('beforeinstallprompt');
    window.dispatchEvent(fakeEvent);

    expect(service.showBanner()).toBe(true);

    service.descartarPorAhora();

    expect(service.showBanner()).toBe(false);
    const dismissedUntil = localStorage.getItem('pwa_banner_dismissed_until');
    expect(dismissedUntil).toBeDefined();
    expect(Number(dismissedUntil)).toBeGreaterThan(Date.now());
  });

  it('debe ejecutar prompt() y ocultar banner al llamar instalarApp()', async () => {
    const service = new PwaInstallService();
    const promptSpy = vi.fn().mockResolvedValue(undefined);
    const fakeEvent = new Event('beforeinstallprompt');
    (fakeEvent as any).prompt = promptSpy;
    (fakeEvent as any).userChoice = Promise.resolve({ outcome: 'accepted' });

    window.dispatchEvent(fakeEvent);
    expect(service.showBanner()).toBe(true);

    await service.instalarApp();

    expect(promptSpy).toHaveBeenCalled();
    expect(service.showBanner()).toBe(false);
  });
});
