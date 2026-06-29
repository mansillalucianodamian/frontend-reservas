import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p>{{ data.mensaje }}</p>

      <!-- Lista de reservas opcional -->
      <ul *ngIf="data.reservas">
        <li *ngFor="let r of data.reservas">
          📅 {{ r.fecha }} - 🕒 {{ r.hora }}
        </li>
      </ul>

      <!-- Mensaje de resultado opcional -->
      <div *ngIf="data.resultado" 
           [ngClass]="{'success-message': data.tipo === 'success', 'error-message': data.tipo === 'error'}">
        {{ data.resultado }}
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" *ngIf="!data.resultado">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Confirmar</button>
    </mat-dialog-actions>

    <mat-dialog-actions align="end" *ngIf="data.resultado">
      <button mat-raised-button color="primary" (click)="onClose()">Cerrar</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel() { this.dialogRef.close(false); }
  onConfirm() { this.dialogRef.close(true); }
  onClose() { this.dialogRef.close(); }
}
