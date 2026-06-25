import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservasService } from '../services/reservas.service';
import { AuthService } from '../services/auth.service';
import { CarritoService } from '../services/carrito.service';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent {
  diasDisponibles: string[] = [];
  horariosDisponibles$!: Observable<string[]>;
  fechaSeleccionada: string | null = null;
  horaSeleccionada: string | null = null;
  costoCancha: number = 5000;
  mensaje: string | null = null;

  constructor(
    private reservasService: ReservasService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private carritoService: CarritoService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.generarSemana();
    this.route.queryParams.subscribe(params => {
      if (params['refresh'] === 'true' && this.fechaSeleccionada) {
        this.seleccionarDia(this.fechaSeleccionada);
      }
    });
  }

  private generarSemana() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diaSemana = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
    lunes.setHours(0, 0, 0, 0);

    this.diasDisponibles = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      d.setHours(0, 0, 0, 0);
      if (d >= hoy) {
        this.diasDisponibles.push(d.toISOString().split('T')[0]);
      }
    }
  }

  seleccionarDia(dia: string) {
    this.fechaSeleccionada = dia;
    this.horaSeleccionada = null;
    this.mensaje = null;

    this.horariosDisponibles$ = this.reservasService.getHorariosDisponibles(dia).pipe(
      map((horarios: { hora: string, disponible: boolean }[]) => {
        let libres = horarios.filter(h => h.disponible).map(h => h.hora);

        const hoyLocal = new Date().toLocaleDateString('en-CA');
        if (dia === hoyLocal) {
          const ahora = new Date();
          libres = libres.filter(horaStr => {
            let [hh, mm] = horaStr.split(':').map(Number);
            const partes = dia.split('-');
            const año = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const diaNum = parseInt(partes[2], 10);

            const horaSlot = new Date(año, mes, diaNum, hh, mm, 0, 0);
            if (hh === 0 && mm === 0) {
              horaSlot.setHours(24, 0, 0, 0);
            }
            return horaSlot >= ahora;
          });
        }

        return libres;
      })
    );
  }

  seleccionarHorario(hora: string) {
    this.horaSeleccionada = hora;
    this.mensaje = null;
  }

  agregarAlCarrito() {
    if (!this.authService.isLoggedIn()) {
      this.mensaje = '⚠️ Debes iniciar sesión antes de reservar';
      return;
    }
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      this.mensaje = 'Debes seleccionar fecha y hora';
      return;
    }
    const existe = this.carritoService.getCarrito().some(r =>
      r.fecha === this.fechaSeleccionada && r.hora === this.horaSeleccionada
    );
    if (existe) {
      this.mensaje = '⚠️ Ese horario ya está en el carrito';
      return;
    }
    const reserva = {
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada,
      costo: this.costoCancha
    };
    try {
      this.carritoService.addReserva(reserva);
      this.mensaje = '✅ Reserva agregada al carrito';
      this.router.navigate(['/carrito']);
    } catch (err: any) {
      console.error('Error al agregar reserva:', err);
      this.mensaje = err.message || '❌ No se pudo agregar la reserva';
    }
  }

  irLogin() { this.router.navigate(['/login']); }
  trackByDia(index: number, item: string) { return item; }
  verMisReservas() { this.router.navigate(['/mis-reservas']); }
  verCarrito() { this.router.navigate(['/carrito']); }
  abrirConfirmacion(reserva: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '350px', data: reserva });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.carritoService.addReserva(reserva);
        this.router.navigate(['/reservas'], { queryParams: { refresh: 'true' } });
      }
    });
  }
}
