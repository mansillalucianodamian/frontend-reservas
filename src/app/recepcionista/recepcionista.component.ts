import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ necesario para [(ngModel)]
import { ReservasService } from '../services/reservas.service';
import { Observable } from 'rxjs';
import { UserFilterPipe } from '../pipes/user-filter.pipe'; // importa el pipe

// 👇 Importamos Angular Material Dialog y nuestro ConfirmDialog
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-recepcionista',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFilterPipe],
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
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog // ✅ inyectamos el servicio de diálogos
  ) { }

  ngOnInit(): void {
    this.reservas$ = this.reservasService.getReservasPendientes();
  }

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservasPendientes();
  }

  aprobarReserva(id: number): void {
    // Paso 1: Confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Confirmar aprobación',
        mensaje: '¿Estás seguro de aprobar esta reserva?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reservasService.aprobarReserva(id).subscribe({
          next: (res) => {
            if (res.ok) {
              this.dialog.open(ConfirmDialogComponent, {
                data: {
                  titulo: 'Reserva aprobada',
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
}



