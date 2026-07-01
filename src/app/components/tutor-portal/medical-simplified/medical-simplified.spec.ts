import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalSimplified } from './medical-simplified';

describe('MedicalSimplified', () => {
  let component: MedicalSimplified;
  let fixture: ComponentFixture<MedicalSimplified>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalSimplified]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalSimplified);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
