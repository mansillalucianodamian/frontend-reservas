import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'userFilter',
    standalone: true // ✅ así lo podés importar directo en tu componente standalone
})
export class UserFilterPipe implements PipeTransform {
    transform(reservas: any[], filtroUsuario: string): any[] {
        if (!reservas) return [];
        if (!filtroUsuario || !filtroUsuario.trim()) return reservas;
        const term = filtroUsuario.trim().toLowerCase();
        return reservas.filter(r =>
            r.usuario?.toLowerCase().includes(term) ||
            r.dni?.toString().toLowerCase().includes(term) ||
            r.telefono?.toString().toLowerCase().includes(term) ||
            r.id?.toString().includes(term)
        );
    }
}
