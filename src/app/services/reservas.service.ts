import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private apiUrl = '/api/reservas';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // 🔹 Obtener reservas (con soporte de filtros opcionales del lado servidor)
  getReservas(filters?: any): Observable<any[]> {
    let params: any = {};
    if (filters) {
      if (filters.fecha) params.fecha = filters.fecha;
      if (filters.tipo && filters.tipo !== 'todos') params.tipo = filters.tipo;
      if (filters.estado && filters.estado !== 'todos') params.estado = filters.estado;
      if (filters.hora && filters.hora !== 'todos') params.hora = filters.hora;
      if (filters.busqueda && filters.busqueda.trim() !== '') params.busqueda = filters.busqueda.trim();
      if (filters.limit) params.limit = filters.limit;
    }

    return this.http.get<{ ok: boolean, reservas: any[], message?: string }>(
      this.apiUrl,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(res => res.reservas || []),
      catchError(err => throwError(() => err.error?.message || 'Error al obtener reservas'))
    );
  }

  // 🔹 Obtener horarios disponibles para un día
  getHorariosDisponibles(fecha: string, tipo: string = 'cancha'): Observable<{ hora: string, disponible: boolean }[]> {
    return this.http.get<{ ok: boolean, horarios: { hora: string, disponible: boolean }[] }>(
      `${this.apiUrl}/disponibles/${fecha}?tipo=${tipo}`
    ).pipe(
      map(res => res.horarios)
    );
  }

  // 🔹 Obtener fechas ocupadas para el calendario (p.ej. quincho)
  getFechasOcupadas(tipo: string = 'quincho'): Observable<string[]> {
    return this.http.get<{ ok: boolean, fechas: string[] }>(
      `${this.apiUrl}/fechas-ocupadas?tipo=${tipo}`
    ).pipe(
      map(res => res.fechas || []),
      catchError(() => of([]))
    );
  }

  // 🔹 Crear una nueva reserva
  crearReserva(fecha: string, hora: string, tipo: string = 'cancha', motivo: string | null = null, conAire: boolean = false): Observable<{ ok: boolean, message: string, reserva?: any }> {
    const usuarioId = localStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioId'); // 👈 importante incluir usuario_id
    return this.http.post<{ ok: boolean, message: string, reserva?: any }>(
      this.apiUrl,
      { usuario_id: usuarioId, fecha, hora, tipo, motivo, con_aire: conAire },
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ({
        ok: res.ok,
        message: res.message || (res.ok ? 'Reserva creada con éxito' : 'Error al crear reserva'),
        reserva: res.reserva
      })),
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || 'Error al crear reserva'
      })))
    );
  }

  // 🔹 Cancelar una reserva
  cancelarReserva(id: number): Observable<{ ok: boolean, message: string }> {
    return this.http.put<{ ok: boolean, message: string }>(
      `${this.apiUrl}/${id}/cancelar`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ({
        ok: res.ok,
        message: res.message || 'Reserva cancelada'
      })),
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || 'Error al cancelar reserva'
      })))
    );
  }

  // 🔹 Aprobar una reserva (nuevo método para recepcionista/superadmin)
  aprobarReserva(id: number): Observable<{ ok: boolean, message: string }> {
    return this.http.put<{ ok: boolean, message: string }>(
      `${this.apiUrl}/${id}/aprobar`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ({
        ok: res.ok,
        message: res.message || 'Reserva aprobada'
      })),
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || 'Error al aprobar reserva'
      })))
    );
  }

  // 🔹 Deshacer aprobación de una reserva (período de gracia de 15 min para recepcionista)
  deshacerAprobacion(id: number): Observable<{ ok: boolean, message: string, reserva?: any }> {
    return this.http.put<{ ok: boolean, message: string, reserva?: any }>(
      `${this.apiUrl}/${id}/deshacer-aprobacion`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ({
        ok: res.ok,
        message: res.message || 'Aprobación revertida con éxito',
        reserva: res.reserva
      })),
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || 'Error al deshacer aprobación'
      })))
    );
  }
  bloquearReserva(fecha: string, hora: string, motivo: string, tipo: string = 'cancha', conLuz: boolean = false): Observable<{ ok: boolean, message: string }> {
    return this.http.post<{ ok: boolean, message: string }>(
      `${this.apiUrl}/bloquear`,
      { fecha, hora, motivo, tipo, con_luz: conLuz },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || 'Error al bloquear reserva'
      })))
    );
  }
  bloquearReservaMasivo(fechaInicio: string, fechaFin: string, diasSemana: number[], horas: string[], motivo: string, conLuz: boolean = false): Observable<{ ok: boolean, resultado?: any, message?: string }> {
    return this.http.post<{ ok: boolean, resultado?: any, message?: string }>(
      `${this.apiUrl}/bloquear-masivo`,
      { fechaInicio, fechaFin, diasSemana, horas, motivo, con_luz: conLuz },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || 'Error al bloquear reservas masivas'
      })))
    );
  }
  getReservasPendientes(): Observable<any[]> {
    return this.http.get<{ ok: boolean, reservas: any[] }>(
      `${this.apiUrl}/pendientes`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.reservas), // 👈 devolvemos directamente el array
      catchError(err => throwError(() => err.error?.message || err.message || 'Error al obtener reservas pendientes'))
    );
  }

  getAprobacionesRecientes(): Observable<any[]> {
    return this.http.get<{ ok: boolean, reservas: any[] }>(
      `${this.apiUrl}/recientes-aprobadas`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.reservas || []),
      catchError(err => throwError(() => err.error?.message || err.message || 'Error al obtener aprobaciones recientes'))
    );
  }

  getPrecioCancha(): Observable<{ ok: boolean, precio: number }> {
    return this.http.get<{ ok: boolean, precio: number }>(
      '/api/configuracion/precio'
    );
  }

  updatePrecioCancha(precio: number): Observable<{ ok: boolean, message: string }> {
    return this.http.put<{ ok: boolean, message: string }>(
      '/api/configuracion/precio',
      { precio },
      { headers: this.getHeaders() }
    );
  }

  getPrecioQuincho(): Observable<{ ok: boolean, precio: number, sena: number, precio_aire: number }> {
    return this.http.get<{ ok: boolean, precio: number, sena: number, precio_aire: number }>(
      '/api/configuracion/precio-quincho'
    );
  }

  updatePrecioQuincho(precio: number, sena: number, precioAire: number): Observable<{ ok: boolean, message: string }> {
    return this.http.put<{ ok: boolean, message: string }>(
      '/api/configuracion/precio-quincho',
      { precio, sena, precio_aire: precioAire },
      { headers: this.getHeaders() }
    );
  }

  getDispositivoStatus(tipo: 'cancha' | 'quincho'): Observable<{ ok: boolean, output: boolean, mode: 'ON' | 'OFF' | 'AUTO' }> {
    return this.http.get<{ ok: boolean, output: boolean, mode: 'ON' | 'OFF' | 'AUTO' }>(
      `/api/configuracion/dispositivo/${tipo}`,
      { headers: this.getHeaders() }
    );
  }

  updateDispositivoMode(tipo: 'cancha' | 'quincho', mode: 'ON' | 'OFF' | 'AUTO'): Observable<{ ok: boolean, message: string }> {
    return this.http.put<{ ok: boolean, message: string }>(
      `/api/configuracion/dispositivo/${tipo}`,
      { mode },
      { headers: this.getHeaders() }
    );
  }
}
