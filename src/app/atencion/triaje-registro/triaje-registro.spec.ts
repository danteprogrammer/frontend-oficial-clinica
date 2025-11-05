import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriajeRegistro } from './triaje-registro';

describe('TriajeRegistro', () => {
  let component: TriajeRegistro;
  let fixture: ComponentFixture<TriajeRegistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriajeRegistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriajeRegistro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
