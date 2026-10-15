// @vitest-environment jsdom
import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PwaService } from './pwa.service';
import { of } from 'rxjs';

describe('PwaService', () => {
  let service: PwaService;

  const fakeSwUpdate: any = {
    isEnabled: true,
    versionUpdates: of(),
    activateUpdate: vi.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    service = new PwaService(fakeSwUpdate);
  });

  it('debe instanciarse correctamente con soporte de Service Worker', () => {
    expect(service).toBeTruthy();
  });

  it('debe iniciar canInstall en false si no se disparó beforeinstallprompt', () => {
    expect(service.canInstall).toBe(false);
  });

  it('debe actualizar canInstall a true cuando se captura beforeinstallprompt', () => {
    const fakeEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };

    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakeEvent));
    expect(service.canInstall).toBe(true);
  });
});
