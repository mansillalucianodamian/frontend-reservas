import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 Necesario para [(ngModel)]

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, FormsModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  motivoText: string = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.tipo === 'prompt') {
      this.motivoText = this.data.defaultText || '';
    }
  }

  onCancel() { this.dialogRef.close(false); }
  
  onConfirm() {
    if (this.data && this.data.tipo === 'prompt') {
      this.dialogRef.close(this.motivoText);
    } else {
      this.dialogRef.close(true);
    }
  }
  
  onClose() { this.dialogRef.close(); }
}
