import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummerCourseMedicalVisits } from './summer-course-medical-visits';

describe('SummerCourseMedicalVisits', () => {
  let component: SummerCourseMedicalVisits;
  let fixture: ComponentFixture<SummerCourseMedicalVisits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummerCourseMedicalVisits]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummerCourseMedicalVisits);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
