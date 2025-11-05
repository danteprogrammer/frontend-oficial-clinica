import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionMedicos } from './gestion-medicos';

describe('GestionMedicos', () => {
  let component: GestionMedicos;
  let fixture: ComponentFixture<GestionMedicos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionMedicos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionMedicos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
