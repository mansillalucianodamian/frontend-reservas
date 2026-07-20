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

  // Helper para obtener la fecha de inicio de semana (domingo) libre de desfases de huso horario
  getSemanaId(fechaStr: string): string {
    const date = new Date(fechaStr + 'T00:00:00');
    const diff = date.getDate() - date.getDay();
    const sunday = new Date(date.setDate(diff));
    
    const yyyy = sunday.getFullYear();
    const mm = String(sunday.getMonth() + 1).padStart(2, '0');
    const dd = String(sunday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async confirmar() {
    const reservasCart = this.carritoService.getCarrito();
    if (reservasCart.length === 0) return;

    this.mensaje = null;

    // 1. Obtener las reservas confirmadas del usuario desde la base de datos
    this.reservasService.getReservas().subscribe({
      next: (reservasConfirmadas) => {
        // Agrupar reservas confirmadas por semana (representada por el domingo de esa semana)
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

        // Simular la suma de reservas del carrito para ver si alguna semana supera el límite de 2
        const cartPorSemana: { [semana: string]: number } = {};
        let errorExcedido = false;
        let detalleError = '';

        for (const r of reservasCart) {
          // Las reservas de quincho no suman para el límite de la cancha
          if ((r.tipo || 'cancha') !== 'cancha') continue;
          
          const semId = this.getSemanaId(r.fecha);
          const yaConfirmadas = reservasPorSemana[semId] || 0;
          const enCarrito = cartPorSemana[semId] || 0;

          if (yaConfirmadas + enCarrito + 1 > 2) {
            errorExcedido = true;
            
            const inicioDate = new Date(semId + 'T00:00:00');
            const finDate = new Date(inicioDate);
            finDate.setDate(inicioDate.getDate() + 6);
            
            const formatFecha = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            detalleError = `Superas el límite de 2 reservas semanales para la semana del ${formatFecha(inicioDate)} al ${formatFecha(finDate)}. ` +
                           `Ya tienes ${yaConfirmadas} reserva(s) confirmada(s) y estás intentando sumar ${enCarrito + 1} más en tu carrito actual.`;
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

        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error al Confirmar',
            mensaje: '',
            resultado: err?.message || 'Ocurrió un error al procesar las reservas',
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
}
