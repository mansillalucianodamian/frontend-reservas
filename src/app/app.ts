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

  constructor(private authService: AuthService, private router: Router) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    // 👇 suscribite para ver qué valores llegan
    this.isLoggedIn$.subscribe(status => {
      console.log('📡 Navbar recibió estado:', status);
    });
  }

  cerrarSesion() {
    console.log('👆 cerrarSesion() ejecutado');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
