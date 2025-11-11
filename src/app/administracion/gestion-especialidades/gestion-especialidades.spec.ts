import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionEspecialidades } from './gestion-especialidades';

describe('GestionEspecialidades', () => {
  let component: GestionEspecialidades;
  let fixture: ComponentFixture<GestionEspecialidades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionEspecialidades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionEspecialidades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
