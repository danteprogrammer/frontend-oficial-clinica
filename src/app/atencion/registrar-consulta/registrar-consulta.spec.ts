import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarConsulta } from './registrar-consulta';

describe('RegistrarConsulta', () => {
  let component: RegistrarConsulta;
  let fixture: ComponentFixture<RegistrarConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
