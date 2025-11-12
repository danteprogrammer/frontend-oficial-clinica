import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionConsultorios } from './gestion-consultorios';

describe('GestionConsultorios', () => {
  let component: GestionConsultorios;
  let fixture: ComponentFixture<GestionConsultorios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionConsultorios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionConsultorios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
