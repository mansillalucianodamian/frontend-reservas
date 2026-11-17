import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

export interface PiletaConfig {
  id?: number;
  precio_adulto: number;
  precio_nino: number;
  precio_adulto_finde_res?: number;
  precio_nino_finde_res?: number;
  precio_adulto_finde_nores?: number;
  precio_nino_finde_nores?: number;
  carnet_mayor_dic?: number;
  carnet_mayor_ene?: number;
  carnet_mayor_feb?: number;
  carnet_menor_dic?: number;
  carnet_menor_ene?: number;
  carnet_menor_feb?: number;
  abierta: number | boolean;
  horarios: string;
  mensaje_estado: string;
  updated_at?: string;
}

export interface PiletaVenta {
  id: number;
  fecha_hora: string;
  cant_adultos: number;
  cant_ninos: number;
  cant_gratis: number;
  precio_adulto_unitario: number;
  precio_nino_unitario: number;
  total: number;
  medio_pago: 'efectivo' | 'transferencia';
  usuario_id?: number | null;
  cajero_nombre?: string;
  estado: 'cobrado' | 'anulado';
  motivo_anulacion?: string | null;
}

export interface PiletaResumen {
  total_adultos: number;
  total_ninos: number;
  total_gratis: number;
  total_personas: number;
  recaudacion_total: number;
  recaudacion_efectivo: number;
  recaudacion_transferencia: number;
  transacciones_cobradas: number;
  transacciones_anuladas: number;
}

@Injectable({
  providedIn: 'root'
})
export class PiletaService {
  private apiUrl = '/api/pileta';

  constructor(private http: HttpClient) {}

  /**
   * Consulta pública de tarifas, horarios y estado de la pileta (sin caché)
   */
  getConfig(): Observable<PiletaConfig> {
    return this.http.get<{ ok: boolean; config: PiletaConfig }>(
      `${this.apiUrl}/config`,
      { params: { _t: Date.now().toString() } }
    ).pipe(
      map(res => res.config),
      catchError(err => throwError(() => err.error?.message || 'Error al obtener tarifas de pileta'))
    );
  }

  /**
   * Actualizar tarifas y estado de la pileta
   */
  updateConfig(data: Partial<PiletaConfig>): Observable<any> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return this.http.put<{ ok: boolean; message: string; config: PiletaConfig }>(
      `${this.apiUrl}/config`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => res),
      catchError(err => throwError(() => err.error?.message || 'Error al actualizar configuración'))
    );
  }

  /**
   * Consultar arqueo de caja y ventas de hoy
   */
  getCajaHoy(): Observable<{ ventas: PiletaVenta[]; resumen: PiletaResumen; config: PiletaConfig }> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return this.http.get<{ ok: boolean; ventas: PiletaVenta[]; resumen: PiletaResumen; config: PiletaConfig }>(
      `${this.apiUrl}/caja-hoy`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => ({
        ventas: res.ventas || [],
        resumen: res.resumen || {
          total_adultos: 0,
          total_ninos: 0,
          total_gratis: 0,
          total_personas: 0,
          recaudacion_total: 0,
          recaudacion_efectivo: 0,
          recaudacion_transferencia: 0,
          transacciones_cobradas: 0,
          transacciones_anuladas: 0
        },
        config: res.config
      })),
      catchError(err => throwError(() => err.error?.message || 'Error al obtener caja de hoy'))
    );
  }

  /**
   * Registrar cobro de entradas en boletería
   */
  registrarVenta(data: {
    cant_adultos: number;
    cant_ninos: number;
    cant_gratis: number;
    medio_pago: 'efectivo' | 'transferencia';
    modalidad_tarifa?: 'semana' | 'finde_residente' | 'finde_no_residente';
  }): Observable<{ venta: PiletaVenta; resumen: PiletaResumen; message: string }> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return this.http.post<{ ok: boolean; message: string; venta: PiletaVenta; resumen: PiletaResumen }>(
      `${this.apiUrl}/ventas`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => ({
        venta: res.venta,
        resumen: res.resumen,
        message: res.message
      })),
      catchError(err => throwError(() => err.error?.message || 'Error al registrar venta'))
    );
  }

  /**
   * Anular venta por error
   */
  anularVenta(id: number, motivo: string = 'Anulada por operador'): Observable<any> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return this.http.put<{ ok: boolean; message: string; ventas: PiletaVenta[]; resumen: PiletaResumen }>(
      `${this.apiUrl}/ventas/${id}/anular`,
      { motivo },
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(res => res),
      catchError(err => throwError(() => err.error?.message || 'Error al anular venta'))
    );
  }

  /**
   * Historial por fecha
   */
  getHistorial(fecha: string): Observable<PiletaVenta[]> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return this.http.get<{ ok: boolean; ventas: PiletaVenta[] }>(
      `${this.apiUrl}/historial`,
      {
        params: { fecha },
        headers: { Authorization: `Bearer ${token}` }
      }
    ).pipe(
      map(res => res.ventas || []),
      catchError(err => throwError(() => err.error?.message || 'Error al consultar historial'))
    );
  }
}

