import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioMedicoDashboard } from './servicio-medico-dashboard';

describe('ServicioMedicoDashboard', () => {
  let component: ServicioMedicoDashboard;
  let fixture: ComponentFixture<ServicioMedicoDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioMedicoDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioMedicoDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
