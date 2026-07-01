import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalWizard } from './medical-wizard';

describe('MedicalWizard', () => {
  let component: MedicalWizard;
  let fixture: ComponentFixture<MedicalWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalWizard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalWizard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
