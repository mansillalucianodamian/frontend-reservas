import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../services/usuario.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service'; // 👈 Importar AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  mostrarContrasena = false;

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute, // 👈 Inyectar ActivatedRoute
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private authService: AuthService, // 👈 Inyectar AuthService
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [true] // 👈 Control para "Recuérdame" iniciado en true
    });

    // 🔹 Escuchar parámetros de consulta (ej. email verificado)
    this.route.queryParams.subscribe(params => {
      if (params['verified'] === 'true') {
        this.successMessage = '¡Email verificado con éxito! Ya puedes iniciar sesión.';
        this.errorMessage = null;
        this.cd.detectChanges();
      } else if (params['verified'] === 'false') {
        this.errorMessage = params['error'] || 'Error al verificar el correo electrónico.';
        this.successMessage = null;
        this.cd.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };
    const rememberMe = this.loginForm.value.rememberMe;

    this.usuariosService.login(credentials).subscribe({
      next: (res) => {
        if (res.token) {
          // Primero, limpiamos sesiones anteriores de ambos lados
          localStorage.removeItem('token');
          localStorage.removeItem('usuarioId');
          localStorage.removeItem('rol');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('usuarioId');
          sessionStorage.removeItem('rol');

          const storage = rememberMe ? localStorage : sessionStorage;

          // ✅ Guardar datos de sesión localmente
          storage.setItem('token', res.token);
          storage.setItem('usuarioId', res.user?.id?.toString() || '');
          storage.setItem('rol', res.user?.rol || '');

          if (res.user) {
            this.authService.setUser(res.user, rememberMe);
          }

          // ✅ Actualizar AuthService
          this.authService.setToken(res.token, rememberMe);
        } else {
          console.error('❌ No se recibió token en la respuesta');
        }

        // Redirigir según rol
        switch (res.user?.rol) {
          case 'usuario':
            this.router.navigate(['/inicio']);
            break;
          case 'recepcionista':
            this.router.navigate(['/recepcionista']);
            break;
          case 'super_admin':
            this.router.navigate(['/admin']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error inesperado al iniciar sesión';
        this.successMessage = null;
        this.isLoading = false;
        this.cd.detectChanges();
        this.loginForm.markAllAsTouched();
      }
    });
  }


  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  goToRegister(): void {
    this.router.navigate(['/registro']);
  }
}
