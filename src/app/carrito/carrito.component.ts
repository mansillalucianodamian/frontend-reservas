import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../services/carrito.service';
import { ReservasService } from '../services/reservas.service'; // 👈 Importar ReservasService
import { Observable } from 'rxjs';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  carrito$!: Observable<any[]>;
  mensaje: string | null = null;
  isProcessing = false; // 👈 Estado de carga para el overlay
  tipoRecurso: string = 'cancha';

  constructor(
    private carritoService: CarritoService,
    private reservasService: ReservasService, // 👈 Inyectar ReservasService
    private router: Router,
    private route: ActivatedRoute, // 👈 Inyectar ActivatedRoute
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.carrito$ = this.carritoService.carrito$;
    this.route.queryParams.subscribe(params => {
      this.tipoRecurso = params['tipo'] || 'cancha';
    });
  }

  eliminar(reserva: any) {
    this.carritoService.removeReserva(reserva);
  }

  // Helper para obtener el rango de la semana (Lunes a Domingo) libre de desfases de huso horario
  getSemanaRango(fechaStr: string): { inicioStr: string; finStr: string; inicioDate: Date; finDate: Date } {
    const cleanFecha = this.normalizarFecha(fechaStr);
    const partes = cleanFecha.split('-').map(Number);
    if (partes.length === 3) {
      const date = new Date(partes[0], partes[1] - 1, partes[2]);
      const day = date.getDay(); // 0: Dom, 1: Lun, ..., 6: Sab
      const diffLunes = day === 0 ? -6 : 1 - day;
      const lunes = new Date(partes[0], partes[1] - 1, partes[2] + diffLunes);
      const domingo = new Date(partes[0], partes[1] - 1, partes[2] + diffLunes + 6);
      const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        inicioStr: format(lunes),
        finStr: format(domingo),
        inicioDate: lunes,
        finDate: domingo
      };
    }
    const date = new Date(fechaStr + 'T00:00:00');
    const day = date.getDay();
    const diffLunes = day === 0 ? -6 : 1 - day;
    const lunes = new Date(date.setDate(date.getDate() + diffLunes));
    const domingo = new Date(lunes.getTime() + 6 * 24 * 60 * 60 * 1000);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      inicioStr: format(lunes),
      finStr: format(domingo),
      inicioDate: lunes,
      finDate: domingo
    };
  }

  getSemanaId(fechaStr: string): string {
    return this.getSemanaRango(fechaStr).inicioStr;
  }

  esTurnoUltimoMomento(fechaStr: string, horaStr: string): boolean {
    try {
      const cleanFecha = this.normalizarFecha(fechaStr);
      const partes = cleanFecha.split('-').map(Number);
      const [h, m] = (horaStr || '00:00').split(':').map(Number);
      const turnoDate = new Date(partes[0], partes[1] - 1, partes[2], h || 0, m || 0, 0);
      const ahora = new Date();
      const diffMs = turnoDate.getTime() - ahora.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);
      return diffHoras > 0 && diffHoras < 8;
    } catch (e) {
      return false;
    }
  }

  async confirmar() {
    const reservasCart = this.carritoService.getCarrito();
    if (reservasCart.length === 0) return;

    this.mensaje = null;

    // 1. Obtener las reservas confirmadas del usuario desde la base de datos
    this.reservasService.getReservas().subscribe({
      next: (reservasConfirmadas) => {
        // Agrupar reservas confirmadas por semana (representada por el lunes de esa semana)
        const reservasPorSemana: { [semana: string]: number } = {};
        
        reservasConfirmadas.forEach(r => {
          // Filtrar reservas que no estén canceladas, rechazadas o bloqueadas y que sean del tipo cancha
          const estadoLower = r.estado ? r.estado.toLowerCase().trim() : '';
          const esInactivo = estadoLower === 'cancelada' || 
                             estadoLower === 'cancelado' || 
                             estadoLower === 'rechazada' || 
                             estadoLower === 'rechazado' ||
                             estadoLower.startsWith('bloquead');
          
          if (!esInactivo && (r.tipo || 'cancha') === 'cancha') {
            const semId = this.getSemanaId(r.fecha);
            reservasPorSemana[semId] = (reservasPorSemana[semId] || 0) + 1;
          }
        });

        // Simular la suma de reservas del carrito para ver si alguna semana supera el límite
        const cartPorSemana: { [semana: string]: number } = {};
        let errorExcedido = false;
        let detalleError = '';

        for (const r of reservasCart) {
          // Las reservas de quincho no suman para el límite de la cancha
          if ((r.tipo || 'cancha') !== 'cancha') continue;
          
          const semId = this.getSemanaId(r.fecha);
          const yaConfirmadas = reservasPorSemana[semId] || 0;
          const enCarrito = cartPorSemana[semId] || 0;

          // ¿Este turno es de último momento (< 8 hs)?
          const esExpress = this.esTurnoUltimoMomento(r.fecha, r.hora);
          const maxPermitido = esExpress ? 3 : 2;

          if (yaConfirmadas + enCarrito + 1 > maxPermitido) {
            errorExcedido = true;
            
            const rango = this.getSemanaRango(r.fecha);
            const formatFecha = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            if (maxPermitido === 2) {
              detalleError = `Superas el límite de 2 reservas semanales para la semana del ${formatFecha(rango.inicioDate)} (Lunes) al ${formatFecha(rango.finDate)} (Domingo). ` +
                             `Ya tienes ${yaConfirmadas} reserva(s) confirmada(s) y estás intentando sumar ${enCarrito + 1} más en tu carrito. ` +
                             `Recuerda que se habilita una 3ra reserva si faltan menos de 8 horas para el turno.`;
            } else {
              detalleError = `Superas el cupo máximo de 3 reservas semanales (incluyendo turno express de último momento) para la semana del ${formatFecha(rango.inicioDate)} (Lunes) al ${formatFecha(rango.finDate)} (Domingo). ` +
                             `Ya tienes ${yaConfirmadas} reserva(s) y estás intentando sumar ${enCarrito + 1} más.`;
            }
            break;
          }
          cartPorSemana[semId] = enCarrito + 1;
        }

        if (errorExcedido) {
          // Abrir modal bloqueado indicando límite semanal excedido
          this.dialog.open(ConfirmDialogComponent, {
            maxWidth: '95vw',
            width: '420px',
            data: {
              titulo: 'Límite Semanal Excedido',
              mensaje: detalleError,
              tipo: 'error',
              resultado: 'No se pueden confirmar las reservas',
              bloqueado: true
            }
          });
          return;
        }

        // Si pasa el control, abrir el diálogo de confirmación normal
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          maxWidth: '95vw',
          width: '420px',
          data: {
            titulo: 'Confirmar Reservas',
            mensaje: 'Estás por confirmar las siguientes reservas de cancha:',
            reservas: reservasCart,
            tipo: 'confirm'
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.realizarConfirmacion();
          }
        });
      },
      error: (err) => {
        console.error('Error al verificar reservas confirmadas:', err);
        // Fallback a confirmación directa si falla el servicio de verificación
        this.abrirConfirmacionDirecta(reservasCart);
      }
    });
  }

  realizarConfirmacion() {
    this.isProcessing = true; // 👈 Activar bloqueo de pantalla y spinner
    this.cd.detectChanges();

    this.carritoService.confirmarCarrito()
      .then(() => {
        this.isProcessing = false; // 👈 Desactivar bloqueo al terminar con éxito
        this.cd.detectChanges();

        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Reservas Confirmadas',
            mensaje: '',
            resultado: 'Las reservas fueron confirmadas correctamente',
            tipo: 'success'
          }
        });
        this.carritoService.clearCarrito();
        const ultimaReserva = this.carritoService.getCarrito().slice(-1)[0];
        const fecha = ultimaReserva ? ultimaReserva.fecha : null;
        this.router.navigate(['/reservas'], { queryParams: { refresh: 'true', fecha, tipo: this.tipoRecurso } });
      })
      .catch(err => {
        this.isProcessing = false; // 👈 Desactivar bloqueo en caso de error
        this.cd.detectChanges();

        const errorMsg = err?.error?.message 
          || (typeof err?.error === 'string' ? err.error : null)
          || err?.message 
          || (typeof err === 'string' ? err : 'Ocurrió un error al procesar las reservas');

        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error al Confirmar',
            mensaje: '',
            resultado: errorMsg,
            tipo: 'error'
          }
        });
      });
  }

  abrirConfirmacionDirecta(reservasCart: any[]) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      width: '420px',
      data: {
        titulo: 'Confirmar Reservas',
        mensaje: 'Estás por confirmar las siguientes reservas de cancha:',
        reservas: reservasCart,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.realizarConfirmacion();
      }
    });
  }

  calcularTotal(carrito: any[]): number {
    return carrito.reduce((acc, item) => acc + (item.costo || 0), 0);
  }

  seguirComprando() {
    const ultimaReserva = this.carritoService.getCarrito().slice(-1)[0];
    const fecha = ultimaReserva ? ultimaReserva.fecha : null;
    this.router.navigate(['/reservas'], { queryParams: { refresh: 'true', fecha, tipo: this.tipoRecurso } });
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

  esMesCorriente(fechaStr: string): boolean {
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

      return añoReserva === añoActual && mesReserva === mesActual;
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
