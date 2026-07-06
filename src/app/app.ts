import { Component } from '@angular/core';
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
  userInitials = '';

  constructor(private authService: AuthService, private router: Router) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    this.isLoggedIn$.subscribe(status => {
      console.log('📡 Navbar recibió estado:', status);
      if (status) {
        const user = this.authService.getUser();
        if (user) {
          // Extraer primer nombre
          this.userFirstName = user.nombre ? user.nombre.split(' ')[0] : '';
          
          // Generar iniciales (ej: "LM")
          const firstN = user.nombre ? user.nombre.charAt(0).toUpperCase() : '';
          const firstA = user.apellido ? user.apellido.charAt(0).toUpperCase() : '';
          this.userInitials = `${firstN}${firstA}`;
        }
      } else {
        this.userFirstName = '';
        this.userInitials = '';
      }
    });
  }

  cerrarSesion() {
    console.log('👆 cerrarSesion() ejecutado');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
