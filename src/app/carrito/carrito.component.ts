import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../services/carrito.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent {
  carrito$!: Observable<any[]>;   // 👈 observable para el carrito
  mensaje: string | null = null;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.carrito$ = this.carritoService.carrito$; // 👈 expuesto como observable desde el servicio
  }

  eliminar(reserva: any) {
    this.carritoService.removeReserva(reserva);
  }

  async confirmar() {
    // Obtenemos todas las reservas del carrito
    const reservas = this.carritoService.getCarrito();
    const ultimaReserva = reservas.slice(-1)[0];
    const fecha = ultimaReserva ? ultimaReserva.fecha : null;

    // 👇 Abrimos el modal con todas las reservas
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
  maxWidth: '95vw',
  width: '400px',
  data: { reservas }
});

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // ✅ Confirmó en el modal
        this.carritoService.confirmarCarrito()
          .then(() => {
            this.mensaje = '✅ Reservas confirmadas';
            this.carritoService.clearCarrito();
            this.router.navigate(['/reservas'], { queryParams: { refresh: 'true', fecha } });
          })
          .catch(err => {
            console.error('Error al confirmar carrito:', err);
            this.mensaje = err?.message || '❌ Error al confirmar reservas';
          });
      } else {
        // ❌ Canceló en el modal → no hacemos nada
        this.mensaje = 'Reserva cancelada';
      }
    });
  }


  calcularTotal(carrito: any[]): number {
    return carrito.reduce((acc, item) => acc + (item.costo || 0), 0);
  }

  seguirComprando() {
    // 👇 Igual que confirmar, usamos la última reserva para refrescar
    const ultimaReserva = this.carritoService.getCarrito().slice(-1)[0];
    const fecha = ultimaReserva ? ultimaReserva.fecha : null;

    this.router.navigate(['/reservas'], { queryParams: { refresh: 'true', fecha } });
  }
}



