import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ necesario para [(ngModel)]
import { ReservasService } from '../services/reservas.service';
import { Observable } from 'rxjs';
import { UserFilterPipe } from '../pipes/user-filter.pipe'; // importa el pipe
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-recepcionista',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFilterPipe],
  templateUrl: './recepcionista.component.html',
  styleUrls: ['./recepcionista.component.css']
})
export class RecepcionistaComponent implements OnInit {
  reservas$!: Observable<any[]>;
  filtroUsuario: string = '';
  mensaje: string | null = null;
  errorMessage: string | null = null;
  isProcessing: boolean = false;
  
  // 🔹 Gestión del precio de la cancha
  precioCancha: number = 5000;
  isUpdatingPrice: boolean = false;

  constructor(
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadReservas();
    this.cargarPrecioCancha();
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

        // Limpiar el mensaje de éxito tras 4 segundos
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

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservasPendientes();
  }

  aprobarReserva(id: number): void {
    // Paso 1: Confirmación
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
                  resultado: '✅ La reserva fue aprobada correctamente',
                  tipo: 'success'
                }
              });
              this.loadReservas();
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
