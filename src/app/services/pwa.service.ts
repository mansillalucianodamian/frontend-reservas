import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private swUpdate: SwUpdate | null = null;
  private promptEvent: any = null;

  constructor(swUpdate?: SwUpdate) {
    if (swUpdate) {
      this.swUpdate = swUpdate;
    } else {
      try {
        this.swUpdate = inject(SwUpdate, { optional: true });
      } catch {
        this.swUpdate = null;
      }
    }
    this.initUpdateChecker();
    this.initInstallPrompt();
  }

  private initUpdateChecker(): void {
    if (!this.swUpdate || !this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        if (confirm('Hay una nueva versión del Sistema de Reservas disponible. ¿Deseas actualizar ahora?')) {
          this.swUpdate?.activateUpdate().then(() => document.location.reload());
        }
      });
  }

  private initInstallPrompt(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault();
        this.promptEvent = event;
      });
    }
  }

  public get canInstall(): boolean {
    return !!this.promptEvent;
  }

  public installApp(): void {
    if (this.promptEvent) {
      this.promptEvent.prompt();
      this.promptEvent.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('El usuario aceptó la instalación de la PWA');
        }
        this.promptEvent = null;
      });
    }
  }
}
