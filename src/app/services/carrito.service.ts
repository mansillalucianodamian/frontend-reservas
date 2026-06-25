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

    addReserva(reserva: any) {
        const carrito = this.carritoSubject.value;

        // Calcular semana de la reserva
        const fechaObj = new Date(reserva.fecha);
        const inicioSemana = new Date(fechaObj);
        inicioSemana.setDate(fechaObj.getDate() - fechaObj.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);

        // Contar reservas en esa semana
        const reservasSemana = carrito.filter(r => {
            const f = new Date(r.fecha);
            return f >= inicioSemana && f <= finSemana;
        });

        if (reservasSemana.length >= 2) {
            throw new Error('⚠️ Solo puedes agregar hasta 2 reservas por semana');
        }

        this.carritoSubject.next([...carrito, reserva]);
    }

    removeReserva(reserva: any) {
        const nuevo = this.carritoSubject.value.filter(r =>
            !(r.fecha === reserva.fecha && r.hora === reserva.hora)
        );
        this.carritoSubject.next(nuevo);
    }

    clearCarrito() {
        this.carritoSubject.next([]);
    }

    async confirmarCarrito() {
        const results = [];
        for (const r of this.carritoSubject.value) {
            const res = await this.reservasService.crearReserva(r.fecha, r.hora).toPromise();
            results.push(res);
        }
        this.clearCarrito(); // 👈 vacía y emite nuevo valor
        return results;
    }
}
