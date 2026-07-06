import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasService } from '../services/reservas.service';
import { Observable, map } from 'rxjs'; // 👈 Importamos map desde rxjs

@Component({
  selector: 'app-misreservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misreservas.component.html',
  styleUrls: ['./misreservas.component.css']
})
export class MisReservasComponent implements OnInit {
  reservas$!: Observable<any[]>;
  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadReservas();
  }

  loadReservas(): void {
    const ahora = new Date();

    this.reservas$ = this.reservasService.getReservas().pipe(
      map(reservas => {
        return reservas.filter(r => {
          // 1. Filtrar solo estados activos (excluyendo cancelados/rechazados/bloqueados)
          const estadoLower = r.estado ? r.estado.toLowerCase().trim() : '';
          const esInactivo = estadoLower === 'cancelada' || 
                             estadoLower === 'cancelado' || 
                             estadoLower === 'rechazada' || 
                             estadoLower === 'rechazado' ||
                             estadoLower.startsWith('bloquead');
          
          if (esInactivo) return false;

          // 2. Filtrar turnos expirados (fecha/hora ya transcurridas en el pasado)
          try {
            let cleanFechaStr = r.fecha ? r.fecha.toString().trim() : '';
            // Limpiar formato ISO ("YYYY-MM-DDT...") o con espacios
            if (cleanFechaStr.includes('T')) {
              cleanFechaStr = cleanFechaStr.split('T')[0];
            } else if (cleanFechaStr.includes(' ')) {
              cleanFechaStr = cleanFechaStr.split(' ')[0];
            }
            
            // Convertir DD/MM/YYYY a YYYY-MM-DD
            if (cleanFechaStr.includes('/')) {
              const parts = cleanFechaStr.split('/');
              if (parts.length === 3 && parts[2].length === 4) {
                cleanFechaStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }

            let hh = 0;
            let mm = 0;
            if (r.hora) {
              const timeParts = r.hora.toString().split(':');
              hh = parseInt(timeParts[0], 10) || 0;
              mm = parseInt(timeParts[1], 10) || 0;
            }

            const fechaReserva = new Date(cleanFechaStr + 'T00:00:00');
            fechaReserva.setHours(hh, mm, 0, 0);
            
            const timeVal = fechaReserva.getTime();
            if (isNaN(timeVal)) {
              return true; // En caso de fecha inválida, la mostramos por seguridad
            }
            return timeVal >= ahora.getTime();
          } catch (e) {
            console.error('Error al parsear fecha/hora de reserva:', r, e);
            return true;
          }
        });
      })
    );
  }

  cancelarReserva(id: number): void {
    this.reservasService.cancelarReserva(id).subscribe({
      next: (res) => {
        if (res.ok) {
          this.mensaje = '✅ Reserva cancelada';
          this.errorMessage = null;
          this.loadReservas(); // Refresca observable con el filtro activo

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
}
