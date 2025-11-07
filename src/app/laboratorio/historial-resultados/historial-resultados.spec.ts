import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialResultados } from './historial-resultados';

describe('HistorialResultados', () => {
  let component: HistorialResultados;
  let fixture: ComponentFixture<HistorialResultados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialResultados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialResultados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
