import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private apiUrl = 'http://localhost:8080/api/reservas';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // 🔹 Obtener todas las reservas (usuario, recepcionista o admin según rol)
  getReservas(): Observable<any[]> {
    return this.http.get<{ ok: boolean, reservas: any[], message?: string }>(
      this.apiUrl,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.reservas || []),
      catchError(err => throwError(() => err.error?.message || 'Error al obtener reservas'))
    );
  }

  // 🔹 Obtener horarios disponibles para un día
  getHorariosDisponibles(fecha: string): Observable<{ hora: string, disponible: boolean }[]> {
    return this.http.get<{ ok: boolean, horarios: { hora: string, disponible: boolean }[] }>(
      `http://localhost:8080/api/reservas/disponibles/${fecha}`
    ).pipe(
      map(res => res.horarios)
    );
  }

  // 🔹 Crear una nueva reserva
  crearReserva(fecha: string, hora: string): Observable<{ ok: boolean, message: string, reserva?: any }> {
    const usuarioId = localStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioId'); // 👈 importante incluir usuario_id
    return this.http.post<{ ok: boolean, message: string, reserva?: any }>(
      this.apiUrl,
      { usuario_id: usuarioId, fecha, hora },
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ({
        ok: res.ok,
        message: res.message || (res.ok ? 'Reserva creada con éxito' : 'Error al crear reserva'),
        reserva: res.reserva
      })),
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || 'Error al crear reserva'
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
        message: err.error?.message || 'Error al cancelar reserva'
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
        message: err.error?.message || 'Error al aprobar reserva'
      })))
    );
  }
  bloquearReserva(fecha: string, hora: string, motivo: string): Observable<{ ok: boolean, message: string }> {
    return this.http.post<{ ok: boolean, message: string }>(
      `http://localhost:8080/api/reservas/bloquear`,
      { fecha, hora, motivo },
      { headers: this.getHeaders() }
    );
  }
  getReservasPendientes(): Observable<any[]> {
    return this.http.get<{ ok: boolean, reservas: any[] }>(
      'http://localhost:8080/api/reservas/pendientes',
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.reservas) // 👈 devolvemos directamente el array
    );
  }
}
