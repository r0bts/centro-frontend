import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoSocios } from './servicio-medico-socios';

describe('ServicioMedicoSocios', () => {
  let component: ServicioMedicoSocios;
  let fixture: ComponentFixture<ServicioMedicoSocios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoSocios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoSocios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
