import { TestBed } from '@angular/core/testing';

import { ServicioMedico } from './servicio-medico';

describe('ServicioMedico', () => {
  let service: ServicioMedico;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioMedico);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
