import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorContactComponent } from './doctor-contact.component';

describe('DoctorContactComponent', () => {
  let component: DoctorContactComponent;
  let fixture: ComponentFixture<DoctorContactComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DoctorContactComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
