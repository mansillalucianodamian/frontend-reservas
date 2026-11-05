import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RecepcionistaComponent } from './recepcionista.component';
import { ReservasService } from '../services/reservas.service';

const reservasServiceStub = {
  getReservas: () => of([]),
  getReservasPendientes: () => of([]),
  getAprobacionesRecientes: () => of([]),
  getPrecioCancha: () => of({ ok: true, precio: 5000 }),
  getPrecioQuincho: () => of({ ok: true, precio: 21500, sena: 0, precio_aire: 10000 }),
  cancelarReserva: () => of({ ok: true, message: 'ok' })
};

describe('RecepcionistaComponent - Agenda Diaria', () => {
  let component: RecepcionistaComponent;
  let fixture: ComponentFixture<RecepcionistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionistaComponent],
      providers: [{ provide: ReservasService, useValue: reservasServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(RecepcionistaComponent);
    component = fixture.componentInstance;
    component.fechaAgenda = '2026-11-05';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('normaliza horas con segundos', () => {
    expect(component.normalizarHora('9:00:00')).toBe('09:00');
    expect(component.normalizarHora('19:00')).toBe('19:00');
    expect(component.normalizarHora('')).toBe('');
  });

  it('arma la grilla completa con todos los horarios libres si no hay reservas', () => {
    component.reservasAgendaDia = [];
    component.recalcularGrillaAgenda();

    expect(component.slotsAgendaCancha.length).toBe(18);
    expect(component.slotsAgendaQuincho.length).toBe(2);
    expect(component.slotsAgendaCancha.every(s => s.estadoSlot === 'libre')).toBe(true);
    expect(component.resumenAgenda.libres).toBe(18);
  });

  it('clasifica pagados, pendientes y bloqueados y excluye canceladas', () => {
    component.reservasAgendaDia = [
      { id: 1, tipo: 'cancha', fecha: '2026-11-05', hora: '18:00:00', estado: 'Aprobado', usuario: 'Perez, Ana', dni: '1', telefono: '2' },
      { id: 2, tipo: 'cancha', fecha: '2026-11-05', hora: '19:00:00', estado: 'Pendiente', usuario: 'Gomez, Luis' },
      { id: 3, tipo: 'cancha', fecha: '2026-11-05', hora: '20:00:00', estado: 'Bloqueado', usuario_id: null },
      { id: 4, tipo: 'cancha', fecha: '2026-11-05', hora: '21:00:00', estado: 'Cancelado', usuario: 'Lopez, Eva' }
    ];
    component.recalcularGrillaAgenda();

    const porHora = (h: string) => component.slotsAgendaCancha.find(s => s.hora === h)!;
    expect(porHora('18:00').estadoSlot).toBe('aprobado');
    expect(porHora('19:00').estadoSlot).toBe('pendiente');
    expect(porHora('20:00').estadoSlot).toBe('bloqueado');
    expect(porHora('21:00').estadoSlot).toBe('libre');
    expect(component.resumenAgenda.aprobados).toBe(1);
    expect(component.resumenAgenda.pendientes).toBe(1);
    expect(component.resumenAgenda.bloqueados).toBe(1);
  });

  it('no mezcla turnos de cancha y quincho a la misma hora', () => {
    component.agendaTipoRecurso = 'todos';
    component.reservasAgendaDia = [
      { id: 5, tipo: 'quincho', fecha: '2026-11-05', hora: '19:00', estado: 'Pendiente', usuario: 'Diaz, Sol' }
    ];
    component.recalcularGrillaAgenda();

    expect(component.slotsAgendaQuincho.find(s => s.hora === '19:00')!.estadoSlot).toBe('pendiente');
    expect(component.slotsAgendaCancha.find(s => s.hora === '19:00')!.estadoSlot).toBe('libre');
  });

  it('filtra por "Falta pagar"', () => {
    component.reservasAgendaDia = [
      { id: 1, tipo: 'cancha', fecha: '2026-11-05', hora: '18:00', estado: 'Aprobado', usuario: 'A' },
      { id: 2, tipo: 'cancha', fecha: '2026-11-05', hora: '19:00', estado: 'Pendiente', usuario: 'B' }
    ];
    component.agendaFiltroEstado = 'pendiente';
    component.recalcularGrillaAgenda();

    expect(component.slotsAgendaCancha.length).toBe(1);
    expect(component.slotsAgendaCancha[0].hora).toBe('19:00');
  });

  it('busca por DNI y teléfono del vecino', () => {
    component.reservasAgendaDia = [
      { id: 1, tipo: 'cancha', fecha: '2026-11-05', hora: '18:00', estado: 'Aprobado', usuario: 'Perez, Ana', dni: '30111222', telefono: '2994001122' },
      { id: 2, tipo: 'cancha', fecha: '2026-11-05', hora: '19:00', estado: 'Pendiente', usuario: 'Gomez, Luis', dni: '28999888', telefono: '2994009988' }
    ];

    component.agendaBusqueda = '30111';
    component.recalcularGrillaAgenda();
    expect(component.slotsAgendaCancha.map(s => s.hora)).toEqual(['18:00']);

    component.agendaBusqueda = '009988';
    component.recalcularGrillaAgenda();
    expect(component.slotsAgendaCancha.map(s => s.hora)).toEqual(['19:00']);
  });

  it('cambia de día correctamente', () => {
    component.fechaAgenda = '2026-11-30';
    component.cambiarDiaAgenda(1);
    expect(component.fechaAgenda).toBe('2026-12-01');
    component.cambiarDiaAgenda(-1);
    expect(component.fechaAgenda).toBe('2026-11-30');
  });
});
