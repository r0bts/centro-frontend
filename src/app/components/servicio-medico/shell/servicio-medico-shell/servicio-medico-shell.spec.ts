import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoShell } from './servicio-medico-shell';

describe('ServicioMedicoShell', () => {
  let component: ServicioMedicoShell;
  let fixture: ComponentFixture<ServicioMedicoShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
