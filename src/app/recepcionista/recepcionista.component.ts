import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ necesario para [(ngModel)]
import { MatTabsModule } from '@angular/material/tabs'; // ✅ Tabs
import { ReservasService } from '../services/reservas.service';
import { Observable, tap } from 'rxjs';
import { UserFilterPipe } from '../pipes/user-filter.pipe'; // importa el pipe
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-recepcionista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, UserFilterPipe],
  templateUrl: './recepcionista.component.html',
  styleUrls: ['./recepcionista.component.css']
})
export class RecepcionistaComponent implements OnInit, OnDestroy {
  reservas$!: Observable<any[]>;
  totalPendientes: number = 0;
  filtroUsuario: string = '';
  mensaje: string | null = null;
  errorMessage: string | null = null;
  isProcessing: boolean = false;
  userRole: string = 'recepcionista';
  
  // 🔹 Gestión del precio de la cancha
  precioCancha: number = 5000;
  isUpdatingPrice: boolean = false;

  // 🔹 Gestión de las tarifas del quincho
  precioQuincho: number = 21500;
  isUpdatingQuinchoPrice: boolean = false;

  // 🔹 Aprobaciones Recientes en período de gracia (15 min)
  aprobacionesRecientes: any[] = [];

  // 🔹 Historial y Gestión de Reservas (Búsqueda bajo demanda)
  todasReservas: any[] = [];
  cargandoHistorial: boolean = false;
  busquedaRealizada: boolean = false;

  // Filtros de la pestaña Historial / Gestión
  filtroHistorialTipo: 'todos' | 'cancha' | 'quincho' = 'todos';
  filtroHistorialEstado: 'todos' | 'pendiente' | 'aprobado' | 'cancelado' | 'bloqueado' = 'todos';
  filtroHistorialFecha: string = '';
  filtroHistorialHorario: string = 'todos';
  filtroHistorialBusqueda: string = '';

  // Timer para actualización dinámica del tiempo de gracia
  private intervalId: any = null;

  // Lista estándar de horarios disponibles para el filtro
  readonly listaHorarios: string[] = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
  ];

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('rol') || sessionStorage.getItem('rol') || 'recepcionista';
    this.loadReservas();
    this.cargarAprobacionesRecientes();
    this.cargarPrecioCancha();
    this.cargarPrecioQuincho();

    // Actualizar la vista cada 15 segundos para refrescar los minutos del período de gracia en vivo
    this.intervalId = setInterval(() => {
      if (this.aprobacionesRecientes.length > 0) {
        this.aprobacionesRecientes = this.aprobacionesRecientes.filter(r => this.estaEnPeriodoGracia(r));
      }
      this.cdr.detectChanges();
    }, 15000);
  }

  cargarAprobacionesRecientes(): void {
    this.reservasService.getAprobacionesRecientes().subscribe({
      next: (res) => {
        this.aprobacionesRecientes = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar aprobaciones recientes:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarPrecioCancha(): void {
    this.reservasService.getPrecioCancha().subscribe({
      next: (res) => {
        if (res && res.ok) {
          this.precioCancha = res.precio;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar precio de cancha:', err)
    });
  }

  cargarPrecioQuincho(): void {
    this.reservasService.getPrecioQuincho().subscribe({
      next: (res) => {
        if (res && res.ok) {
          this.precioQuincho = res.precio;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar precio de quincho:', err)
    });
  }

  guardarPrecio(): void {
    if (this.precioCancha <= 0) {
      this.errorMessage = 'El precio debe ser un número entero positivo';
      this.mensaje = null;
      return;
    }

    this.isUpdatingPrice = true;
    this.errorMessage = null;
    this.mensaje = null;

    this.reservasService.updatePrecioCancha(this.precioCancha).subscribe({
      next: (res) => {
        this.isUpdatingPrice = false;
        this.mensaje = 'Precio de la cancha actualizado con éxito';
        this.errorMessage = null;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mensaje = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.isUpdatingPrice = false;
        this.errorMessage = err.error?.message || 'Error al actualizar el precio';
        this.mensaje = null;
        this.cdr.detectChanges();
      }
    });
  }

  guardarPrecioQuincho(): void {
    if (this.precioQuincho <= 0) {
      this.errorMessage = 'El precio debe ser un número entero positivo';
      this.mensaje = null;
      return;
    }

    this.isUpdatingQuinchoPrice = true;
    this.errorMessage = null;
    this.mensaje = null;

    this.reservasService.updatePrecioQuincho(this.precioQuincho, 0).subscribe({
      next: (res) => {
        this.isUpdatingQuinchoPrice = false;
        this.mensaje = 'Tarifas del quincho actualizadas con éxito';
        this.errorMessage = null;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mensaje = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.isUpdatingQuinchoPrice = false;
        this.errorMessage = err.error?.message || 'Error al actualizar las tarifas del quincho';
        this.mensaje = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservasPendientes().pipe(
      tap(list => {
        this.totalPendientes = list ? list.length : 0;
      })
    );
  }

  // 🔹 Ejecutar búsqueda / filtro bajo demanda en el backend
  ejecutarBusqueda(): void {
    this.cargandoHistorial = true;
    this.busquedaRealizada = true;

    const filtros = {
      tipo: this.filtroHistorialTipo,
      estado: this.filtroHistorialEstado,
      fecha: this.filtroHistorialFecha || undefined,
      hora: this.filtroHistorialHorario !== 'todos' ? this.filtroHistorialHorario : undefined,
      busqueda: this.filtroHistorialBusqueda || undefined
    };

    this.reservasService.getReservas(filtros).subscribe({
      next: (res) => {
        this.todasReservas = res || [];
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al consultar reservas filtradas:', err);
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroHistorialTipo = 'todos';
    this.filtroHistorialEstado = 'todos';
    this.filtroHistorialFecha = '';
    this.filtroHistorialHorario = 'todos';
    this.filtroHistorialBusqueda = '';
    this.todasReservas = [];
    this.busquedaRealizada = false;
    this.cdr.detectChanges();
  }

  aprobarReserva(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Confirmar Aprobación',
        mensaje: '¿Estás seguro de aprobar esta reserva y confirmar el pago?',
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isProcessing = true;
        this.cdr.detectChanges();
        this.reservasService.aprobarReserva(id).subscribe({
          next: (res) => {
            this.isProcessing = false;
            this.cdr.detectChanges();
            if (res.ok) {
              this.dialog.open(ConfirmDialogComponent, {
                data: {
                  titulo: 'Reserva Aprobada',
                  mensaje: '',
                  resultado: 'La reserva fue aprobada correctamente. Tienes un período de gracia de 15 minutos para deshacer esta acción si fue un error.',
                  tipo: 'success'
                }
              });
              this.loadReservas();
              this.cargarAprobacionesRecientes();
              if (this.busquedaRealizada) {
                this.ejecutarBusqueda();
              }
            } else {
              this.dialog.open(ConfirmDialogComponent, {
                data: {
                  titulo: 'Error',
                  mensaje: '',
                  resultado: res.message,
                  tipo: 'error'
                }
              });
            }
          },
          error: (err) => {
            this.isProcessing = false;
            this.cdr.detectChanges();
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: '',
                resultado: err.message || 'Error al aprobar reserva',
                tipo: 'error'
              }
            });
          }
        });
      }
    });
  }

  deshacerAprobacion(reserva: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Deshacer Aprobación',
        mensaje: `¿Estás seguro de revertir la aprobación de esta reserva (#${reserva.id}) para ${reserva.usuario || 'el usuario'} (${this.formatFechaLocal(reserva.fecha)} a las ${reserva.hora} hs)?\n\nEl turno volverá al estado 'Pendiente' de acreditación de pago.`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isProcessing = true;
        this.cdr.detectChanges();

        this.reservasService.deshacerAprobacion(reserva.id).subscribe({
          next: (res) => {
            this.isProcessing = false;
            this.cdr.detectChanges();
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Aprobación Deshecha',
                mensaje: '',
                resultado: 'La reserva se restableció al estado Pendiente con éxito.',
                tipo: 'success'
              }
            });
            this.loadReservas();
            this.cargarAprobacionesRecientes();
            if (this.busquedaRealizada) {
              this.ejecutarBusqueda();
            }
          },
          error: (err) => {
            this.isProcessing = false;
            this.cdr.detectChanges();
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'No se pudo revertir',
                mensaje: '',
                resultado: err?.message || 'Error al deshacer aprobación. Es posible que hayan transcurrido los 15 minutos de gracia.',
                tipo: 'error'
              }
            });
          }
        });
      }
    });
  }

  // 🔹 Helper para verificar si está dentro del período de gracia (15 min)
  estaEnPeriodoGracia(reserva: any): boolean {
    if (!reserva || (reserva.estado || '').toLowerCase() !== 'aprobado') {
      return false;
    }
    if (this.userRole === 'super_admin') {
      return true;
    }
    if (!reserva.fecha_aprobacion) {
      return false;
    }
    try {
      const fechaAprobacion = new Date(reserva.fecha_aprobacion);
      if (isNaN(fechaAprobacion.getTime())) return false;
      const ahora = new Date();
      const diffMs = ahora.getTime() - fechaAprobacion.getTime();
      const diffMin = diffMs / (1000 * 60);
      return diffMin >= 0 && diffMin <= 15;
    } catch (e) {
      return false;
    }
  }

  // 🔹 Minutos restantes del período de gracia
  minutosGraciaRestantes(reserva: any): number {
    if (!reserva || !reserva.fecha_aprobacion) return 0;
    try {
      const fechaAprobacion = new Date(reserva.fecha_aprobacion);
      if (isNaN(fechaAprobacion.getTime())) return 0;
      const ahora = new Date();
      const diffMs = ahora.getTime() - fechaAprobacion.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const restantes = 15 - diffMin;
      return Math.max(0, restantes);
    } catch (e) {
      return 0;
    }
  }

  formatLocalISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  esFechaHoy(): boolean {
    return this.filtroHistorialFecha === this.formatLocalISO(new Date());
  }

  esFechaManana(): boolean {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return this.filtroHistorialFecha === this.formatLocalISO(manana);
  }

  establecerFiltroFecha(opcion: 'hoy' | 'manana' | 'todas'): void {
    if (opcion === 'todas') {
      this.filtroHistorialFecha = '';
    } else if (opcion === 'hoy') {
      const hoy = new Date();
      this.filtroHistorialFecha = this.formatLocalISO(hoy);
    } else if (opcion === 'manana') {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      this.filtroHistorialFecha = this.formatLocalISO(manana);
    }
    // Ejecutar búsqueda automáticamente al cambiar filtro rápido de fecha
    this.ejecutarBusqueda();
  }

  seleccionarTipo(tipo: 'todos' | 'cancha' | 'quincho'): void {
    this.filtroHistorialTipo = tipo;
    if (this.busquedaRealizada) {
      this.ejecutarBusqueda();
    }
  }

  seleccionarEstado(estado: 'todos' | 'pendiente' | 'aprobado' | 'cancelado' | 'bloqueado'): void {
    this.filtroHistorialEstado = estado;
    if (this.busquedaRealizada) {
      this.ejecutarBusqueda();
    }
  }

  formatFechaLocal(fechaStr: string): string {
    try {
      let cleanFechaStr = fechaStr ? fechaStr.toString().trim() : '';
      if (cleanFechaStr.includes('T')) {
        cleanFechaStr = cleanFechaStr.split('T')[0];
      } else if (cleanFechaStr.includes(' ')) {
        cleanFechaStr = cleanFechaStr.split(' ')[0];
      }
      
      if (cleanFechaStr.includes('/')) {
        const parts = cleanFechaStr.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          cleanFechaStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const date = new Date(cleanFechaStr + 'T00:00:00');
      if (isNaN(date.getTime())) {
        return fechaStr;
      }

      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const diaSemana = dias[date.getDay()];
      const diaMes = date.getDate();
      const mes = meses[date.getMonth()];

      return `${diaSemana}, ${diaMes} de ${mes}`;
    } catch (e) {
      return fechaStr;
    }
  }

  normalizarFecha(fechaStr: any): string {
    if (!fechaStr) return '';
    try {
      let clean = fechaStr.toString().trim();
      if (clean.includes('T')) {
        clean = clean.split('T')[0];
      } else if (clean.includes(' ')) {
        clean = clean.split(' ')[0];
      }
      if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      return clean;
    } catch (e) {
      return '';
    }
  }

  esMesCorrienteOPasado(fechaStr: string): boolean {
    const normalized = this.normalizarFecha(fechaStr);
    if (!normalized) return false;
    try {
      const partes = normalized.split('-');
      if (partes.length < 2) return false;
      const añoReserva = parseInt(partes[0], 10);
      const mesReserva = parseInt(partes[1], 10);

      const hoy = new Date();
      const añoActual = hoy.getFullYear();
      const mesActual = hoy.getMonth() + 1;

      if (añoActual > añoReserva) return true;
      if (añoActual === añoReserva) return mesActual >= mesReserva;
      return false;
    } catch (e) {
      return false;
    }
  }

  obtenerNombreMes(fechaStr: string): string {
    const normalized = this.normalizarFecha(fechaStr);
    if (!normalized) return '';
    try {
      const partes = normalized.split('-');
      const mes = parseInt(partes[1], 10);
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return nombresMeses[mes - 1] || '';
    } catch (e) {
      return '';
    }
  }
}
