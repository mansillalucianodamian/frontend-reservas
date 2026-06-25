import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs'; // ✅ Tabs
import { UsuariosService } from '../services/usuario.service';
import { ReservasService } from '../services/reservas.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, MatTabsModule], // ✅ agregamos MatTabsModule
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperAdminComponent {
  usuarios$!: Observable<any[]>;
  reservas$!: Observable<any[]>;
  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private usuariosService: UsuariosService,
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadReservas();
  }

  loadUsuarios(): void {
    this.usuarios$ = this.usuariosService.getUsuarios();
  }

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservas();
  }

  asignarRol(id: number, nuevoRol: string): void {
    this.usuariosService.asignarRol(id, nuevoRol).subscribe({
      next: (res) => {
        this.mensaje = res.message || 'Rol actualizado';
        this.loadUsuarios();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al asignar rol';
        this.cdr.detectChanges();
      }
    });
  }

  cancelarReserva(id: number): void {
    this.reservasService.cancelarReserva(id).subscribe({
      next: (res) => {
        this.mensaje = res.message || 'Reserva cancelada';
        this.loadReservas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cancelar reserva';
        this.cdr.detectChanges();
      }
    });
  }
  eliminarUsuario(id: number): void {
  this.usuariosService.eliminarUsuario(id).subscribe({
    next: (res) => {
      this.mensaje = res.message || 'Usuario eliminado';
      this.loadUsuarios();
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.errorMessage = err.message || 'Error al eliminar usuario';
      this.cdr.detectChanges();
    }
  });
}

bloquearReserva(fecha: string, hora: string, motivo: string): void {
  this.reservasService.bloquearReserva(fecha, hora, motivo).subscribe({
    next: (res) => {
      this.mensaje = res.message || 'Horario bloqueado';
      this.loadReservas();
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.errorMessage = err.message || 'Error al bloquear horario';
      this.cdr.detectChanges();
    }
  });
}
}

