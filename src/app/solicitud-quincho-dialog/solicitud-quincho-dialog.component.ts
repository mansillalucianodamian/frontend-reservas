import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-solicitud-quincho-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './solicitud-quincho-dialog.component.html',
  styleUrls: ['./solicitud-quincho-dialog.component.css']
})
export class SolicitudQuinchoDialogComponent implements OnInit {
  solicitudForm!: FormGroup;
  nombreCompleto: string = '';

  constructor(
    private dialogRef: MatDialogRef<SolicitudQuinchoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fecha: string; hora: string; precioBase?: number; precioAire?: number },
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  get precioBase(): number {
    return this.data.precioBase || 21500;
  }

  get precioAire(): number {
    return this.data.precioAire || 10000;
  }

  get totalEstimado(): number {
    const conAire = this.solicitudForm?.get('conAire')?.value;
    return this.precioBase + (conAire ? this.precioAire : 0);
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
    } else {
      this.nombreCompleto = 'Usuario Registrado';
    }

    this.solicitudForm = this.fb.group({
      nombre: [{ value: this.nombreCompleto, disabled: true }],
      asistentes: ['', [Validators.required, Validators.min(1), Validators.max(500)]],
      actividad: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      conAire: [false],
      aceptoReglamento: [false, Validators.requiredTrue]
    });
  }

  onSubmit(): void {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    const { asistentes, actividad, conAire } = this.solicitudForm.value;
    this.dialogRef.close({
      asistentes,
      actividad,
      conAire: !!conAire
    });
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
