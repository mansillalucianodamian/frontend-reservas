import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'userFilter',
    standalone: true // ✅ así lo podés importar directo en tu componente standalone
})
export class UserFilterPipe implements PipeTransform {
    transform(reservas: any[], filtroUsuario: string): any[] {
        if (!reservas) return [];
        if (!filtroUsuario) return reservas;
        return reservas.filter(r =>
            r.usuario?.toLowerCase().includes(filtroUsuario.toLowerCase())
        );
    }
}
