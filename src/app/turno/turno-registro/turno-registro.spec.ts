import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoRegistro } from './turno-registro';

describe('TurnoRegistro', () => {
  let component: TurnoRegistro;
  let fixture: ComponentFixture<TurnoRegistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnoRegistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnoRegistro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
