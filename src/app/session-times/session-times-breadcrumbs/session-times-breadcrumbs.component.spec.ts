import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SessionTimesBreadcrumbsComponent } from './session-times-breadcrumbs.component';

import { provideTranslateService } from '@ngx-translate/core';

describe('SessionTimesBreadcrumbsComponent', () => {
  let component: SessionTimesBreadcrumbsComponent;
  let fixture: ComponentFixture<SessionTimesBreadcrumbsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [SessionTimesBreadcrumbsComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionTimesBreadcrumbsComponent);
    component = fixture.componentInstance;
    component.appUrl = 'http://app/url';
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });
});
