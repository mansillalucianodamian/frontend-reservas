import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ necesario para [(ngModel)]
import { ReservasService } from '../services/reservas.service';
import { Observable } from 'rxjs';
import { UserFilterPipe } from '../pipes/user-filter.pipe'; // importa el pipe

@Component({
  selector: 'app-recepcionista',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFilterPipe], // ✅ agregamos FormsModule y el Pipe
  templateUrl: './recepcionista.component.html',
  styleUrls: ['./recepcionista.component.css']
})
export class RecepcionistaComponent {
  reservas$!: Observable<any[]>;
  filtroUsuario: string = '';
  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  this.reservas$ = this.reservasService.getReservasPendientes();
  
}

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservasPendientes();
  }

  aprobarReserva(id: number): void {
    this.reservasService.aprobarReserva(id).subscribe({
      next: (res) => {
        if (res.ok) {
          this.mensaje = '✅ Reserva aprobada';
          this.errorMessage = null;
          this.loadReservas();
          this.cdr.detectChanges();
          setTimeout(() => { this.mensaje = null; this.cdr.detectChanges(); }, 3000);
        } else {
          this.errorMessage = res.message;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al aprobar reserva';
        this.cdr.detectChanges();
      }
    });
  }


}


