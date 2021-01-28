import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonMainLayoutComponent } from './common-main-layout.component';

describe('CommonMainLayoutComponent', () => {
  let component: CommonMainLayoutComponent;
  let fixture: ComponentFixture<CommonMainLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommonMainLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonMainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
