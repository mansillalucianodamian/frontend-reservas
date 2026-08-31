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
  checkboxValue: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      if (this.data.tipo === 'prompt') {
        this.motivoText = this.data.defaultText || '';
        this.checkboxValue = this.data.checkboxDefault || false;
      }
      
      // 🔹 Limpiar emojis problemáticos y parsear mensajes técnicos HTTP si llegaran a filtrarse
      const cleanText = (txt: string) => {
        if (!txt) return txt;
        let cleaned = txt.replace(/[✅❌⚠️]/g, '').trim();
        if (cleaned.startsWith('Http failure response')) {
          if (cleaned.includes('400')) {
            return 'No se pudo procesar la solicitud. Es posible que hayas alcanzado el límite semanal de reservas o que el turno ya no esté disponible.';
          }
          if (cleaned.includes('401') || cleaned.includes('403')) {
            return 'Tu sesión ha expirado o no tienes permisos. Por favor, vuelve a iniciar sesión.';
          }
          if (cleaned.includes('500')) {
            return 'Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.';
          }
          return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
        }
        return cleaned;
      };

      if (this.data.titulo) this.data.titulo = cleanText(this.data.titulo);
      if (this.data.mensaje) this.data.mensaje = cleanText(this.data.mensaje);
      if (this.data.resultado) this.data.resultado = cleanText(this.data.resultado);
    }
  }

  onCancel() { this.dialogRef.close(false); }
  
  onConfirm() {
    if (this.data && this.data.tipo === 'prompt') {
      if (this.data.showCheckbox) {
        this.dialogRef.close({ motivo: this.motivoText, conLuz: this.checkboxValue });
      } else {
        this.dialogRef.close(this.motivoText);
      }
    } else {
      this.dialogRef.close(true);
    }
  }
  
  onClose() { this.dialogRef.close(); }
}
