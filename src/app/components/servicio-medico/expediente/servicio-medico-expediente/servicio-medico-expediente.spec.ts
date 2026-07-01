import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoExpediente } from './servicio-medico-expediente';

describe('ServicioMedicoExpediente', () => {
  let component: ServicioMedicoExpediente;
  let fixture: ComponentFixture<ServicioMedicoExpediente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoExpediente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoExpediente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
