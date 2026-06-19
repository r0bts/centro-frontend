import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoPreregistros } from './servicio-medico-preregistros';

describe('ServicioMedicoPreregistros', () => {
  let component: ServicioMedicoPreregistros;
  let fixture: ComponentFixture<ServicioMedicoPreregistros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoPreregistros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoPreregistros);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
