export interface Reserva {
  id: number;
  usuario_id: number;
  fecha: string;   // o Date si querés parsear
  hora: string;
  estado: string;
  motivo: string;
}

