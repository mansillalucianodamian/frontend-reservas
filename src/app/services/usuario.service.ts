import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { LoginResponse, RegistroResponse } from '../models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private apiAdminUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // 🔹 Registro
  registrar(usuario: Usuario): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.apiUrl}/register`, usuario);
  }

  // 🔹 Login
  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  // 🔹 Forgot password
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  // 🔹 Reset password
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password/${token}`,
      { new_password: newPassword }
    );
  }

  // ============================
  // Métodos para SuperAdmin
  // ============================

  // 🔹 Listar usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<{ ok: boolean; users: Usuario[] }>(
      this.apiAdminUrl,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.users || []),
      catchError(err => throwError(() => err.error?.message || 'Error al obtener usuarios'))
    );
  }

  // 🔹 Crear usuario
  crearUsuario(usuario: Usuario): Observable<{ ok: boolean; message: string; usuario?: Usuario }> {
    return this.http.post<{ ok: boolean; message: string; usuario?: Usuario }>(
      this.apiAdminUrl,
      usuario,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || 'Error al crear usuario'
      })))
    );
  }

  // 🔹 Editar usuario
  editarUsuario(id: number, usuario: Partial<Usuario>): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(
      `${this.apiAdminUrl}/${id}`,
      usuario,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || 'Error al editar usuario'
      })))
    );
  }

  // 🔹 Eliminar usuario
  eliminarUsuario(id: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${this.apiAdminUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || 'Error al eliminar usuario'
      })))
    );
  }

  // 🔹 Asignar rol
  asignarRol(id: number, rol: string): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(
      `${this.apiAdminUrl}/${id}`,
      { rol },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => throwError(() => ({
        ok: false,
        message: err.error?.message || 'Error al asignar rol'
      })))
    );
  }
}



