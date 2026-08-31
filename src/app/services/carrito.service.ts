import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ReservasService } from './reservas.service';

@Injectable({ providedIn: 'root' })
export class CarritoService {
    private carritoSubject = new BehaviorSubject<any[]>([]);
    carrito$ = this.carritoSubject.asObservable(); // 👈 observable para usar con async pipe

    constructor(private reservasService: ReservasService) { }

    getCarrito(): any[] {
        return this.carritoSubject.value;
    }

    private getSemanaId(fechaStr: string): string {
        try {
            let clean = fechaStr.toString().trim();
            if (clean.includes('T')) clean = clean.split('T')[0];
            const partes = clean.split('-').map(Number);
            if (partes.length === 3) {
                const date = new Date(partes[0], partes[1] - 1, partes[2]);
                const day = date.getDay(); // 0: Dom, 1: Lun
                const diffLunes = day === 0 ? -6 : 1 - day;
                const lunes = new Date(partes[0], partes[1] - 1, partes[2] + diffLunes);
                return `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, '0')}-${String(lunes.getDate()).padStart(2, '0')}`;
            }
        } catch (e) {}
        return fechaStr;
    }

    private esTurnoUltimoMomento(fechaStr: string, horaStr: string): boolean {
        try {
            let clean = fechaStr.toString().trim();
            if (clean.includes('T')) clean = clean.split('T')[0];
            const [y, mes, d] = clean.split('-').map(Number);
            const [h, m] = (horaStr || '00:00').split(':').map(Number);
            const turnoDate = new Date(y, mes - 1, d, h || 0, m || 0, 0);
            const ahora = new Date();
            const diffMs = turnoDate.getTime() - ahora.getTime();
            const diffHoras = diffMs / (1000 * 60 * 60);
            return diffHoras > 0 && diffHoras < 8;
        } catch (e) {
            return false;
        }
    }

    addReserva(reserva: any) {
        const carrito = this.carritoSubject.value;

        if (reserva.tipo === 'cancha') {
            const semId = this.getSemanaId(reserva.fecha);

            // Contar reservas de cancha en esa misma semana en el carrito
            const reservasSemana = carrito.filter(r => {
                if (r.tipo !== 'cancha') return false;
                return this.getSemanaId(r.fecha) === semId;
            });

            const esExpress = this.esTurnoUltimoMomento(reserva.fecha, reserva.hora);
            const maxPermitido = esExpress ? 3 : 2;

            if (reservasSemana.length >= maxPermitido) {
                if (maxPermitido === 2) {
                    throw new Error('⚠️ Solo puedes agregar hasta 2 reservas de cancha por semana (se habilita una 3ra si faltan menos de 8 hs para el horario)');
                } else {
                    throw new Error('⚠️ Has alcanzado el límite máximo de 3 reservas semanales para esa semana');
                }
            }
        }

        this.carritoSubject.next([...carrito, reserva]);
    }

    removeReserva(reserva: any) {
        const nuevo = this.carritoSubject.value.filter(r =>
            !(r.fecha === reserva.fecha && r.hora === reserva.hora && r.tipo === reserva.tipo)
        );
        this.carritoSubject.next(nuevo);
    }

    clearCarrito() {
        this.carritoSubject.next([]);
    }

    async confirmarCarrito() {
        const results = [];
        for (const r of this.carritoSubject.value) {
            const res = await this.reservasService.crearReserva(r.fecha, r.hora, r.tipo || 'cancha', r.motivo || null, r.conAire || false).toPromise();
            results.push(res);
        }
        this.clearCarrito(); // 👈 vacía y emite nuevo valor
        return results;
    }
}
