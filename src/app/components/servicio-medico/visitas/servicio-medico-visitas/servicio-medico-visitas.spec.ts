import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoVisitas } from './servicio-medico-visitas';

describe('ServicioMedicoVisitas', () => {
  let component: ServicioMedicoVisitas;
  let fixture: ComponentFixture<ServicioMedicoVisitas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoVisitas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoVisitas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
