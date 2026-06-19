import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoScanner } from './servicio-medico-scanner';

describe('ServicioMedicoScanner', () => {
  let component: ServicioMedicoScanner;
  let fixture: ComponentFixture<ServicioMedicoScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoScanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoScanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
