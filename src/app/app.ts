import { Component, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isLoggedIn$;
  userFirstName = '';
  userFullName = '';
  userInitials = '';
  userRole = '';
  isDropdownOpen = false;

  constructor(private authService: AuthService, private router: Router, private elementRef: ElementRef) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    this.isLoggedIn$.subscribe(status => {
      console.log('📡 Navbar recibió estado:', status);
      if (status) {
        const user = this.authService.getUser();
        if (user) {
          // Extraer primer nombre y nombre completo
          this.userFirstName = user.nombre ? user.nombre.split(' ')[0] : '';
          this.userFullName = user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || '';
          
          // Generar iniciales (ej: "LM")
          const firstN = user.nombre ? user.nombre.charAt(0).toUpperCase() : '';
          const firstA = user.apellido ? user.apellido.charAt(0).toUpperCase() : '';
          this.userInitials = `${firstN}${firstA}`;

          // Guardar el rol para mostrar accesos correspondientes
          this.userRole = user.rol || '';
        }
      } else {
        this.userFirstName = '';
        this.userFullName = '';
        this.userInitials = '';
        this.userRole = '';
        this.isDropdownOpen = false;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  getRoleLabel(role: string): string {
    switch (role?.toLowerCase()) {
      case 'super_admin': return 'Administrador';
      case 'recepcionista': return 'Recepcionista';
      case 'usuario': return 'Usuario';
      default: return role;
    }
  }

  cerrarSesion() {
    console.log('👆 cerrarSesion() ejecutado');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
