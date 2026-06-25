import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasService } from '../services/reservas.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-misreservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misreservas.component.html',
  styleUrls: ['./misreservas.component.css']
})
export class MisReservasComponent {
  reservas$!: Observable<any[]>;
  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef   // 👈 inyectamos ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadReservas();
  }

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservas();
  }

  /* cancelarReserva(id: number): void {
    this.reservasService.cancelarReserva(id).subscribe({
      next: (res) => {
        if (res.ok) {
          this.mensaje = '✅ Reserva cancelada';
          this.errorMessage = null;
          this.loadReservas();

          // Forzamos detección de cambios para que se vea al instante
          this.cdr.detectChanges();

          // Ocultamos el mensaje después de 3 segundos
          setTimeout(() => {
            this.mensaje = null;
            this.cdr.detectChanges();
          }, 3000);
        } else {
          this.errorMessage = res.message;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cancelar reserva';
        this.cdr.detectChanges();
      }
    });
  } */
 cancelarReserva(id: number): void {
  this.reservasService.cancelarReserva(id).subscribe({
    next: (res) => {
      if (res.ok) {
        this.mensaje = '✅ Reserva cancelada';
        this.errorMessage = null;
        this.loadReservas(); // refresca observable

        this.cdr.detectChanges();

        setTimeout(() => {
          this.mensaje = null;
          this.cdr.detectChanges();
        }, 3000);
      } else {
        this.errorMessage = res.message;
        this.cdr.detectChanges();
      }
    },
    error: (err) => {
      this.errorMessage = err.message || 'Error al cancelar reserva';
      this.cdr.detectChanges();
    }
  });
}

}





