import { Usuario } from './usuario.model';

export interface RegistroResponse {
  ok: boolean;
  message: string;
  status: number;
  user?: Usuario;
}

export interface LoginResponse {
  ok: boolean;
  message: string;
  token: string; // el backend devuelve el JWT
  user?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  };
}
