import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidarSeguro } from './validar-seguro';

describe('ValidarSeguro', () => {
  let component: ValidarSeguro;
  let fixture: ComponentFixture<ValidarSeguro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidarSeguro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidarSeguro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
