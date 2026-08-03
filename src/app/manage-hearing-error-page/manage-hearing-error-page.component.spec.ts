import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ManageHearingErrorPageComponent } from './manage-hearing-error-page.component';
import {
  ManageHearingErrorType,
  ManageHearingPublicEventError
} from './manage-hearing-error-page.interfaces';
import { By } from '@angular/platform-browser';

import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

const mockManageHearingError: ManageHearingPublicEventError = {
  hearingId: 'hearingId',
  error: {
    type: ManageHearingErrorType.VERSION,
    code: '100',
    reason: 'Version mismatch'
  },
  info: {
    hearingDay: '2024-03-20',
    lastUpdatedByUserName: 'John Doe',
    userName: 'Current User',
    version: 1,
    lastUpdatedVersion: 2
  },
  _metadata: {
    id: 'id',
    name: 'hearing-error'
  }
};

describe('ManageHearingErrorPageComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      teardown: { destroyAfterEach: false },
      providers: [provideTranslateService(), provideRouter([])]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('navigation links', () => {
    beforeEach(() => {
      component.hearingId = 'hearingId';
      fixture.detectChanges();
    });

    it('should render the manage hearing link with correct route', () => {
      const manageLinkEl = fixture.debugElement
        .queryAll(By.css('a'))
        .find(de => de.nativeElement.textContent.trim() === 'manage hearing');
      expect(manageLinkEl).toBeTruthy();

      const href: string | null = manageLinkEl.nativeElement.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('/manage/hearingId');
    });

    it('should render the enter results link with correct route', () => {
      const enterResultsLinkEl = fixture.debugElement
        .queryAll(By.css('a'))
        .find(de => de.nativeElement.textContent.trim() === 'enter results');
      expect(enterResultsLinkEl).toBeTruthy();

      const href: string | null = enterResultsLinkEl.nativeElement.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('/manage/hearingId/enter-results');
    });
  });

  describe('error messages', () => {
    it('should display the default version mismatch message when error code is not 207', () => {
      component.manageHearingError = mockManageHearingError;
      fixture.detectChanges();

      const paragraph = fixture.debugElement.query(By.css('p[pdk-typography="body-large"]'));
      expect(paragraph.nativeElement.textContent).toContain(
        'MANAGE_HEARING_ERROR.YOU_CANNOT_PROCEED'
      );
    });

    it('should display the hearing already shared message when error code is 207', () => {
      component.manageHearingError = {
        ...mockManageHearingError,
        error: {
          type: ManageHearingErrorType.SHARED,
          code: '207',
          reason: 'Hearing already shared'
        }
      };
      fixture.detectChanges();

      const paragraph = fixture.debugElement.query(By.css('p[pdk-typography="body-large"]'));
      expect(paragraph.nativeElement.textContent).toContain(
        'MANAGE_HEARING_ERROR.HEARING_ALREADY_SHARED'
      );
    });

    it('should use ANOTHER_USER translation key when username is not available', () => {
      component.manageHearingError = {
        ...mockManageHearingError,
        info: {
          ...mockManageHearingError.info,
          lastUpdatedByUserName: undefined
        }
      };
      fixture.detectChanges();

      const paragraph = fixture.debugElement.query(By.css('p[pdk-typography="body-large"]'));
      expect(paragraph.nativeElement.textContent).toContain(
        'MANAGE_HEARING_ERROR.YOU_CANNOT_PROCEED'
      );
    });
  });
});

@Component({
  template: `
    <manage-hearing-error-page
      [hearingId]="hearingId"
      [manageHearingError]="manageHearingError"
    ></manage-hearing-error-page>
  `,
  imports: [ManageHearingErrorPageComponent]
})
class TestHostComponent {
  hearingId = 'hearingId';
  manageHearingError = mockManageHearingError;
}
