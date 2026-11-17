import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../services/reservas.service';
import { PiletaService, PiletaConfig } from '../services/pileta.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-panel-container" style="max-width: 1180px; margin: 1.5rem auto; padding: 0 1rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
        
        <!-- Tarifa Cancha -->
        <div class="calendar-card" style="padding: 1.5rem;">
          <div class="calendar-card-header" style="margin-bottom: 1.2rem;">
            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              🎾 Cancha de Pádel
            </h3>
            <p class="card-subtitle">Define el precio del turno estándar de cancha</p>
          </div>

          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label for="precioCanchaInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Precio del Turno ($ ARS):
            </label>
            <input 
              type="number" 
              id="precioCanchaInput" 
              [(ngModel)]="precioCancha" 
              min="1" 
              class="form-input"
              style="width: 100%; font-size: 1.1rem; font-weight: 700; padding: 8px 12px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
          </div>

          <button 
            type="button" 
            (click)="guardarPrecioCancha()" 
            [disabled]="isUpdatingCancha || !precioCancha || precioCancha <= 0" 
            class="btn-apply-bulk"
            style="width: 100%;">
            <span *ngIf="!isUpdatingCancha">Actualizar Tarifa Cancha</span>
            <span *ngIf="isUpdatingCancha">Guardando...</span>
          </button>
        </div>

        <!-- Tarifas Quincho -->
        <div class="calendar-card" style="padding: 1.5rem;">
          <div class="calendar-card-header" style="margin-bottom: 1.2rem;">
            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              🏡 Quincho Municipal
            </h3>
            <p class="card-subtitle">Tarifas del turno diario y opcionales de climatización</p>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label for="precioQuinchoInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Precio Base del Turno ($ ARS):
            </label>
            <input 
              type="number" 
              id="precioQuinchoInput" 
              [(ngModel)]="precioQuincho" 
              min="1" 
              class="form-input"
              style="width: 100%; font-size: 1.1rem; font-weight: 700; padding: 8px 12px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
          </div>

          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label for="precioAireInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Adicional Aire Acondicionado ($ ARS):
            </label>
            <input 
              type="number" 
              id="precioAireInput" 
              [(ngModel)]="precioAireQuincho" 
              min="0" 
              class="form-input"
              style="width: 100%; font-size: 1.1rem; font-weight: 700; padding: 8px 12px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
          </div>

          <button 
            type="button" 
            (click)="guardarPreciosQuincho()" 
            [disabled]="isUpdatingQuincho || !precioQuincho || precioQuincho <= 0" 
            class="btn-apply-bulk"
            style="width: 100%;">
            <span *ngIf="!isUpdatingQuincho">Actualizar Tarifas Quincho</span>
            <span *ngIf="isUpdatingQuincho">Guardando...</span>
          </button>
        </div>

        <!-- Tarifas y Horarios Pileta Municipal -->
        <div class="calendar-card" style="padding: 1.5rem;">
          <div class="calendar-card-header" style="margin-bottom: 1.2rem;">
            <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
              </svg>
              Pileta Municipal
            </h3>
            <p class="card-subtitle">Entradas de boletería, horarios y apertura</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div class="form-group">
              <label for="precioAdultoInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.8rem;">
                Mar-Vie Mayores ($):
              </label>
              <input 
                type="number" 
                id="precioAdultoInput" 
                [(ngModel)]="configPileta.precio_adulto" 
                min="0" 
                class="form-input"
                style="width: 100%; font-size: 1rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
            </div>

            <div class="form-group">
              <label for="precioNinoInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.8rem;">
                Mar-Vie Menores ($):
              </label>
              <input 
                type="number" 
                id="precioNinoInput" 
                [(ngModel)]="configPileta.precio_nino" 
                min="0" 
                class="form-input"
                style="width: 100%; font-size: 1rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
            </div>

            <div class="form-group">
              <label for="precioAdultoFindeResInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.8rem;">
                Finde May. Residente ($):
              </label>
              <input 
                type="number" 
                id="precioAdultoFindeResInput" 
                [(ngModel)]="configPileta.precio_adulto_finde_res" 
                min="0" 
                class="form-input"
                style="width: 100%; font-size: 1rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
            </div>

            <div class="form-group">
              <label for="precioNinoFindeResInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.8rem;">
                Finde Men. Residente ($):
              </label>
              <input 
                type="number" 
                id="precioNinoFindeResInput" 
                [(ngModel)]="configPileta.precio_nino_finde_res" 
                min="0" 
                class="form-input"
                style="width: 100%; font-size: 1rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
            </div>

            <div class="form-group">
              <label for="precioAdultoFindeNoResInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.8rem;">
                Finde May. No Res. ($):
              </label>
              <input 
                type="number" 
                id="precioAdultoFindeNoResInput" 
                [(ngModel)]="configPileta.precio_adulto_finde_nores" 
                min="0" 
                class="form-input"
                style="width: 100%; font-size: 1rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
            </div>

            <div class="form-group">
              <label for="precioNinoFindeNoResInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 4px; font-size: 0.8rem;">
                Finde Men. No Res. ($):
              </label>
              <input 
                type="number" 
                id="precioNinoFindeNoResInput" 
                [(ngModel)]="configPileta.precio_nino_finde_nores" 
                min="0" 
                class="form-input"
                style="width: 100%; font-size: 1rem; font-weight: 700; padding: 6px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label for="horariosPiletaInput" class="field-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Días y Horarios:
            </label>
            <input 
              type="text" 
              id="horariosPiletaInput" 
              [(ngModel)]="configPileta.horarios" 
              class="form-input"
              style="width: 100%; font-size: 0.95rem; padding: 8px 10px; border-radius: 6px; border: 1.5px solid #cbd5e1;">
          </div>

          <button 
            type="button" 
            (click)="guardarConfigPileta()" 
            [disabled]="isUpdatingPileta" 
            class="btn-apply-bulk"
            style="width: 100%;">
            <span *ngIf="!isUpdatingPileta">Actualizar Tarifas Pileta</span>
            <span *ngIf="isUpdatingPileta">Guardando...</span>
          </button>
        </div>

      </div>

      <div *ngIf="mensaje" class="admin-toast success" style="margin-top: 1.5rem; position: static;">{{ mensaje }}</div>
      <div *ngIf="errorMessage" class="admin-toast error" style="margin-top: 1.5rem; position: static;">{{ errorMessage }}</div>
    </div>
  `
})
export class AdminConfigComponent implements OnInit {
  precioCancha: number = 5000;
  isUpdatingCancha: boolean = false;

  precioQuincho: number = 21500;
  senaQuincho: number = 0;
  precioAireQuincho: number = 10000;
  isUpdatingQuincho: boolean = false;

  configPileta: PiletaConfig = {
    precio_adulto: 4000,
    precio_nino: 3000,
    precio_adulto_finde_res: 6000,
    precio_nino_finde_res: 4000,
    precio_adulto_finde_nores: 8000,
    precio_nino_finde_nores: 5000,
    abierta: 1,
    horarios: 'Martes a Viernes de 16:00 a 20:00 hs | Sábados, Domingos y Feriados',
    mensaje_estado: 'Temporada 2026-2027: Inicio sábado 12/12/2026 hasta domingo 28/02/2027'
  };
  isUpdatingPileta: boolean = false;

  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private piletaService: PiletaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTarifas();
  }

  cargarTarifas(): void {
    this.reservasService.getPrecioCancha().subscribe({
      next: (res) => {
        if (res && res.ok) {
          this.precioCancha = res.precio;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar tarifa cancha:', err)
    });

    this.reservasService.getPrecioQuincho().subscribe({
      next: (res) => {
        if (res && res.ok) {
          this.precioQuincho = res.precio;
          this.senaQuincho = res.sena || 0;
          this.precioAireQuincho = res.precio_aire || 10000;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar tarifas quincho:', err)
    });

    this.piletaService.getConfig().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.configPileta = cfg;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar tarifas pileta:', err)
    });
  }

  guardarPrecioCancha(): void {
    if (!this.precioCancha || this.precioCancha <= 0) return;
    this.isUpdatingCancha = true;

    this.reservasService.updatePrecioCancha(this.precioCancha).subscribe({
      next: (res) => {
        this.isUpdatingCancha = false;
        this.mensaje = res.message || 'Tarifa de cancha actualizada con éxito';
        setTimeout(() => { this.mensaje = null; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUpdatingCancha = false;
        this.errorMessage = err?.message || 'Error al actualizar tarifa de cancha';
        setTimeout(() => { this.errorMessage = null; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      }
    });
  }

  guardarPreciosQuincho(): void {
    if (!this.precioQuincho || this.precioQuincho <= 0) return;
    this.isUpdatingQuincho = true;

    this.reservasService.updatePrecioQuincho(this.precioQuincho, this.senaQuincho, this.precioAireQuincho).subscribe({
      next: (res) => {
        this.isUpdatingQuincho = false;
        this.mensaje = res.message || 'Tarifas de quincho actualizadas con éxito';
        setTimeout(() => { this.mensaje = null; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUpdatingQuincho = false;
        this.errorMessage = err?.message || 'Error al actualizar tarifas de quincho';
        setTimeout(() => { this.errorMessage = null; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      }
    });
  }

  guardarConfigPileta(): void {
    this.isUpdatingPileta = true;
    this.piletaService.updateConfig(this.configPileta).subscribe({
      next: (res) => {
        this.isUpdatingPileta = false;
        this.mensaje = res.message || 'Tarifas de pileta actualizadas con éxito';
        if (res.config) this.configPileta = res.config;
        setTimeout(() => { this.mensaje = null; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUpdatingPileta = false;
        this.errorMessage = err || 'Error al actualizar tarifas de pileta';
        setTimeout(() => { this.errorMessage = null; this.cdr.detectChanges(); }, 4000);
        this.cdr.detectChanges();
      }
    });
  }
}
