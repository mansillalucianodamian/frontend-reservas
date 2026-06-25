export interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  password: string;
  rol?: string; // opcional, backend lo setea como 'usuario'
}