import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Offence } from '../../../core/model';
import { TranslateMockPipe } from '../../../shared/pipes/mock-pipes/translate-mock.pipe';
import { AppConfigService } from '../../../config';
import { ReportingRestrictionsComponent } from './reporting-restrictions.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('Reporting Restrictions Component', () => {
  let fixture: ComponentFixture<TestReportingRestrictionsComponent>;
  let componentInstance: TestReportingRestrictionsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestReportingRestrictionsComponent],
      providers: [
        provideTranslateService(),
        {
          provide: AppConfigService,
          useValue: {
            appUrl: 'http://app/url'
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    fixture = TestBed.createComponent(TestReportingRestrictionsComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should render when no reporting restrictions are present', () => {
    componentInstance.offences = null;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
    componentInstance.offences = [];
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  describe('when reporting restrictions are present', () => {
    beforeEach(() => {
      componentInstance.offences = [
        {
          reportingRestrictions: [
            {
              id: 'rr'
            }
          ]
        } as Offence
      ];
      fixture.detectChanges();
    });

    it('should render correctly when no case id is provided', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should render correctly when case id is provided', () => {
      componentInstance.caseId = 'case123';
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });

    it('should render correctly in active mode', () => {
      componentInstance.isActive = true;
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });

    it('should render correctly in warning mode', () => {
      componentInstance.isWarning = true;
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });
  });

  describe('Component getters', () => {
    it('should return correct href when caseId is provided', () => {
      const component = fixture.debugElement.query(
        By.directive(ReportingRestrictionsComponent)
      ).componentInstance;
      component.caseId = 'case123';
      expect(component.href).toContain('case123');
      expect(component.href).toContain('hearings-and-decisions');
    });

    it('should return empty href when caseId is not provided', () => {
      const component = fixture.debugElement.query(
        By.directive(ReportingRestrictionsComponent)
      ).componentInstance;
      component.caseId = null;
      expect(component.href).toBe('');
    });
  });
});

@Component({
  selector: 'test-reporting-restrictions',
  template: `
    <reporting-restrictions
      [caseId]="caseId"
      [offences]="offences"
      [isActive]="isActive"
      [isWarning]="isWarning"
    >
    </reporting-restrictions>
  `,
  imports: [ReportingRestrictionsComponent, TranslateMockPipe]
})
class TestReportingRestrictionsComponent {
  caseId: string;
  isActive: boolean;
  isWarning: boolean;
  offences: Offence[];
}
