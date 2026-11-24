import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { PiletaService, PiletaConfig, PiletaVenta, PiletaResumen } from '../services/pileta.service';

export interface PulseraItem {
  ticketId: number;
  numero: number;
  totalPulseras: number;
  categoria: 'MAYOR' | 'MENOR' | 'EXENTO';
  rangoEdad: string;
  precioUnitario: number;
  fechaStr: string;
  diaSemanaStr: string;
  horaStr: string;
  codigoControl: string;
}

export interface ColorRolloOption {
  id: string;
  nombre: string;
  diaSugerido: string;
  hexBg: string;
  hexBorder: string;
}

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

  // --- Configuración de Impresión de Pulseras Térmicas SCH-TEC PT (25x250mm) ---
  imprimirAlCobrar: boolean = true;
  mostrarModalPulseras: boolean = false;
  pulserasActuales: PulseraItem[] = [];
  colorRolloActual: ColorRolloOption;

  readonly coloresRollo: ColorRolloOption[] = [
    { id: 'azul', nombre: 'Azul', diaSugerido: 'Martes', hexBg: '#7dd3fc', hexBorder: '#0284c7' },
    { id: 'verde', nombre: 'Verde', diaSugerido: 'Miércoles', hexBg: '#86efac', hexBorder: '#16a34a' },
    { id: 'amarillo', nombre: 'Amarillo', diaSugerido: 'Jueves', hexBg: '#fde047', hexBorder: '#ca8a04' },
    { id: 'naranja', nombre: 'Naranja', diaSugerido: 'Viernes', hexBg: '#fdba74', hexBorder: '#ea580c' },
    { id: 'rojo', nombre: 'Rojo', diaSugerido: 'Sábado', hexBg: '#fca5a5', hexBorder: '#dc2626' },
    { id: 'rosa', nombre: 'Rosa / Violeta', diaSugerido: 'Domingo', hexBg: '#f0abfc', hexBorder: '#c026d3' },
    { id: 'blanco', nombre: 'Blanco', diaSugerido: 'Feriado / Extra', hexBg: '#f8fafc', hexBorder: '#94a3b8' }
  ];

  constructor(
    private piletaService: PiletaService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.colorRolloActual = this.obtenerColorRolloPorDia();
  }

  private obtenerColorRolloPorDia(): ColorRolloOption {
    const dia = new Date().getDay(); // 0=Dom, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
    switch (dia) {
      case 2: return this.coloresRollo[0]; // Martes -> Azul
      case 3: return this.coloresRollo[1]; // Miércoles -> Verde
      case 4: return this.coloresRollo[2]; // Jueves -> Amarillo
      case 5: return this.coloresRollo[3]; // Viernes -> Naranja
      case 6: return this.coloresRollo[4]; // Sábado -> Rojo
      case 0: return this.coloresRollo[5]; // Domingo -> Rosa
      default: return this.coloresRollo[0];
    }
  }

  seleccionarColorRollo(c: ColorRolloOption): void {
    this.colorRolloActual = c;
  }

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
      next: (res) => {
        this.isProcessing = false;
        this.limpiarSeleccion();
        this.mensajeExito = `¡Entrada registrada con éxito! ${resumenTexto}`;
        this.cargarDatosCaja();

        if (res && res.venta) {
          this.pulserasActuales = this.construirPulserasDeVenta(res.venta);
          if (this.imprimirAlCobrar && this.pulserasActuales.length > 0) {
            this.mostrarModalPulseras = true;
            this.cdr.detectChanges();
          }
        }

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
      `Personas / Pulseras Emitidas: ${resumen.total_personas} unidades (Rollo ${this.colorRolloActual.nombre})\n` +
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

  // =========================================================================
  // 🖨️ GENERACIÓN E IMPRESIÓN DE PULSERAS TÉRMICAS SCH-TEC PT (25 x 250 mm)
  // =========================================================================

  construirPulserasDeVenta(venta: PiletaVenta): PulseraItem[] {
    const lista: PulseraItem[] = [];
    const adultos = Number(venta.cant_adultos) || 0;
    const ninos = Number(venta.cant_ninos) || 0;
    const gratis = Number(venta.cant_gratis) || 0;
    const total = adultos + ninos + gratis;
    if (total <= 0) return [];

    const fechaObj = venta.fecha_hora ? new Date(venta.fecha_hora) : new Date();
    const diasNombres = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const diaSemanaStr = diasNombres[fechaObj.getDay()] || 'HOY';
    const fechaStr = fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    let correlativo = 1;

    for (let i = 0; i < adultos; i++) {
      lista.push({
        ticketId: venta.id,
        numero: correlativo,
        totalPulseras: total,
        categoria: 'MAYOR',
        rangoEdad: 'A PARTIR DE 13 AÑOS',
        precioUnitario: Number(venta.precio_adulto_unitario) || 0,
        fechaStr,
        diaSemanaStr,
        horaStr,
        codigoControl: `ASA-${String(venta.id).padStart(4, '0')}-${correlativo}`
      });
      correlativo++;
    }

    for (let i = 0; i < ninos; i++) {
      lista.push({
        ticketId: venta.id,
        numero: correlativo,
        totalPulseras: total,
        categoria: 'MENOR',
        rangoEdad: '2 A 12 AÑOS INCLUSIVE',
        precioUnitario: Number(venta.precio_nino_unitario) || 0,
        fechaStr,
        diaSemanaStr,
        horaStr,
        codigoControl: `ASA-${String(venta.id).padStart(4, '0')}-${correlativo}`
      });
      correlativo++;
    }

    for (let i = 0; i < gratis; i++) {
      lista.push({
        ticketId: venta.id,
        numero: correlativo,
        totalPulseras: total,
        categoria: 'EXENTO',
        rangoEdad: 'PASE SIN CARGO',
        precioUnitario: 0,
        fechaStr,
        diaSemanaStr,
        horaStr,
        codigoControl: `ASA-${String(venta.id).padStart(4, '0')}-${correlativo}`
      });
      correlativo++;
    }

    return lista;
  }

  abrirModalPulseras(venta: PiletaVenta): void {
    this.pulserasActuales = this.construirPulserasDeVenta(venta);
    this.mostrarModalPulseras = true;
    this.cdr.detectChanges();
  }

  cerrarModalPulseras(): void {
    this.mostrarModalPulseras = false;
    this.cdr.detectChanges();
  }

  /**
   * Envía las pulseras actuales al motor de impresión térmico en formato 25mm x 250mm
   * (1 página por pulsera para corte/freno exacto por sensor de marca negra de la SCH-TEC PT).
   */
  ejecutarImpresionTermica(): void {
    if (!this.pulserasActuales || this.pulserasActuales.length === 0) return;

    const paginasHtml = this.pulserasActuales.map(p => `
      <div class="wristband-page">
        <div class="wristband-Rotated-Zone">
          <div class="wb-header">
            <span>MUNICIPALIDAD DE ALDEA SAN ANTONIO • POLIDEPORTIVO</span>
            <span>PULSERA ${p.numero}/${p.totalPulseras}</span>
          </div>
          <div class="wb-main-row">
            <div class="wb-category-box">
              <div class="wb-cat-title">${p.categoria}</div>
              <div class="wb-cat-sub">${p.rangoEdad}</div>
            </div>
            <div class="wb-date-box">
              <div class="wb-date-big">${p.diaSemanaStr} ${p.fechaStr}</div>
              <div class="wb-meta-line">INGRESO: ${p.horaStr} HS • TICKET #${p.ticketId} (${p.precioUnitario > 0 ? '$' + p.precioUnitario.toLocaleString('es-AR') : 'S/C'})</div>
            </div>
            <div class="wb-barcode-box">
              <div class="wb-bars">||| | |||| | ||| || | |||| |||</div>
              <div class="wb-code">${p.codigoControl}</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    const htmlCompleto = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Impresión de Pulseras SCH-TEC PT</title>
        <style>
          @page {
            size: 25mm 250mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #ffffff;
            color: #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .wristband-page {
            width: 25mm;
            height: 250mm;
            position: relative;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }
          .wristband-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          /* Área imprimible central (de 45mm a 165mm del largo de la pulsera) rotada 90° a lo largo de la muñeca */
          .wristband-Rotated-Zone {
            position: absolute;
            top: 45mm;
            left: 23mm;
            width: 120mm;
            height: 21mm;
            transform: rotate(90deg);
            transform-origin: 0 0;
            border: 1.5px solid #000000;
            border-radius: 4px;
            padding: 1.5mm 3mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .wb-header {
            display: flex;
            justify-content: space-between;
            font-size: 6.5pt;
            font-weight: 900;
            letter-spacing: 0.3px;
            border-bottom: 1px solid #000000;
            padding-bottom: 0.7mm;
          }
          .wb-main-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2.5mm;
            flex: 1;
            padding-top: 0.8mm;
          }
          .wb-category-box {
            background: #000000;
            color: #ffffff;
            padding: 1mm 2.5mm;
            border-radius: 3px;
            text-align: center;
            min-width: 28mm;
          }
          .wb-cat-title {
            font-size: 13pt;
            font-weight: 900;
            line-height: 1;
          }
          .wb-cat-sub {
            font-size: 5.5pt;
            font-weight: 700;
            margin-top: 0.5mm;
          }
          .wb-date-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5mm;
          }
          .wb-date-big {
            font-size: 11.5pt;
            font-weight: 900;
            line-height: 1.05;
          }
          .wb-meta-line {
            font-size: 6.5pt;
            font-weight: 800;
          }
          .wb-barcode-box {
            text-align: center;
            border-left: 1px dashed #000000;
            padding-left: 2mm;
          }
          .wb-bars {
            font-family: monospace;
            font-size: 10pt;
            font-weight: 900;
            letter-spacing: -1px;
            line-height: 1;
          }
          .wb-code {
            font-size: 6pt;
            font-weight: 800;
            margin-top: 0.5mm;
          }
        </style>
      </head>
      <body>
        ${paginasHtml}
      </body>
      </html>
    `;

    const iframeId = 'sch-tec-print-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlCompleto);
      doc.close();
      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 250);
    }
  }
}
