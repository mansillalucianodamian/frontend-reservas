import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ReservasService } from '../services/reservas.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule],
  template: `
    <div class="reservas-panel-container">
      <mat-tab-group class="custom-tabs-group" dynamicHeight>
        
        <!-- Sub-Pestaña: Bloqueos y Grilla Diaria -->
        <mat-tab label="Gestión de Bloqueos y Grilla">
          <div class="resource-selector-bar" style="margin-top: 1rem;">
            <button [class.active]="tipoRecurso === 'cancha'" (click)="cambiarTipoRecurso('cancha')" class="btn-resource-toggle">
              Cancha de Pádel
            </button>
            <button [class.active]="tipoRecurso === 'quincho'" (click)="cambiarTipoRecurso('quincho')" class="btn-resource-toggle">
              Quincho Municipal
            </button>
          </div>

          <div class="tab-layout">
            <!-- Columna Calendario -->
            <div class="col-calendar">
              <div class="calendar-card">
                <div class="calendar-card-header">
                  <h3 class="card-title">Calendario de Bloqueos ({{ tipoRecurso === 'quincho' ? 'Quincho' : 'Cancha' }})</h3>
                  <p class="card-subtitle">Selecciona una fecha para restringir slots de {{ tipoRecurso === 'quincho' ? 'Quincho Municipal' : 'Cancha de Pádel' }}</p>
                </div>
                
                <div class="calendar-wrapper">
                  <div class="calendar-controls">
                    <button (click)="mesAnterior()" [disabled]="esMesActual(currentMonth)" class="nav-btn">&lt;</button>
                    <span class="month-title">{{ currentMonth | date:'MMMM yyyy' | titlecase }}</span>
                    <button (click)="mesSiguiente()" class="nav-btn">&gt;</button>
                  </div>

                  <div class="calendar-grid">
                    <div *ngFor="let nombre of nombresDias" class="grid-header-day">{{ nombre }}</div>
                    <button *ngFor="let dia of diasCalendario; trackBy: trackByDia" 
                            (click)="seleccionarDia(dia.dateStr)" 
                            [disabled]="!dia.enabled"
                            [class.selected]="fechaSeleccionada === dia.dateStr"
                            [class.current-month]="dia.isCurrentMonth"
                            class="grid-day">
                      {{ dia.dayNum }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna Horarios -->
            <div class="col-hours">
              <div class="hours-card">
                <div class="hours-card-header" *ngIf="fechaSeleccionada">
                  <h3 class="card-title">Slots para el {{ formatFechaLocal(fechaSeleccionada) }}</h3>
                  <p class="card-subtitle">Administra bloqueos sobre turnos libres, reservados o bloqueados</p>
                </div>
                <div class="hours-card-header" *ngIf="!fechaSeleccionada">
                  <h3 class="card-title">Horarios del Turno</h3>
                  <p class="card-subtitle">Elige una fecha del calendario para cargar la grilla</p>
                </div>

                <div *ngIf="fechaSeleccionada && (horariosDisponibles$ | async) as horarios; else instructivo" class="hours-list-container">
                  <div *ngFor="let h of horarios" class="hour-row">
                    <ng-container *ngIf="obtenerEstadoSlot(h.hora) as slot">
                      <div class="hour-info">
                        <span class="hour-time">{{ h.hora }} hs</span>
                        <span class="hour-status-badge" [ngClass]="slot.estado">
                          {{ slot.label }}
                        </span>
                        <span *ngIf="slot.estado === 'bloqueado'" class="slot-extra-info block-desc">
                          (Motivo: {{ slot.motivo }})
                        </span>
                        <span *ngIf="slot.estado === 'pendiente' || slot.estado === 'aprobado' || slot.estado === 'reservado'" class="slot-extra-info user-desc">
                          (Por: {{ slot.usuario }})
                        </span>
                      </div>
                      
                      <div class="hour-action">
                        <button *ngIf="slot.estado !== 'bloqueado'" 
                                (click)="solicitarBloqueo(h.hora, slot.estado !== 'disponible')" 
                                class="btn-block-hour" 
                                title="Bloquear horario">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <span>Bloquear</span>
                        </button>

                        <button *ngIf="slot.estado === 'bloqueado'" 
                                (click)="solicitarDesbloqueo(slot.reservaId!, h.hora)" 
                                class="btn-unblock-hour" 
                                title="Liberar / Desbloquear horario">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                          </svg>
                          <span>Liberar</span>
                        </button>
                      </div>
                    </ng-container>
                  </div>
                  <p *ngIf="horarios.length === 0" class="no-hours-text">No hay horarios definidos para esta fecha.</p>
                </div>

                <ng-template #instructivo>
                  <div class="hours-empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <p>Elige un día activo en el calendario para gestionar bloqueos.</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- Bloqueos Masivos y Listado de Bloqueados -->
          <div class="blocks-layout-row" *ngIf="tipoRecurso === 'cancha'">
            <!-- Card de Bloqueo Masivo -->
            <div class="calendar-card bulk-block-card hide-on-mobile half-width-card">
              <div class="calendar-card-header">
                <h3 class="card-title">Bloqueo Recurrente y Masivo (Cancha)</h3>
                <p class="card-subtitle">Programa bloqueos repetitivos en un rango de fechas</p>
              </div>
              
              <div class="bulk-form">
                <div class="form-row dates-row">
                  <div class="form-group">
                    <label for="fechaDesdeM" class="field-label">Desde:</label>
                    <input type="date" id="fechaDesdeM" [(ngModel)]="fechaDesdeMasivo" class="form-input">
                  </div>
                  <div class="form-group">
                    <label for="fechaHastaM" class="field-label">Hasta:</label>
                    <input type="date" id="fechaHastaM" [(ngModel)]="fechaHastaMasivo" class="form-input">
                  </div>
                </div>

                <div class="form-group">
                  <label class="group-label">Días a bloquear:</label>
                  <div class="days-chips">
                    <label *ngFor="let dia of diasSemanaMasivo" class="day-chip" [class.selected]="dia.selected">
                      <input type="checkbox" [(ngModel)]="dia.selected" class="hidden-checkbox">
                      <span>{{ dia.label }}</span>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <div class="hours-header">
                    <label class="group-label">Horarios:</label>
                    <div class="hours-actions">
                      <button type="button" (click)="seleccionarTodasHoras()" class="btn-text-action">Todos</button>
                      <span class="action-sep">|</span>
                      <button type="button" (click)="deseleccionarTodasHoras()" class="btn-text-action">Ninguno</button>
                    </div>
                  </div>
                  <div class="hours-grid">
                    <label *ngFor="let slot of horasMasivo" class="hour-chip" [class.selected]="slot.selected">
                      <input type="checkbox" [(ngModel)]="slot.selected" class="hidden-checkbox">
                      <span>{{ slot.hora }}</span>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label for="motivoMasivoM" class="field-label">Motivo del Bloqueo:</label>
                  <input type="text" id="motivoMasivoM" [(ngModel)]="motivoMasivo" placeholder="Ej: Torneo Municipal" class="form-input">
                </div>

                <div class="form-group-checkbox">
                  <label class="checkbox-container">
                    <input type="checkbox" [(ngModel)]="conLuzMasivo">
                    <span class="checkmark"></span>
                    <span class="checkbox-label-text">Encender luces en estos horarios (torneos)</span>
                  </label>
                </div>

                <button type="button" (click)="aplicarBloqueoMasivo()" [disabled]="cargandoMasivo" class="btn-apply-bulk">
                  <span *ngIf="!cargandoMasivo">Aplicar Bloqueo Masivo</span>
                  <span *ngIf="cargandoMasivo">Procesando bloqueo masivo...</span>
                </button>
              </div>
            </div>

            <!-- Card de Listado de Horarios y Reservas -->
            <div class="calendar-card list-blocked-card half-width-card">
              <div class="calendar-card-header">
                <h3 class="card-title">Listado de Horarios y Reservas (Cancha)</h3>
                <p class="card-subtitle">Consulta, filtra y gestiona los horarios de este recurso</p>
              </div>
              
              <div class="blocked-list-controls">
                <div class="form-group">
                  <label for="filtroDiaBloqueos" class="field-label">Filtrar por día:</label>
                  <div class="filter-input-row">
                    <input type="date" id="filtroDiaBloqueos" [(ngModel)]="filtroDiaBloqueos" class="form-input">
                    <button type="button" *ngIf="filtroDiaBloqueos" (click)="filtroDiaBloqueos = ''" class="btn-clear-filter" title="Limpiar filtro">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label for="filtroEstadoBloqueos" class="field-label">Filtrar por estado:</label>
                  <select id="filtroEstadoBloqueos" [(ngModel)]="filtroEstadoBloqueos" class="form-input">
                    <option value="todos">Todos</option>
                    <option value="bloqueado">Bloqueados</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="disponible">Disponibles</option>
                  </select>
                </div>
              </div>

              <div class="blocked-list-wrapper">
                <div class="table-scroll-container" *ngIf="listadoGeneralFiltrado.length > 0; else noBlocks">
                  <table class="blocked-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Estado</th>
                        <th>Detalle / Motivo</th>
                        <th>Luz</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let b of listadoGeneralFiltrado">
                        <td>{{ formatFechaLocal(b.fecha) }}</td>
                        <td class="text-bold">{{ b.hora.substring(0, 5) }} hs</td>
                        <td>
                          <span class="hour-status-badge" [ngClass]="b.estado">
                            {{ b.label }}
                          </span>
                        </td>
                        <td>
                          <span *ngIf="b.estado === 'bloqueado'" class="slot-extra-info block-desc">
                            (Motivo: {{ b.motivo }})
                          </span>
                          <span *ngIf="b.estado === 'pendiente' || b.estado === 'aprobado'" class="slot-extra-info user-desc">
                            (Por: {{ b.usuario }})
                          </span>
                          <span *ngIf="b.estado === 'disponible'" class="slot-extra-info libre-desc" style="color: #10b981; font-style: italic; font-weight: 500; font-size: 0.85rem;">
                            Libre
                          </span>
                        </td>
                        <td>
                          <span class="luz-indicator" [class.active]="b.con_luz" *ngIf="b.estado !== 'disponible'">
                            {{ b.con_luz ? '💡 SÍ' : '🌑 NO' }}
                          </span>
                          <span *ngIf="b.estado === 'disponible'">-</span>
                        </td>
                        <td>
                          <button *ngIf="b.estado === 'bloqueado'" (click)="solicitarDesbloqueo(b.id, b.hora.substring(0, 5))" class="btn-table-action-delete" title="Liberar horario">
                            Liberar
                          </button>
                          <button *ngIf="b.estado === 'pendiente' || b.estado === 'aprobado'" (click)="cancelarReserva(b.id)" class="btn-table-action-delete" style="border-color: #fca5a5; color: #ef4444;" title="Cancelar reserva">
                            Cancelar
                          </button>
                          <button *ngIf="b.estado === 'disponible'" (click)="solicitarBloqueo(b.hora, false)" class="btn-table-action-approve" style="background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #059669; padding: 2.5px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center;" title="Bloquear horario">
                            Bloquear
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ng-template #noBlocks>
                  <div class="no-blocks-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span *ngIf="filtroEstadoBloqueos === 'disponible' && !filtroDiaBloqueos">Selecciona un día en el filtro para ver los horarios disponibles.</span>
                    <span *ngIf="filtroEstadoBloqueos !== 'disponible' || filtroDiaBloqueos">No se encontraron horarios con el filtro seleccionado.</span>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Sub-Pestaña: Historial y Dashboard de Reservas -->
        <mat-tab label="Historial y Estadísticas">
          <div *ngIf="reservas$ | async as reservas; else cargandoReservas" class="history-tab-layout" style="margin-top: 1rem;">
            
            <div class="history-filter-bar">
              <button [class.active]="filtroTipoHistorial === 'todos'" (click)="filtroTipoHistorial = 'todos'" class="btn-history-filter">
                Todos
              </button>
              <button [class.active]="filtroTipoHistorial === 'cancha'" (click)="filtroTipoHistorial = 'cancha'" class="btn-history-filter">
                Canchas de Pádel
              </button>
              <button [class.active]="filtroTipoHistorial === 'quincho'" (click)="filtroTipoHistorial = 'quincho'" class="btn-history-filter">
                Quincho Municipal
              </button>
            </div>

            <!-- Dashboard de Estadísticas -->
            <div class="stats-dashboard" *ngIf="reservas.length > 0">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon-wrapper blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Reservas Totales</span>
                    <strong class="stat-value">{{ totalReservas }}</strong>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon-wrapper green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Pagos Acreditados</span>
                    <strong class="stat-value">{{ totalAprobadas }}</strong>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon-wrapper yellow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Pendientes / Canceladas</span>
                    <strong class="stat-value">{{ totalPendientes }} / {{ totalCanceladas }}</strong>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon-wrapper gray">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <span class="stat-label">Bloqueos Registrados</span>
                    <strong class="stat-value">{{ totalBloqueos }}</strong>
                  </div>
                </div>
              </div>

              <div class="analysis-grid">
                <div class="analysis-card">
                  <h4 class="analysis-title">Horario más Solicitado</h4>
                  <div class="hot-schedule-box" *ngIf="horarioMasReservado; else sinDatosHorario">
                    <div class="schedule-badge-large">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{{ horarioMasReservado.hora }} hs</span>
                    </div>
                    <p class="schedule-meta-text">
                      Este horario se ha seleccionado un total de <strong>{{ horarioMasReservado.count }}</strong> veces por los usuarios.
                    </p>
                  </div>
                  <ng-template #sinDatosHorario>
                    <p class="empty-analysis-text">Aún no hay suficientes reservas registradas.</p>
                  </ng-template>
                </div>

                <div class="analysis-card">
                  <h4 class="analysis-title">Usuarios más Activos (Top 5)</h4>
                  <div class="top-users-list" *ngIf="topUsuarios.length > 0; else sinDatosUsuarios">
                    <div class="top-user-item" *ngFor="let tu of topUsuarios; let idx = index">
                      <div class="user-rank-badge" [class.rank-1]="idx === 0" [class.rank-2]="idx === 1" [class.rank-3]="idx === 2">
                        {{ idx + 1 }}
                      </div>
                      <span class="top-user-name">{{ tu.usuario }}</span>
                      <span class="top-user-count">{{ tu.count }} {{ tu.count === 1 ? 'reserva' : 'reservas' }}</span>
                    </div>
                  </div>
                  <ng-template #sinDatosUsuarios>
                    <p class="empty-analysis-text">Aún no hay usuarios con reservas.</p>
                  </ng-template>
                </div>
              </div>
            </div>

            <!-- Buscador -->
            <div class="search-box">
              <div class="search-input-wrapper">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" placeholder="Buscar por DNI, Usuario, Fecha o Estado..." [(ngModel)]="filtroReservas" class="search-input">
              </div>
            </div>

            <!-- Listado de Reservas -->
            <div class="reservas-list">
              <div *ngFor="let r of filtrarReservasList(reservas).slice().reverse()" class="reserva-row-card" [ngClass]="r.estado ? r.estado.toLowerCase() : ''">
                <div class="reserva-main-details">
                  <div class="reserva-avatar-badge" [ngClass]="r.estado ? r.estado.toLowerCase() : ''">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>

                  <div class="reserva-text-details">
                    <h4 class="reserva-info-title">
                      {{ formatFechaLocal(r.fecha) }} • {{ r.hora }} hs
                      <span class="reserva-type-badge" [ngClass]="(r.tipo || 'cancha').toLowerCase()">
                        {{ (r.tipo || 'cancha') === 'quincho' ? 'Quincho' : 'Cancha' }}
                      </span>
                      <span *ngIf="(r.tipo || 'cancha') === 'quincho' && (r.con_aire || (r.motivo && r.motivo.includes('Aire Acondicionado: SÍ')))" class="reserva-ac-badge" style="font-size: 0.72rem; font-weight: 700; color: #b45309; padding: 2px 6px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; margin-left: 6px; display: inline-flex; align-items: center; gap: 2px; vertical-align: middle;">
                        AA
                      </span>
                      <span class="reserva-status-badge" [ngClass]="r.estado ? r.estado.toLowerCase() : ''">{{ r.estado }}</span>
                    </h4>
                    <p class="reserva-meta-sub">
                      <span *ngIf="r.usuario_id"><strong>Usuario:</strong> {{ r.usuario }} (ID: {{ r.usuario_id }})</span>
                      <span *ngIf="!r.usuario_id"><strong>Bloqueo Administrativo</strong></span>
                      <span class="meta-sep">•</span>
                      <span>Ref: #{{ r.id }}</span>
                      <span class="meta-sep" *ngIf="(r.tipo || 'cancha') === 'quincho' && (r.con_aire || (r.motivo && r.motivo.includes('Aire Acondicionado: SÍ')))">•</span>
                      <span *ngIf="(r.tipo || 'cancha') === 'quincho' && (r.con_aire || (r.motivo && r.motivo.includes('Aire Acondicionado: SÍ')))" style="color: #d97706; font-weight: 600;">Con Aire</span>
                      <span class="meta-sep" *ngIf="r.motivo">•</span>
                      <span *ngIf="r.motivo" class="reserva-note-label"><strong>Motivo:</strong> {{ r.motivo }}</span>
                    </p>
                  </div>
                </div>

                <div class="reserva-actions" style="display: flex; gap: 6px; align-items: center;">
                  <button *ngIf="['aprobado', 'aprobada', 'confirmado', 'confirmada'].includes((r.estado || '').toLowerCase())" 
                          (click)="deshacerAprobacion(r)" 
                          class="btn-undo-booking" 
                          title="Volver a Pendiente">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 7v6h6"></path>
                      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
                    </svg>
                    <span>Revertir</span>
                  </button>
                  <button (click)="cancelarReserva(r.id)" [disabled]="!esReservaActiva(r)" class="btn-cancel-booking" title="Cancelar reserva">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
              <p *ngIf="filtrarReservasList(reservas).length === 0" class="no-results-text">No se encontraron reservas coincidentes.</p>
            </div>
          </div>
          <ng-template #cargandoReservas>
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Cargando historial de reservas...</p>
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class AdminReservasComponent implements OnInit {
  reservas$: Observable<any[]> | null = null;
  reservas: any[] = [];
  
  tipoRecurso: 'cancha' | 'quincho' = 'cancha';
  currentMonth: Date = new Date();
  diasCalendario: { dateStr: string; dayNum: number; isCurrentMonth: boolean; enabled: boolean }[] = [];
  nombresDias: string[] = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  fechaSeleccionada: string | null = null;
  horariosDisponibles$: Observable<{ hora: string, disponible: boolean }[]> | null = null;

  filtroReservas: string = '';
  filtroTipoHistorial: 'todos' | 'cancha' | 'quincho' = 'todos';
  filtroDiaBloqueos: string = '';
  filtroEstadoBloqueos: 'todos' | 'bloqueado' | 'pendiente' | 'aprobado' | 'disponible' = 'todos';

  fechaDesdeMasivo: string = '';
  fechaHastaMasivo: string = '';
  diasSemanaMasivo: { label: string, value: number, selected: boolean }[] = [
    { label: 'Lu', value: 1, selected: false },
    { label: 'Ma', value: 2, selected: false },
    { label: 'Mi', value: 3, selected: false },
    { label: 'Ju', value: 4, selected: false },
    { label: 'Vi', value: 5, selected: false },
    { label: 'Sá', value: 6, selected: false },
    { label: 'Do', value: 0, selected: false }
  ];
  horasMasivo: { hora: string, selected: boolean }[] = [];
  motivoMasivo: string = 'Uso interno municipal';
  conLuzMasivo: boolean = false;
  cargandoMasivo: boolean = false;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadReservas();
    this.generarCalendario(this.currentMonth);
    
    const hoy = new Date();
    this.fechaDesdeMasivo = this.formatLocalISO(hoy);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    this.fechaHastaMasivo = this.formatLocalISO(finMes);
    this.inicializarHorasMasivo();
  }

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservas();
    this.reservasService.getReservas().subscribe({
      next: (res) => {
        this.reservas = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al precargar listado de reservas:', err)
    });
  }

  private formatLocalISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  generarCalendario(referencia: Date) {
    const año = referencia.getFullYear();
    const mes = referencia.getMonth();

    const primerDiaMes = new Date(año, mes, 1);
    let diaSemanaPrimerDia = primerDiaMes.getDay();
    let desfase = diaSemanaPrimerDia === 0 ? 6 : diaSemanaPrimerDia - 1;

    const ultimoDiaMes = new Date(año, mes + 1, 0);
    const totalDiasMes = ultimoDiaMes.getDate();

    const ultimoDiaMesAnterior = new Date(año, mes, 0);
    const totalDiasMesAnterior = ultimoDiaMesAnterior.getDate();

    this.diasCalendario = [];

    for (let i = desfase - 1; i >= 0; i--) {
      const diaNum = totalDiasMesAnterior - i;
      const d = new Date(año, mes - 1, diaNum);
      this.diasCalendario.push({
        dateStr: this.formatLocalISO(d),
        dayNum: diaNum,
        isCurrentMonth: false,
        enabled: false
      });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 1; i <= totalDiasMes; i++) {
      const d = new Date(año, mes, i);
      d.setHours(0, 0, 0, 0);
      this.diasCalendario.push({
        dateStr: this.formatLocalISO(d),
        dayNum: i,
        isCurrentMonth: true,
        enabled: d >= hoy
      });
    }

    const totalCeldas = 42;
    const celdasGeneradas = this.diasCalendario.length;
    for (let i = 1; i <= totalCeldas - celdasGeneradas; i++) {
      const d = new Date(año, mes + 1, i);
      this.diasCalendario.push({
        dateStr: this.formatLocalISO(d),
        dayNum: i,
        isCurrentMonth: false,
        enabled: false
      });
    }
  }

  mesSiguiente() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generarCalendario(this.currentMonth);
  }

  mesAnterior() {
    const hoy = new Date();
    if (this.currentMonth.getFullYear() === hoy.getFullYear() && this.currentMonth.getMonth() <= hoy.getMonth()) {
      return;
    }
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generarCalendario(this.currentMonth);
  }

  esMesActual(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
  }

  trackByDia(index: number, item: any) {
    return typeof item === 'string' ? item : item.dateStr;
  }

  cambiarTipoRecurso(nuevoTipo: 'cancha' | 'quincho') {
    this.tipoRecurso = nuevoTipo;
    if (this.fechaSeleccionada) {
      this.seleccionarDia(this.fechaSeleccionada);
    }
  }

  seleccionarDia(dia: string) {
    this.fechaSeleccionada = dia;
    this.horariosDisponibles$ = this.reservasService.getHorariosDisponibles(dia, this.tipoRecurso).pipe(
      map((horarios: { hora: string, disponible: boolean }[]) => {
        const hoyLocal = this.formatLocalISO(new Date());
        if (dia === hoyLocal) {
          const ahora = new Date();
          return horarios.filter(h => {
            let [hh, mm] = h.hora.split(':').map(Number);
            const partes = dia.split('-');
            const año = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const diaNum = parseInt(partes[2], 10);

            const horaSlot = new Date(año, mes, diaNum, hh, mm, 0, 0);
            if (hh === 0 && mm === 0) {
              horaSlot.setHours(24, 0, 0, 0);
            }
            return horaSlot >= ahora;
          });
        }
        return horarios;
      })
    );
  }

  private datesMatchLocal(dbFecha: any, selectedFechaStr: string): boolean {
    if (!dbFecha || !selectedFechaStr) return false;
    try {
      let clean1 = dbFecha.toString().trim().split('T')[0].split(' ')[0];
      let clean2 = selectedFechaStr.toString().trim().split('T')[0].split(' ')[0];
      return clean1 === clean2;
    } catch {
      return false;
    }
  }

  private hoursMatch(h1: any, h2: any): boolean {
    if (!h1 || !h2) return false;
    try {
      const cleanHour = (h: string) => {
        let s = h.toString().trim();
        if (s.split(':').length >= 2) {
          const parts = s.split(':');
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return s;
      };
      return cleanHour(h1) === cleanHour(h2);
    } catch {
      return false;
    }
  }

  obtenerEstadoSlot(hora: string): { 
    estado: 'disponible' | 'pendiente' | 'aprobado' | 'bloqueado' | 'reservado', 
    label: string, 
    reservaId?: number, 
    usuario?: string, 
    motivo?: string 
  } {
    if (!this.fechaSeleccionada || !this.reservas) {
      return { estado: 'disponible', label: 'Disponible' };
    }
    
    const res = this.reservas.find(r => {
      const tipoMatch = (r.tipo || 'cancha').toLowerCase() === this.tipoRecurso.toLowerCase();
      const fechaMatch = this.datesMatchLocal(r.fecha, this.fechaSeleccionada!);
      const horaMatch = this.hoursMatch(r.hora, hora);
      
      const estadoLower = r.estado ? r.estado.toLowerCase().trim() : '';
      const esActivo = !['cancelada', 'cancelado', 'rechazada', 'rechazado'].includes(estadoLower);
                       
      return tipoMatch && fechaMatch && horaMatch && esActivo;
    });
    
    if (!res) {
      return { estado: 'disponible', label: 'Disponible' };
    }
    
    const estadoLower = res.estado ? res.estado.toLowerCase().trim() : '';
    if (estadoLower.startsWith('bloquead')) {
      return { 
        estado: 'bloqueado', 
        label: 'Bloqueado', 
        reservaId: res.id,
        motivo: res.motivo || 'Uso interno municipal'
      };
    }
    
    if (estadoLower === 'pendiente') {
      return { 
        estado: 'pendiente', 
        label: 'Pendiente', 
        reservaId: res.id,
        usuario: res.usuario || `Usuario ID: ${res.usuario_id}`
      };
    }
    
    if (['aprobado', 'aprobada', 'confirmado', 'confirmada'].includes(estadoLower)) {
      return { 
        estado: 'aprobado', 
        label: 'Aprobado', 
        reservaId: res.id,
        usuario: res.usuario || `Usuario ID: ${res.usuario_id}`
      };
    }
    
    return { 
      estado: 'pendiente', 
      label: 'Reservado', 
      reservaId: res.id,
      usuario: res.usuario || `Usuario ID: ${res.usuario_id}`
    };
  }

  solicitarBloqueo(hora: string, yaReservado: boolean) {
    const defaultReason = 'Uso interno municipal';

    const mostrarPromptMotivo = () => {
      const promptRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          titulo: 'Motivo del Bloqueo',
          mensaje: 'Por favor, ingresa el motivo del bloqueo de este horario:',
          tipo: 'prompt',
          defaultText: defaultReason,
          showCheckbox: this.tipoRecurso === 'cancha',
          checkboxLabel: 'Encender luces en este horario (torneo/evento)'
        }
      });

      promptRef.afterClosed().subscribe(res => {
        if (res) {
          let motivoText = typeof res === 'string' ? res : res.motivo;
          let conLuz = typeof res === 'object' ? !!res.conLuz : false;
          this.bloquearReserva(this.fechaSeleccionada!, hora, motivoText, conLuz);
        }
      });
    };

    if (yaReservado) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          titulo: 'Horario ya Reservado',
          mensaje: 'ATENCIÓN: Este horario ya cuenta con una reserva activa. Si lo bloqueas, se cancelará y se notificará al usuario.',
          tipo: 'confirm'
        }
      });
      dialogRef.afterClosed().subscribe(confirm => {
        if (confirm) mostrarPromptMotivo();
      });
    } else {
      mostrarPromptMotivo();
    }
  }

  bloquearReserva(fecha: string, hora: string, motivo: string, conLuz: boolean = false) {
    this.reservasService.bloquearReserva(fecha, hora, motivo, this.tipoRecurso, conLuz).subscribe({
      next: () => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Bloqueo Exitoso',
            mensaje: '',
            resultado: `El horario de las ${hora} hs fue bloqueado con éxito.`,
            tipo: 'success'
          }
        });
        this.loadReservas();
        if (this.fechaSeleccionada) {
          this.seleccionarDia(this.fechaSeleccionada);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error',
            mensaje: err.message || 'Error al bloquear horario',
            tipo: 'error'
          }
        });
        this.cdr.detectChanges();
      }
    });
  }

  solicitarDesbloqueo(reservaId: number, hora: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Liberar Horario',
        mensaje: `¿Deseas desbloquear el horario de las ${hora} hs para que quede disponible para los usuarios?`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.desbloquearReserva(reservaId, hora);
      }
    });
  }

  desbloquearReserva(reservaId: number, hora: string) {
    this.reservasService.cancelarReserva(reservaId).subscribe({
      next: () => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Horario Liberado',
            mensaje: '',
            resultado: `El horario de las ${hora} hs ha sido desbloqueado y ya está disponible para reservas.`,
            tipo: 'success'
          }
        });
        this.loadReservas();
        if (this.fechaSeleccionada) {
          this.seleccionarDia(this.fechaSeleccionada);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error',
            mensaje: err.message || 'Error al desbloquear horario',
            tipo: 'error'
          }
        });
        this.cdr.detectChanges();
      }
    });
  }

  inicializarHorasMasivo() {
    this.horasMasivo = [];
    for (let h = 7; h <= 24; h++) {
      const hora = h === 24 ? '00:00' : `${h.toString().padStart(2, '0')}:00`;
      this.horasMasivo.push({ hora, selected: false });
    }
  }

  seleccionarTodasHoras() {
    this.horasMasivo.forEach(h => h.selected = true);
  }

  deseleccionarTodasHoras() {
    this.horasMasivo.forEach(h => h.selected = false);
  }

  aplicarBloqueoMasivo() {
    if (!this.fechaDesdeMasivo || !this.fechaHastaMasivo) return;
    const diasSeleccionados = this.diasSemanaMasivo.filter(d => d.selected).map(d => d.value);
    const horasSeleccionadas = this.horasMasivo.filter(h => h.selected).map(h => h.hora);

    if (diasSeleccionados.length === 0 || horasSeleccionadas.length === 0) return;

    this.cargandoMasivo = true;
    this.reservasService.bloquearReservaMasivo(
      this.fechaDesdeMasivo,
      this.fechaHastaMasivo,
      diasSeleccionados,
      horasSeleccionadas,
      this.motivoMasivo,
      this.conLuzMasivo
    ).subscribe({
      next: (res) => {
        this.cargandoMasivo = false;
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Bloqueo Masivo Exitoso',
            mensaje: res.message || 'Se aplicaron los bloqueos masivos correctamente.',
            tipo: 'success'
          }
        });
        this.loadReservas();
        if (this.fechaSeleccionada) {
          this.seleccionarDia(this.fechaSeleccionada);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoMasivo = false;
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error en Bloqueo Masivo',
            mensaje: err.message || 'Ocurrió un error al procesar el bloqueo masivo.',
            tipo: 'error'
          }
        });
        this.cdr.detectChanges();
      }
    });
  }

  cancelarReserva(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Cancelar Reserva',
        mensaje: '¿Estás seguro de cancelar esta reserva?',
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reservasService.cancelarReserva(id).subscribe({
          next: () => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Reserva Cancelada',
                resultado: 'La reserva se canceló correctamente.',
                tipo: 'success'
              }
            });
            this.loadReservas();
            if (this.fechaSeleccionada) {
              this.seleccionarDia(this.fechaSeleccionada);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                resultado: err.message || 'Error al cancelar reserva',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  deshacerAprobacion(reserva: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Deshacer Aprobación de Reserva',
        mensaje: `¿Estás seguro de revertir la aprobación de esta reserva (#${reserva.id})?\n\nEl turno volverá al estado 'Pendiente'.`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reservasService.deshacerAprobacion(reserva.id).subscribe({
          next: () => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Aprobación Revertida',
                resultado: 'La reserva se restableció al estado Pendiente con éxito.',
                tipo: 'success'
              }
            });
            this.loadReservas();
            if (this.fechaSeleccionada) {
              this.seleccionarDia(this.fechaSeleccionada);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                resultado: err?.message || 'Error al deshacer aprobación',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  esReservaActiva(reserva: any): boolean {
    if (!reserva || !reserva.fecha || !reserva.hora) return false;
    const estado = (reserva.estado || '').toLowerCase();
    if (['cancelado', 'cancelada', 'rechazado', 'rechazada'].includes(estado)) {
      return false;
    }
    return true;
  }

  filtrarReservasList(reservas: any[]): any[] {
    if (!this.filtroReservas) return reservas;
    const filter = this.filtroReservas.toLowerCase().trim();
    return reservas.filter(r =>
      (r.usuario && r.usuario.toLowerCase().includes(filter)) ||
      (r.fecha && r.fecha.toLowerCase().includes(filter)) ||
      (r.estado && r.estado.toLowerCase().includes(filter))
    );
  }

  formatFechaLocal(fechaStr: string): string {
    try {
      let clean = (fechaStr || '').toString().trim().split('T')[0].split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  }

  formatFechaISO(fechaStr: any): string {
    if (!fechaStr) return '';
    try {
      return fechaStr.toString().trim().split('T')[0].split(' ')[0];
    } catch {
      return '';
    }
  }

  get reservasFiltradasHistorial(): any[] {
    if (this.filtroTipoHistorial === 'todos') {
      return this.reservas;
    }
    return this.reservas.filter(r => (r.tipo || 'cancha').toLowerCase() === this.filtroTipoHistorial.toLowerCase());
  }

  get totalReservas(): number {
    return this.reservasFiltradasHistorial.filter(r => r.usuario_id).length;
  }

  get totalAprobadas(): number {
    return this.reservasFiltradasHistorial.filter(r => r.usuario_id && ['aprobada', 'aprobado', 'confirmada', 'confirmado'].includes(r.estado?.toLowerCase())).length;
  }

  get totalPendientes(): number {
    return this.reservasFiltradasHistorial.filter(r => r.usuario_id && r.estado?.toLowerCase() === 'pendiente').length;
  }

  get totalCanceladas(): number {
    return this.reservasFiltradasHistorial.filter(r => r.usuario_id && ['cancelada', 'cancelado'].includes(r.estado?.toLowerCase())).length;
  }

  get totalBloqueos(): number {
    return this.reservasFiltradasHistorial.filter(r => !r.usuario_id).length;
  }

  get horarioMasReservado(): { hora: string, count: number } | null {
    const valid = this.reservasFiltradasHistorial.filter(r => r.usuario_id);
    if (valid.length === 0) return null;

    const counts: { [key: string]: number } = {};
    valid.forEach(r => {
      if (r.hora) counts[r.hora] = (counts[r.hora] || 0) + 1;
    });

    let maxHora = '';
    let maxCount = 0;
    Object.keys(counts).forEach(h => {
      if (counts[h] > maxCount) {
        maxCount = counts[h];
        maxHora = h;
      }
    });

    return maxCount > 0 ? { hora: maxHora, count: maxCount } : null;
  }

  get topUsuarios(): { usuario: string, count: number }[] {
    const valid = this.reservasFiltradasHistorial.filter(r => r.usuario_id && r.usuario);
    if (valid.length === 0) return [];

    const counts: { [key: string]: number } = {};
    valid.forEach(r => counts[r.usuario] = (counts[r.usuario] || 0) + 1);

    return Object.keys(counts).map(usuario => ({
      usuario,
      count: counts[usuario]
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  get listadoGeneralFiltrado(): any[] {
    if (!this.reservas) return [];

    const ocupados = this.reservas.filter(r => {
      const coincideRecurso = (r.tipo || 'cancha').toLowerCase() === this.tipoRecurso.toLowerCase();
      if (!coincideRecurso) return false;

      const estadoLower = (r.estado || '').toLowerCase().trim();
      const esActivo = !['cancelada', 'cancelado', 'rechazada', 'rechazado'].includes(estadoLower);
      if (!esActivo) return false;

      if (this.filtroDiaBloqueos) {
        return this.datesMatchLocal(r.fecha, this.filtroDiaBloqueos);
      }
      return true;
    });

    let mappedList: any[] = ocupados.map(r => {
      const estadoLower = (r.estado || '').toLowerCase().trim();
      let estadoMapped: 'bloqueado' | 'pendiente' | 'aprobado' = 'pendiente';
      let labelMapped = 'Reservado';
      
      if (estadoLower.startsWith('bloquead')) {
        estadoMapped = 'bloqueado';
        labelMapped = 'Bloqueado';
      } else if (estadoLower === 'pendiente') {
        estadoMapped = 'pendiente';
        labelMapped = 'Pendiente';
      } else if (['aprobado', 'aprobada', 'confirmado', 'confirmada'].includes(estadoLower)) {
        estadoMapped = 'aprobado';
        labelMapped = 'Aprobado';
      }
      
      return {
        id: r.id,
        fecha: this.formatFechaISO(r.fecha),
        hora: r.hora,
        estado: estadoMapped,
        label: labelMapped,
        motivo: r.motivo || '',
        usuario: r.usuario || `Usuario ID: ${r.usuario_id}`,
        con_luz: !!r.con_luz,
        con_aire: !!r.con_aire
      };
    });

    if (this.filtroDiaBloqueos && (this.filtroEstadoBloqueos === 'todos' || this.filtroEstadoBloqueos === 'disponible')) {
      const todosHorarios: string[] = [];
      if (this.tipoRecurso === 'quincho') {
        todosHorarios.push('10:00', '19:00');
      } else {
        for (let h = 7; h <= 24; h++) {
          todosHorarios.push(h === 24 ? '00:00' : `${h.toString().padStart(2, '0')}:00`);
        }
      }

      const horasOcupadas = mappedList.map(r => (r.hora || '').substring(0, 5));
      let libres = todosHorarios.filter(h => !horasOcupadas.includes(h));
      if (this.tipoRecurso === 'quincho' && horasOcupadas.length > 0) {
        libres = [];
      }

      const disponiblesMapped = libres.map(h => ({
        id: 0,
        fecha: this.filtroDiaBloqueos,
        hora: h,
        estado: 'disponible' as const,
        label: 'Disponible',
        motivo: 'Disponible para reservar',
        usuario: 'N/A',
        con_luz: false,
        con_aire: false
      }));

      mappedList = [...mappedList, ...disponiblesMapped];
    }

    if (this.filtroEstadoBloqueos !== 'todos') {
      mappedList = mappedList.filter(item => item.estado === this.filtroEstadoBloqueos);
    }

    return mappedList.sort((a, b) => {
      const dateA = new Date(a.fecha + 'T' + (a.hora.substring(0, 5) || '00:00'));
      const dateB = new Date(b.fecha + 'T' + (b.hora.substring(0, 5) || '00:00'));
      return dateA.getTime() - dateB.getTime();
    });
  }
}
