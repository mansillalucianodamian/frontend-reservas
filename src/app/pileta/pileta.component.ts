import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PiletaService, PiletaConfig } from '../services/pileta.service';

@Component({
  selector: 'app-pileta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pileta.component.html',
  styleUrls: ['./pileta.component.css']
})
export class PiletaComponent implements OnInit {
  config: PiletaConfig = {
    precio_adulto: 4000,
    precio_nino: 3000,
    precio_adulto_finde_res: 6000,
    precio_nino_finde_res: 4000,
    precio_adulto_finde_nores: 8000,
    precio_nino_finde_nores: 5000,
    carnet_mayor_dic: 30000,
    carnet_mayor_ene: 35000,
    carnet_mayor_feb: 30000,
    carnet_menor_dic: 25000,
    carnet_menor_ene: 30000,
    carnet_menor_feb: 25000,
    abierta: 1,
    horarios: 'Martes a Viernes de 16:00 a 20:00 hs | Sábados, Domingos y Feriados',
    mensaje_estado: 'Temporada 2026-2027: Inicio sábado 12/12/2026 hasta domingo 28/02/2027'
  };
  cargando: boolean = true;
  userRole: string = '';
  mostrarVistaPrevia: boolean = false;

  constructor(
    private piletaService: PiletaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('rol') || sessionStorage.getItem('rol') || 'usuario';
    this.cargarConfig();
  }

  cargarConfig(): void {
    this.cargando = true;
    this.piletaService.getConfig().subscribe({
      next: (data) => {
        if (data) {
          this.config = { ...this.config, ...data };
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get esAbierta(): boolean {
    return this.config.abierta === 1 || this.config.abierta === true;
  }

  get puedeAccederBoleteria(): boolean {
    return ['boletero', 'recepcionista', 'super_admin'].includes(this.userRole);
  }
}
