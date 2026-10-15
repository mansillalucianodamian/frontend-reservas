import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasService } from '../services/reservas.service';

@Component({
  selector: 'app-admin-domotica',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="domotica-panel-container">
      <div class="resource-selector-bar">
        <button [class.active]="tipoRecurso === 'cancha'" (click)="cambiarTipoRecurso('cancha')" class="btn-resource-toggle">
          Cancha de Pádel
        </button>
        <button [class.active]="tipoRecurso === 'quincho'" (click)="cambiarTipoRecurso('quincho')" class="btn-resource-toggle">
          Quincho Municipal
        </button>
      </div>

      <div class="luces-control-card" style="max-width: 600px; margin: 1.5rem auto;">
        <div class="luces-control-header">
          <div class="luces-title-section">
            <!-- Ícono Cancha (Iluminación) -->
            <svg *ngIf="tipoRecurso === 'cancha'" xmlns="http://www.w3.org/2000/svg" class="icon-bulb" [class.active]="lucesEncendidas" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
              <line x1="9" y1="18" x2="15" y2="18"></line>
              <line x1="10" y1="22" x2="14" y2="22"></line>
            </svg>
            <!-- Ícono Quincho (Climatización/Aire Acondicionado) -->
            <svg *ngIf="tipoRecurso === 'quincho'" xmlns="http://www.w3.org/2000/svg" class="icon-bulb" [class.active]="lucesEncendidas" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"></path>
            </svg>
            <h3 class="luces-title">
              {{ tipoRecurso === 'quincho' ? 'Climatización Quincho' : 'Iluminación Cancha' }}
            </h3>
          </div>
          <button (click)="loadLucesStatus()" [disabled]="cargandoLuces" class="btn-refresh-luces" title="Refrescar estado real">
            <svg xmlns="http://www.w3.org/2000/svg" [class.spinning]="cargandoLuces" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
          </button>
        </div>

        <div class="luces-control-body">
          <div class="luces-status-indicator">
            <span class="status-dot" [class.active]="lucesEncendidas"></span>
            <span class="status-text">
              Estado Real: 
              <strong [class.text-active]="lucesEncendidas">
                {{ lucesEncendidas ? (tipoRecurso === 'quincho' ? '❄️ ENCENDIDO' : '💡 ENCENDIDAS') : (tipoRecurso === 'quincho' ? '🌑 APAGADO' : '🌑 APAGADAS') }}
              </strong>
            </span>
          </div>

          <div class="luces-mode-selectors">
            <button [class.active]="lucesModo === 'AUTO'" (click)="cambiarModoLuces('AUTO')" [disabled]="cargandoLuces" class="btn-mode-selector auto">
              <span class="btn-label">Automático</span>
              <span class="btn-subtext">Sigue reservas</span>
            </button>
            <button [class.active]="lucesModo === 'ON'" (click)="cambiarModoLuces('ON')" [disabled]="cargandoLuces" class="btn-mode-selector on">
              <span class="btn-label">Forzar ON</span>
              <span class="btn-subtext">
                {{ tipoRecurso === 'quincho' ? 'Siempre encendido' : 'Siempre encendidas' }}
              </span>
            </button>
            <button [class.active]="lucesModo === 'OFF'" (click)="cambiarModoLuces('OFF')" [disabled]="cargandoLuces" class="btn-mode-selector off">
              <span class="btn-label">Forzar OFF</span>
              <span class="btn-subtext">
                {{ tipoRecurso === 'quincho' ? 'Siempre apagado' : 'Siempre apagadas' }}
              </span>
            </button>
          </div>

          <div *ngIf="mensaje" class="admin-toast success" style="margin-top: 1rem; position: static;">{{ mensaje }}</div>
          <div *ngIf="errorMessage" class="admin-toast error" style="margin-top: 1rem; position: static;">{{ errorMessage }}</div>
        </div>
      </div>
    </div>
  `
})
export class AdminDomoticaComponent implements OnInit {
  @Input() tipoRecurso: 'cancha' | 'quincho' = 'cancha';

  lucesEncendidas: boolean = false;
  lucesModo: 'ON' | 'OFF' | 'AUTO' = 'AUTO';
  cargandoLuces: boolean = false;
  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLucesStatus();
  }

  cambiarTipoRecurso(nuevoTipo: 'cancha' | 'quincho'): void {
    this.tipoRecurso = nuevoTipo;
    this.loadLucesStatus();
  }

  loadLucesStatus(): void {
    this.cargandoLuces = true;
    this.reservasService.getDispositivoStatus(this.tipoRecurso).subscribe({
      next: (res) => {
        this.lucesEncendidas = !!res.output;
        this.lucesModo = res.mode || 'AUTO';
        this.cargandoLuces = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error al cargar estado de Shelly (${this.tipoRecurso}):`, err);
        this.lucesEncendidas = false;
        this.lucesModo = 'AUTO';
        this.cargandoLuces = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarModoLuces(nuevoModo: 'ON' | 'OFF' | 'AUTO'): void {
    this.cargandoLuces = true;
    this.reservasService.updateDispositivoMode(this.tipoRecurso, nuevoModo).subscribe({
      next: () => {
        this.lucesModo = nuevoModo;
        const nombreDisp = this.tipoRecurso === 'quincho' ? 'Aire Acondicionado' : 'Luces Cancha';
        this.mensaje = `Modo de ${nombreDisp} cambiado a: ${nuevoModo === 'ON' ? 'FORZADO ENCENDIDO' : nuevoModo === 'OFF' ? 'FORZADO APAGADO' : 'AUTOMÁTICO'}`;
        
        setTimeout(() => {
          this.mensaje = null;
          this.cdr.detectChanges();
        }, 4000);

        setTimeout(() => {
          this.loadLucesStatus();
        }, 1200);
      },
      error: (err) => {
        console.error(`Error al cambiar modo del Shelly (${this.tipoRecurso}):`, err);
        this.errorMessage = err?.message || 'Error al actualizar el modo del dispositivo.';
        setTimeout(() => {
          this.errorMessage = null;
          this.cdr.detectChanges();
        }, 4000);

        this.cargandoLuces = false;
        this.cdr.detectChanges();
      }
    });
  }
}
