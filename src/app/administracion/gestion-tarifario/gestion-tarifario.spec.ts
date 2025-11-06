import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionTarifario } from './gestion-tarifario';

describe('GestionTarifario', () => {
  let component: GestionTarifario;
  let fixture: ComponentFixture<GestionTarifario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionTarifario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionTarifario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
