import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialConsultas } from './historial-consultas';

describe('HistorialConsultas', () => {
  let component: HistorialConsultas;
  let fixture: ComponentFixture<HistorialConsultas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialConsultas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialConsultas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
