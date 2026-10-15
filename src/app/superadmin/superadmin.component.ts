import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminUsuariosComponent } from './admin-usuarios.component';
import { AdminReservasComponent } from './admin-reservas.component';
import { AdminDomoticaComponent } from './admin-domotica.component';
import { AdminConfigComponent } from './admin-config.component';

/**
 * SuperAdminComponent (Refactorizado - FNT-02).
 * Desacoplado del God Component de 1275 líneas.
 * Actúa estrictamente como orquestador de vistas standalone especializadas:
 * - AdminReservasComponent (Gestión, confirmación y cancelación de reservas)
 * - AdminUsuariosComponent (CRUD y tabla de usuarios)
 * - AdminDomoticaComponent (Control manual y estado de luces/aires Shelly)
 * - AdminConfigComponent (Precios y parámetros del sistema)
 */
@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    AdminUsuariosComponent,
    AdminReservasComponent,
    AdminDomoticaComponent,
    AdminConfigComponent
  ],
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminComponent {}
