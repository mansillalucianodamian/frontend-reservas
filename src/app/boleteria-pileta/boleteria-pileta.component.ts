import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { PiletaService, PiletaConfig, PiletaVenta, PiletaResumen } from '../services/pileta.service';

@Component({
  selector: 'app-boleteria-pileta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './boleteria-pileta.component.html',
  styleUrls: ['./boleteria-pileta.component.css']
})
export class BoleteriaPiletaComponent implements OnInit {
  // Configuración de tarifas y estado (Temporada 2026-2027)
  config: PiletaConfig = {
    precio_adulto: 4000,
    precio_nino: 3000,
    precio_adulto_finde_res: 6000,
    precio_nino_finde_res: 4000,
    precio_adulto_finde_nores: 8000,
    precio_nino_finde_nores: 5000,
    carnet_mayor_dic: 30000,
    carnet_mayor_ene: 35000,
    carnet_mayor_feb: 30000,
    carnet_menor_dic: 25000,
    carnet_menor_ene: 30000,
    carnet_menor_feb: 25000,
    abierta: 1,
    horarios: 'Martes a Viernes de 16:00 a 20:00 hs | Sábados, Domingos y Feriados',
    mensaje_estado: 'Temporada 2026-2027: Inicio sábado 12/12/2026 hasta domingo 28/02/2027'
  };

  // Modalidad tarifaria activa en el mostrador
  modalidadTarifa: 'semana' | 'finde_residente' | 'finde_no_residente' = 'semana';

  // Contadores para el mostrador de venta rápida
  cantAdultos: number = 0;
  cantNinos: number = 0;
  cantGratis: number = 0;
  medioPago: 'efectivo' | 'transferencia' = 'efectivo';

  // Control de caja de hoy
  ventasHoy: PiletaVenta[] = [];
  resumenHoy: PiletaResumen = {
    total_adultos: 0,
    total_ninos: 0,
    total_gratis: 0,
    total_personas: 0,
    recaudacion_total: 0,
    recaudacion_efectivo: 0,
    recaudacion_transferencia: 0,
    transacciones_cobradas: 0,
    transacciones_anuladas: 0
  };

  // Estados de carga y feedback
  cargandoCaja: boolean = false;
  isProcessing: boolean = false;
  guardandoConfig: boolean = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  // Pestaña activa: 'pos' (Venta y caja) o 'ajustes' (Precios y horarios)
  seccionActiva: 'pos' | 'ajustes' = 'pos';

  // Rol del usuario actual
  userRole: string = '';

  constructor(
    private piletaService: PiletaService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('rol') || sessionStorage.getItem('rol') || 'recepcionista';
    const diaSemana = new Date().getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      this.modalidadTarifa = 'finde_residente';
    }
    this.cargarDatosCaja();
  }

  cargarDatosCaja(): void {
    this.cargandoCaja = true;
    this.piletaService.getCajaHoy().subscribe({
      next: (data) => {
        this.ventasHoy = data.ventas || [];
        this.resumenHoy = data.resumen || this.resumenHoy;
        if (data.config) {
          this.config = { ...this.config, ...data.config };
        }
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar caja:', err);
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      }
    });
  }

  get precioMayorActivo(): number {
    if (this.modalidadTarifa === 'finde_residente') {
      return Number(this.config.precio_adulto_finde_res) || 6000;
    }
    if (this.modalidadTarifa === 'finde_no_residente') {
      return Number(this.config.precio_adulto_finde_nores) || 8000;
    }
    return Number(this.config.precio_adulto) || 4000;
  }

  get precioMenorActivo(): number {
    if (this.modalidadTarifa === 'finde_residente') {
      return Number(this.config.precio_nino_finde_res) || 4000;
    }
    if (this.modalidadTarifa === 'finde_no_residente') {
      return Number(this.config.precio_nino_finde_nores) || 5000;
    }
    return Number(this.config.precio_nino) || 3000;
  }

  // --- Operaciones de Venta Rápida (POS) ---
  modificarCantidad(tipo: 'adultos' | 'ninos' | 'gratis', delta: number): void {
    if (tipo === 'adultos') {
      this.cantAdultos = Math.max(0, this.cantAdultos + delta);
    } else if (tipo === 'ninos') {
      this.cantNinos = Math.max(0, this.cantNinos + delta);
    } else if (tipo === 'gratis') {
      this.cantGratis = Math.max(0, this.cantGratis + delta);
    }
  }

  setCantidad(tipo: 'adultos' | 'ninos' | 'gratis', valor: number): void {
    if (tipo === 'adultos') this.cantAdultos = Math.max(0, valor);
    if (tipo === 'ninos') this.cantNinos = Math.max(0, valor);
    if (tipo === 'gratis') this.cantGratis = Math.max(0, valor);
  }

  limpiarSeleccion(): void {
    this.cantAdultos = 0;
    this.cantNinos = 0;
    this.cantGratis = 0;
  }

  get totalPersonasSeleccionadas(): number {
    return this.cantAdultos + this.cantNinos + this.cantGratis;
  }

  get totalAPagar(): number {
    const subtotalAdultos = this.cantAdultos * this.precioMayorActivo;
    const subtotalNinos = this.cantNinos * this.precioMenorActivo;
    return subtotalAdultos + subtotalNinos;
  }

  registrarCobro(): void {
    if (this.totalPersonasSeleccionadas <= 0) {
      this.dialog.open(ConfirmDialogComponent, {
        data: {
          titulo: 'Atención',
          mensaje: '',
          resultado: 'Debes seleccionar al menos una entrada (Mayor, Menor o Exento) para registrar el cobro.',
          tipo: 'error'
        }
      });
      return;
    }

    this.isProcessing = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    const payload = {
      cant_adultos: this.cantAdultos,
      cant_ninos: this.cantNinos,
      cant_gratis: this.cantGratis,
      medio_pago: this.medioPago,
      modalidad_tarifa: this.modalidadTarifa
    };

    const resumenTexto = `${this.cantAdultos} Mayor(es), ${this.cantNinos} Menor(es)${this.cantGratis > 0 ? ', ' + this.cantGratis + ' Exento(s)' : ''} - Total: $${this.totalAPagar} (${this.medioPago.toUpperCase()})`;

    this.piletaService.registrarVenta(payload).subscribe({
      next: () => {
        this.isProcessing = false;
        this.limpiarSeleccion();
        this.mensajeExito = `¡Entrada registrada con éxito! ${resumenTexto}`;
        this.cargarDatosCaja();
        setTimeout(() => {
          this.mensajeExito = null;
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err) => {
        this.isProcessing = false;
        this.mensajeError = err?.message || 'Error al procesar la venta';
        this.cdr.detectChanges();
      }
    });
  }

  anularVenta(venta: PiletaVenta): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Anular Ticket de Entrada',
        mensaje: `¿Confirmás anular la venta #${venta.id} por $${venta.total} (${venta.cant_adultos} mayores, ${venta.cant_ninos} menores)?\n\nEl importe se restará del arqueo de caja actual.`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado === true) {
        this.isProcessing = true;
        this.piletaService.anularVenta(venta.id, 'Anulado por error de carga en boletería').subscribe({
          next: () => {
            this.isProcessing = false;
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Ticket Anulado',
                mensaje: '',
                resultado: `La venta #${venta.id} fue anulada correctamente.`,
                tipo: 'success'
              }
            });
            this.cargarDatosCaja();
          },
          error: (err) => {
            this.isProcessing = false;
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: '',
                resultado: err?.message || 'No se pudo anular la venta.',
                tipo: 'error'
              }
            });
          }
        });
      }
    });
  }

  verCierreDeCaja(): void {
    const resumen = this.resumenHoy;
    const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const detalle = 
      `BALANCE DE CAJA PILETA (${ahora} hs)\n\n` +
      `Personas Ingresadas: ${resumen.total_personas}\n` +
      `   • Mayores (13+ años): ${resumen.total_adultos}\n` +
      `   • Menores (2 a 12 años): ${resumen.total_ninos}\n` +
      `   • Exentos / Sin Cargo: ${resumen.total_gratis}\n\n` +
      `RECAUDACIÓN TOTAL: $${resumen.recaudacion_total.toLocaleString('es-AR')}\n` +
      `   • Efectivo en Mano: $${resumen.recaudacion_efectivo.toLocaleString('es-AR')}\n` +
      `   • Transferencias / MP: $${resumen.recaudacion_transferencia.toLocaleString('es-AR')}\n\n` +
      `Transacciones: ${resumen.transacciones_cobradas} cobradas${resumen.transacciones_anuladas > 0 ? ' (' + resumen.transacciones_anuladas + ' anuladas)' : ''}`;

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Arqueo y Cierre de Caja del Día',
        mensaje: '',
        resultado: detalle,
        tipo: 'success'
      }
    });
  }

  // --- Ajustes de Tarifas y Estado ---
  guardarConfiguracion(): void {
    this.guardandoConfig = true;
    this.mensajeExito = null;
    this.mensajeError = null;

    this.piletaService.updateConfig(this.config).subscribe({
      next: (res) => {
        this.guardandoConfig = false;
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Tarifas Actualizadas',
            mensaje: '',
            resultado: 'Los precios y el estado de la pileta fueron guardados exitosamente.',
            tipo: 'success'
          }
        });
        if (res.config) this.config = { ...this.config, ...res.config };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardandoConfig = false;
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            titulo: 'Error',
            mensaje: '',
            resultado: err?.message || 'No se pudieron actualizar los datos.',
            tipo: 'error'
          }
        });
      }
    });
  }

  togglePiletaAbierta(): void {
    this.config.abierta = (this.config.abierta === 1 || this.config.abierta === true) ? 0 : 1;
    this.guardarConfiguracion();
  }

  formatHora(fechaHora: string): string {
    if (!fechaHora) return '';
    const d = new Date(fechaHora);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
}
