import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { UsuariosService } from "../services/usuario.service";

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    const { email } = this.forgotForm.value;

    this.usuariosService.forgotPassword(email).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.errorMessage = null;
        this.isLoading = false;
        this.cd.detectChanges();
        this.forgotForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al solicitar restablecimiento';
        this.successMessage = null;
        this.isLoading = false;
        this.cd.detectChanges();
        this.forgotForm.markAllAsTouched();
      }
    });
  }
}

