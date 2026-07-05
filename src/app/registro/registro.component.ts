import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Usuario } from '../models/usuario.model';
import { UsuariosService } from '../services/usuario.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  mostrarContrasena = false;

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    const usuario: Usuario = { ...this.registroForm.value };

    this.usuariosService.registrar(usuario).subscribe({
      next: (res) => {
        this.successMessage = res.message || '✅ Registro completado. Ya puedes iniciar sesión.';
        this.errorMessage = null;
        this.isLoading = false;
        this.cd.detectChanges();
        this.registroForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error inesperado al registrar';
        this.successMessage = null;
        this.isLoading = false;
        this.cd.detectChanges();
        this.registroForm.markAllAsTouched();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
