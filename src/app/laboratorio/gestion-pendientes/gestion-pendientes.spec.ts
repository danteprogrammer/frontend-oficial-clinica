import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPendientes } from './gestion-pendientes';

describe('GestionPendientes', () => {
  let component: GestionPendientes;
  let fixture: ComponentFixture<GestionPendientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPendientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPendientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
