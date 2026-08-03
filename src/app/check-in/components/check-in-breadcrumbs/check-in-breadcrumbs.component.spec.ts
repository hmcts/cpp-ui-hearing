import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CheckInBreadcrumbsComponent } from './check-in-breadcrumbs.component';

describe('CheckInBreadcrumbsComponent', () => {
  let component: CheckInBreadcrumbsComponent;
  let fixture: ComponentFixture<CheckInBreadcrumbsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [CheckInBreadcrumbsComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckInBreadcrumbsComponent);
    component = fixture.componentInstance;
    component.appUrl = 'http://app/url';
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });
});
