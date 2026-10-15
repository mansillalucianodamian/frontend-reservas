import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../services/reservas.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-panel-container" style="max-width: 900px; margin: 1.5rem auto; padding: 0 1rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem;">
        
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

  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
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
}
