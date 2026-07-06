import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ necesario para [(ngModel)]
import { MatTabsModule } from '@angular/material/tabs'; // ✅ Tabs
import { UsuariosService } from '../services/usuario.service';
import { ReservasService } from '../services/reservas.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule], // ✅ standalone imports
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperAdminComponent implements OnInit {
  usuarios$: Observable<any[]> | null = null;
  reservas$: Observable<any[]> | null = null;
  reservas: any[] = []; // 👈 Copia de reservas en grilla local
  
  // Para el calendario de bloqueos
  currentMonth: Date = new Date();
  diasCalendario: { dateStr: string; dayNum: number; isCurrentMonth: boolean; enabled: boolean }[] = [];
  nombresDias: string[] = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  fechaSeleccionada: string | null = null;
  horariosDisponibles$: Observable<{ hora: string, disponible: boolean }[]> | null = null;
  
  // Para los buscadores
  filtroUsuario: string = '';
  filtroReservas: string = '';
  
  mensaje: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private usuariosService: UsuariosService,
    private reservasService: ReservasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadReservas();
    this.generarCalendario(this.currentMonth);
  }

  loadUsuarios(): void {
    this.usuarios$ = this.usuariosService.getUsuarios();
  }

  loadReservas(): void {
    this.reservas$ = this.reservasService.getReservas();
    
    // Suscribirse de manera manual para asegurar que localmente 'this.reservas' 
    // esté siempre sincronizada, incluso si no se visualiza la solapa de Historial.
    this.reservasService.getReservas().subscribe({
      next: (res) => {
        this.reservas = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al precargar listado de reservas:', err);
      }
    });
  }

  // Helper de fechas local ISO
  private formatLocalISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Generar calendario
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

    for (let i = 1; i <= totalDiasMes; i++) {
      const d = new Date(año, mes, i);
      d.setHours(0, 0, 0, 0);

      const dateStr = this.formatLocalISO(d);
      const enabled = d >= hoy; // Permite hoy y cualquier día futuro

      this.diasCalendario.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        enabled
      });
    }

    // Rellenar días del mes siguiente
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

  trackByDia(index: number, item: any) {
    return typeof item === 'string' ? item : item.dateStr;
  }

  seleccionarDia(dia: string) {
    this.fechaSeleccionada = dia;
    this.horariosDisponibles$ = this.reservasService.getHorariosDisponibles(dia);
  }

  private datesMatchLocal(dbFecha: any, selectedFechaStr: string): boolean {
    if (!dbFecha || !selectedFechaStr) return false;
    try {
      let clean1 = dbFecha.toString().trim();
      let clean2 = selectedFechaStr.toString().trim();

      // Normalizar clean1
      if (clean1.includes('T')) {
        clean1 = clean1.split('T')[0];
      } else if (clean1.includes(' ')) {
        clean1 = clean1.split(' ')[0];
      }
      if (clean1.includes('/')) {
        const parts = clean1.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          clean1 = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      // Normalizar clean2
      if (clean2.includes('T')) {
        clean2 = clean2.split('T')[0];
      } else if (clean2.includes(' ')) {
        clean2 = clean2.split(' ')[0];
      }
      if (clean2.includes('/')) {
        const parts = clean2.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          clean2 = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      const padDate = (dateStr: string) => {
        const p = dateStr.split('-');
        if (p.length === 3) {
          return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
        }
        return dateStr;
      };

      return padDate(clean1) === padDate(clean2);
    } catch (e) {
      return false;
    }
  }

  private hoursMatch(h1: any, h2: any): boolean {
    if (!h1 || !h2) return false;
    try {
      const cleanHour = (h: string) => {
        let s = h.toString().trim();
        if (s.split(':').length >= 2) {
          const parts = s.split(':');
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return s;
      };
      return cleanHour(h1) === cleanHour(h2);
    } catch (e) {
      return false;
    }
  }

  obtenerEstadoSlot(hora: string): { 
    estado: 'disponible' | 'reservado' | 'bloqueado', 
    label: string, 
    reservaId?: number, 
    usuario?: string, 
    motivo?: string 
  } {
    if (!this.fechaSeleccionada || !this.reservas) {
      return { estado: 'disponible', label: 'Disponible' };
    }
    
    // Buscar si hay alguna reserva activa para esa fecha y hora utilizando comparadores locales robustos
    const res = this.reservas.find(r => {
      const fechaMatch = this.datesMatchLocal(r.fecha, this.fechaSeleccionada!);
      const horaMatch = this.hoursMatch(r.hora, hora);
      
      const estadoLower = r.estado ? r.estado.toLowerCase().trim() : '';
      const esActivo = estadoLower !== 'cancelada' && 
                       estadoLower !== 'cancelado' && 
                       estadoLower !== 'rechazada' && 
                       estadoLower !== 'rechazado';
                       
      return fechaMatch && horaMatch && esActivo;
    });
    
    if (!res) {
      return { estado: 'disponible', label: 'Disponible' };
    }
    
    const estadoLower = res.estado ? res.estado.toLowerCase().trim() : '';
    if (estadoLower.startsWith('bloquead')) {
      return { 
        estado: 'bloqueado', 
        label: 'Bloqueado', 
        reservaId: res.id,
        motivo: res.motivo || 'Uso interno municipal'
      };
    }
    
    return { 
      estado: 'reservado', 
      label: 'Reservado', 
      reservaId: res.id,
      usuario: res.usuario || `Usuario ID: ${res.usuario_id}`
    };
  }

  solicitarBloqueo(hora: string, yaReservado: boolean) {
    let warningMsg = '¿Estás seguro de bloquear este horario?';
    if (yaReservado) {
      warningMsg = '⚠️ ATENCIÓN: Este horario ya se encuentra reservado por un usuario. ' +
                   'Si lo bloqueas, se cancelará su reserva y se le notificará automáticamente por email para reprogramar. ' +
                   '¿Deseas continuar con el bloqueo?';
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Bloquear Horario',
        mensaje: warningMsg,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const motivo = prompt('Por favor, ingresa el motivo del bloqueo:', 'Uso interno municipal');
        if (motivo !== null) {
          this.bloquearReserva(this.fechaSeleccionada!, hora, motivo);
        }
      }
    });
  }

  bloquearReserva(fecha: string, hora: string, motivo: string): void {
    this.reservasService.bloquearReserva(fecha, hora, motivo).subscribe({
      next: (res) => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Horario Bloqueado',
            mensaje: '',
            resultado: `✅ El horario de las ${hora} hs para el día ${this.formatFechaLocal(fecha)} fue bloqueado exitosamente.`,
            tipo: 'success'
          }
        });
        this.loadReservas();
        if (this.fechaSeleccionada) {
          this.seleccionarDia(this.fechaSeleccionada);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error al Bloquear',
            mensaje: '',
            resultado: err?.message || '❌ Ocurrió un error al bloquear el horario.',
            tipo: 'error'
          }
        });
        this.cdr.detectChanges();
      }
    });
  }

  solicitarDesbloqueo(reservaId: number, hora: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Liberar Horario',
        mensaje: `¿Estás seguro de liberar el horario de las ${hora} hs? Volverá a estar disponible para que los usuarios puedan reservarlo.`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reservasService.cancelarReserva(reservaId).subscribe({
          next: (res) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Horario Liberado',
                mensaje: '',
                resultado: `✅ El horario de las ${hora} hs fue liberado con éxito.`,
                tipo: 'success'
              }
            });
            this.loadReservas();
            if (this.fechaSeleccionada) {
              this.seleccionarDia(this.fechaSeleccionada);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error al Liberar',
                mensaje: '',
                resultado: err?.message || '❌ Ocurrió un error al liberar el horario.',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  asignarRol(id: number, nuevoRol: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Actualizar Rol',
        mensaje: `¿Estás seguro de cambiar el rol del usuario a "${nuevoRol.toUpperCase()}"?`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.asignarRol(id, nuevoRol).subscribe({
          next: (res) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Rol Actualizado',
                mensaje: '',
                resultado: `✅ El rol se actualizó correctamente a "${nuevoRol}".`,
                tipo: 'success'
              }
            });
            this.loadUsuarios();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: '',
                resultado: err.message || 'Error al asignar rol',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  eliminarUsuario(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar Usuario',
        mensaje: '⚠️ ¿Estás seguro de eliminar este usuario de forma permanente? Esta acción no se puede deshacer.',
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.eliminarUsuario(id).subscribe({
          next: (res) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Usuario Eliminado',
                mensaje: '',
                resultado: '✅ El usuario fue removido correctamente.',
                tipo: 'success'
              }
            });
            this.loadUsuarios();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: '',
                resultado: err.message || 'Error al eliminar usuario',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  cancelarReserva(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Cancelar Reserva',
        mensaje: '¿Estás seguro de cancelar esta reserva?',
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reservasService.cancelarReserva(id).subscribe({
          next: (res) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Reserva Cancelada',
                mensaje: '',
                resultado: '✅ La reserva se canceló correctamente.',
                tipo: 'success'
              }
            });
            this.loadReservas();
            if (this.fechaSeleccionada) {
              this.seleccionarDia(this.fechaSeleccionada);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: '',
                resultado: err.message || 'Error al cancelar reserva',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // Filtrado local de usuarios
  filtrarUsuariosList(usuarios: any[]): any[] {
    if (!this.filtroUsuario) return usuarios;
    const filter = this.filtroUsuario.toLowerCase().trim();
    return usuarios.filter(u =>
      (u.nombre && u.nombre.toLowerCase().includes(filter)) ||
      (u.apellido && u.apellido.toLowerCase().includes(filter)) ||
      (u.email && u.email.toLowerCase().includes(filter)) ||
      (u.dni && u.dni.toLowerCase().includes(filter))
    );
  }

  // Filtrado local de reservas
  filtrarReservasList(reservas: any[]): any[] {
    if (!this.filtroReservas) return reservas;
    const filter = this.filtroReservas.toLowerCase().trim();
    return reservas.filter(r =>
      (r.usuario && r.usuario.toLowerCase().includes(filter)) ||
      (r.fecha && r.fecha.toLowerCase().includes(filter)) ||
      (r.estado && r.estado.toLowerCase().includes(filter))
    );
  }

  // Formateador de fechas
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
