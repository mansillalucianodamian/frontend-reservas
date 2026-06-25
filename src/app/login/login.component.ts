import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '../services/usuario.service';
import { Router } from '@angular/router';
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

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private authService: AuthService, // 👈 Inyectar AuthService
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
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

    const credentials = { ...this.loginForm.value };

    this.usuariosService.login(credentials).subscribe({
      next: (res) => {
        if (res.token) {
          // ✅ Guardar token en localStorage
          localStorage.setItem('token', res.token);

          // ✅ Guardar datos de usuario
          localStorage.setItem('usuarioId', res.user?.id?.toString() || '');
          localStorage.setItem('rol', res.user?.rol || '');

          // ✅ Actualizar AuthService (si usás BehaviorSubject)
          this.authService.setToken(res.token);
        } else {
          console.error('❌ No se recibió token en la respuesta');
        }

        // Redirigir según rol
        switch (res.user?.rol) {
          case 'usuario':
            this.router.navigate(['/reservas']);
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
