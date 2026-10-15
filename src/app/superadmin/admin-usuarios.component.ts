import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UsuariosService } from '../services/usuario.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-tab-layout">
      <!-- Buscador -->
      <div class="search-box">
        <div class="search-input-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Buscar por Nombre, DNI, Email o Rol..." [(ngModel)]="filtroUsuario" class="search-input">
        </div>
      </div>

      <!-- Tabla/Listado de Usuarios -->
      <div *ngIf="usuarios$ | async as usuarios; else cargandoUsuarios" class="users-list">
        <div *ngFor="let u of filtrarUsuariosList(usuarios)" class="user-row-card" [class.bloqueado]="u.rol === 'bloqueado'">
          <div class="user-main-info">
            <div class="user-avatar-circle" [class.bloqueado]="u.rol === 'bloqueado'">
              <span>{{ u.nombre ? u.nombre.substring(0,1).toUpperCase() : '' }}{{ u.apellido ? u.apellido.substring(0,1).toUpperCase() : '' }}</span>
            </div>
            <div class="user-text-details">
              <h4 class="user-name">
                {{ u.apellido }}, {{ u.nombre }}
                <span class="user-role-badge" [ngClass]="u.rol || 'usuario'">{{ u.rol || 'usuario' }}</span>
              </h4>
              <p class="user-meta-sub">
                <span><strong>Email:</strong> {{ u.email }}</span>
                <span class="meta-sep">•</span>
                <span><strong>DNI:</strong> {{ u.dni }}</span>
                <span class="meta-sep">•</span>
                <span><strong>Tel:</strong> {{ u.telefono || 'N/A' }}</span>
              </p>
            </div>
          </div>

          <div class="user-actions">
            <!-- Cambios de Roles (Lista Desplegable) -->
            <div class="role-selector-dropdown">
              <label class="dropdown-label" [attr.for]="'role-' + u.id">Rol:</label>
              <select [id]="'role-' + u.id" [ngModel]="u.rol || 'usuario'" (change)="onRolSelectChange($event, u)" class="role-select-input">
                <option value="usuario">Usuario</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="super_admin">Super Admin</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>

            <!-- Eliminar -->
            <button (click)="eliminarUsuario(u.id)" class="action-btn btn-usr-delete" title="Eliminar usuario permanentemente">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        <p *ngIf="filtrarUsuariosList(usuarios).length === 0" class="no-results-text">No se encontraron usuarios coincidentes.</p>
      </div>
      <ng-template #cargandoUsuarios>
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando lista de usuarios...</p>
        </div>
      </ng-template>
    </div>
  `
})
export class AdminUsuariosComponent implements OnInit {
  usuarios$: Observable<any[]> | null = null;
  filtroUsuario: string = '';

  constructor(
    private usuariosService: UsuariosService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.usuarios$ = this.usuariosService.getUsuarios();
  }

  filtrarUsuariosList(usuarios: any[]): any[] {
    if (!this.filtroUsuario) return usuarios;
    const filter = this.filtroUsuario.toLowerCase().trim();
    return usuarios.filter(u =>
      (u.nombre && u.nombre.toLowerCase().includes(filter)) ||
      (u.apellido && u.apellido.toLowerCase().includes(filter)) ||
      (u.email && u.email.toLowerCase().includes(filter)) ||
      (u.dni && u.dni.toLowerCase().includes(filter))
    );
  }

  onRolSelectChange(event: Event, user: any): void {
    const selectEl = event.target as HTMLSelectElement;
    const oldRol = user.rol || 'usuario';
    const newRol = selectEl.value;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Actualizar Rol',
        mensaje: `¿Estás seguro de cambiar el rol del usuario a "${newRol.toUpperCase()}"?`,
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.asignarRol(user.id, newRol).subscribe({
          next: () => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Rol Actualizado',
                mensaje: `El rol se actualizó correctamente a "${newRol}".`,
                tipo: 'success'
              }
            });
            this.loadUsuarios();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: err.error?.message || 'Ocurrió un error al actualizar el rol.',
                tipo: 'error'
              }
            });
            selectEl.value = oldRol;
            this.cdr.detectChanges();
          }
        });
      } else {
        selectEl.value = oldRol;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarUsuario(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar Usuario',
        mensaje: '¿Estás seguro de eliminar este usuario de forma permanente? Esta acción no se puede deshacer.',
        tipo: 'confirm'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.eliminarUsuario(id).subscribe({
          next: () => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Usuario Eliminado',
                mensaje: '',
                resultado: 'El usuario fue removido correctamente.',
                tipo: 'success'
              }
            });
            this.loadUsuarios();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                titulo: 'Error',
                mensaje: '',
                resultado: err.message || 'Error al eliminar usuario',
                tipo: 'error'
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
