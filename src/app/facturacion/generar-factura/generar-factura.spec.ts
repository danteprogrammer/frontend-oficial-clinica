import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarFactura } from './generar-factura';

describe('GenerarFactura', () => {
  let component: GenerarFactura;
  let fixture: ComponentFixture<GenerarFactura>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerarFactura]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerarFactura);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
