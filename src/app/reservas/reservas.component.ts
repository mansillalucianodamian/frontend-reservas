import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReservasService } from '../services/reservas.service';
import { AuthService } from '../services/auth.service';
import { CarritoService } from '../services/carrito.service';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SolicitudQuinchoDialogComponent } from '../solicitud-quincho-dialog/solicitud-quincho-dialog.component';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent {
  tipoRecurso: string = 'cancha';
  costoTotalQuincho: number = 21500;

  diasDisponibles: string[] = [];
  currentMonth: Date = new Date();
  diasCalendario: { dateStr: string; dayNum: number; isCurrentMonth: boolean; enabled: boolean }[] = [];
  nombresDias: string[] = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  horariosDisponibles$!: Observable<string[]>;
  fechaSeleccionada: string | null = null;
  horaSeleccionada: string | null = null;
  costoCancha: number = 5000;
  mensaje: string | null = null;
  carrito$!: Observable<any[]>;

  constructor(
    private reservasService: ReservasService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private carritoService: CarritoService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.carrito$ = this.carritoService.carrito$;
    this.currentMonth = new Date();

    this.route.queryParams.subscribe(params => {
      this.tipoRecurso = params['tipo'] || 'cancha';
      
      // Volver a generar calendario con las reglas del nuevo tipo
      this.generarCalendario(this.currentMonth);
      
      if (params['refresh'] === 'true' && this.fechaSeleccionada) {
        this.seleccionarDia(this.fechaSeleccionada);
      }

      // Cargar precio/seña según tipo
      if (this.tipoRecurso === 'quincho') {
        this.reservasService.getPrecioQuincho().subscribe({
          next: (res) => {
            if (res && res.ok) {
              this.costoTotalQuincho = res.precio;
            }
          },
          error: (err) => console.error('Error al cargar tarifas de quincho:', err)
        });
      } else {
        this.reservasService.getPrecioCancha().subscribe({
          next: (res) => {
            if (res && res.ok) {
              this.costoCancha = res.precio;
            }
          },
          error: (err) => console.error('Error al cargar el precio de la cancha:', err)
        });
      }
    });
  }

  private formatLocalISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  generarCalendario(referencia: Date) {
    const año = referencia.getFullYear();
    const mes = referencia.getMonth();

    const primerDiaMes = new Date(año, mes, 1);
    let diaSemanaPrimerDia = primerDiaMes.getDay();
    let desfase = diaSemanaPrimerDia === 0 ? 6 : diaSemanaPrimerDia - 1;

    const ultimoDiaMes = new Date(año, mes + 1, 0);
    const totalDiasMes = ultimoDiaMes.getDate();

    const ultimoDiaMesAnterior = new Date(año, mes, 0);
    const totalDiasMesAnterior = ultimoDiaMesAnterior.getDate();

    this.diasCalendario = [];

    // Rellenar días del mes anterior
    for (let i = desfase - 1; i >= 0; i--) {
      const diaNum = totalDiasMesAnterior - i;
      const d = new Date(año, mes - 1, diaNum);
      this.diasCalendario.push({
        dateStr: this.formatLocalISO(d),
        dayNum: diaNum,
        isCurrentMonth: false,
        enabled: false
      });
    }

    // Rellenar días del mes actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const finSemanaHabilitada = new Date(hoy);
    finSemanaHabilitada.setDate(hoy.getDate() + 7);
    finSemanaHabilitada.setHours(23, 59, 59, 999);

    for (let i = 1; i <= totalDiasMes; i++) {
      const d = new Date(año, mes, i);
      d.setHours(0, 0, 0, 0);

      const dateStr = this.formatLocalISO(d);
      const enabled = this.esDiaHabilitado(dateStr);

      this.diasCalendario.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        enabled
      });
    }

    // Rellenar días del mes siguiente para completar 42 celdas
    const totalCeldas = 42;
    const celdasGeneradas = this.diasCalendario.length;
    for (let i = 1; i <= totalCeldas - celdasGeneradas; i++) {
      const d = new Date(año, mes + 1, i);
      this.diasCalendario.push({
        dateStr: this.formatLocalISO(d),
        dayNum: i,
        isCurrentMonth: false,
        enabled: false
      });
    }
  }

  mesSiguiente() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generarCalendario(this.currentMonth);
  }

  mesAnterior() {
    const hoy = new Date();
    if (this.currentMonth.getFullYear() === hoy.getFullYear() && this.currentMonth.getMonth() <= hoy.getMonth()) {
      return;
    }
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generarCalendario(this.currentMonth);
  }

  esMesActual(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
  }

  esDiaHabilitado(dia: string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const partes = dia.split('-');
    const año = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const diaNum = parseInt(partes[2], 10);

    const d = new Date(año, mes, diaNum);
    d.setHours(0, 0, 0, 0);

    if (this.tipoRecurso === 'quincho') {
      // Habilitar todo el mes actual y el mes siguiente
      const finMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0); // último día del mes siguiente
      return d >= hoy && d <= finMesSiguiente;
    } else {
      const finSemanaHabilitada = new Date(hoy);
      finSemanaHabilitada.setDate(hoy.getDate() + 7);
      finSemanaHabilitada.setHours(23, 59, 59, 999);
      return d >= hoy && d <= finSemanaHabilitada;
    }
  }

  seleccionarDia(dia: string) {
    if (!this.esDiaHabilitado(dia)) {
      return;
    }
    this.fechaSeleccionada = dia;
    this.horaSeleccionada = null;
    this.mensaje = null;

    this.horariosDisponibles$ = this.reservasService.getHorariosDisponibles(dia, this.tipoRecurso).pipe(
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
      this.mensaje = 'Debes iniciar sesión antes de reservar';
      return;
    }
    
    // Validar si el usuario está bloqueado por administración
    const user = this.authService.getUser();
    if (user && user.rol === 'bloqueado') {
      this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '95vw',
        width: '420px',
        data: {
          titulo: 'Acceso Restringido',
          mensaje: 'Tu usuario se encuentra bloqueado por la administración de la Municipalidad de Aldea San Antonio. No tienes permisos para realizar reservas de canchas.',
          resultado: 'No se puede continuar con la operación',
          tipo: 'error',
          bloqueado: true
        }
      });
      return;
    }
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      this.mensaje = 'Debes seleccionar fecha y hora';
      return;
    }
    const existe = this.carritoService.getCarrito().some(r =>
      r.fecha === this.fechaSeleccionada && r.hora === this.horaSeleccionada && r.tipo === this.tipoRecurso
    );
    if (existe) {
      this.mensaje = 'Ese horario ya está en el carrito';
      return;
    }
    if (this.tipoRecurso === 'quincho') {
      const dialogRef = this.dialog.open(SolicitudQuinchoDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: {
          fecha: this.fechaSeleccionada!,
          hora: this.horaSeleccionada!
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const conAireLabel = result.conAire ? 'SÍ' : 'NO';
          const motivoFormatted = `Actividad: ${result.actividad} | Asistentes: ${result.asistentes} | Aire Acondicionado: ${conAireLabel} (Reglamento Aceptado)`;
          const reserva = {
            fecha: this.fechaSeleccionada!,
            hora: this.horaSeleccionada!,
            costo: 0,
            costoTotal: result.conAire ? this.costoTotalQuincho * 2 : this.costoTotalQuincho,
            tipo: this.tipoRecurso,
            motivo: motivoFormatted,
            conAire: !!result.conAire
          };
          this.realizarAgregarAlCarrito(reserva);
        }
      });
    } else {
      const reserva = {
        fecha: this.fechaSeleccionada!,
        hora: this.horaSeleccionada!,
        costo: this.costoCancha,
        costoTotal: this.costoCancha,
        tipo: this.tipoRecurso
      };
      this.realizarAgregarAlCarrito(reserva);
    }
  }

  realizarAgregarAlCarrito(reserva: any) {
    try {
      this.carritoService.addReserva(reserva);
      this.mensaje = 'Reserva agregada al carrito';
      this.router.navigate(['/carrito'], { queryParams: { tipo: this.tipoRecurso } });
    } catch (err: any) {
      console.error('Error al agregar reserva:', err);
      this.mensaje = err.message || 'No se pudo agregar la reserva';
    }
  }

  irLogin() { this.router.navigate(['/login']); }
  trackByDia(index: number, item: any) { return typeof item === 'string' ? item : item.dateStr; }
  verMisReservas() { this.router.navigate(['/mis-reservas'], { queryParams: { tipo: this.tipoRecurso } }); }
  verCarrito() { this.router.navigate(['/carrito'], { queryParams: { tipo: this.tipoRecurso } }); }
  abrirConfirmacion(reserva: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '350px', data: reserva });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.carritoService.addReserva({ ...reserva, tipo: this.tipoRecurso });
        this.router.navigate(['/reservas'], { queryParams: { refresh: 'true', tipo: this.tipoRecurso } });
      }
    });
  }
}
