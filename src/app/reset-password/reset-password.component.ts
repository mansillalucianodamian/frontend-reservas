import { ActivatedRoute } from '@angular/router';
import { UsuariosService } from '../services/usuario.service';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  token!: string;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
  this.token = this.route.snapshot.paramMap.get('reset_token')!;

  this.resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordsMatchValidator });
}

passwordsMatchValidator(form: FormGroup) {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

onSubmit(): void {
  if (this.resetForm.invalid) {
    this.resetForm.markAllAsTouched();
    return;
  }

  const { password } = this.resetForm.value;
  this.usuariosService.resetPassword(this.token, password).subscribe({
    next: (res) => {
      this.successMessage = res.message;
      this.errorMessage = null;
      this.isLoading = false;
      this.resetForm.reset();
    },
    error: (err) => {
      this.errorMessage = err.error?.message || 'Error al restablecer contraseña';
      this.successMessage = null;
      this.isLoading = false;
    }
  });
}
}