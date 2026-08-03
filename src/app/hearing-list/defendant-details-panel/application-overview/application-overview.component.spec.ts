import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ApplicationOverviewComponent } from './application-overview.component';
import { Component, EventEmitter } from '@angular/core';
import { CourtApplication } from '../../../core';
import { cloneDeep } from 'lodash-es';

const applicationMock = {
  type: {
    type: 'ApplicationType',
    applicantAppellantFlag: false,
    legislation: 'ApplicationLegislation'
  },
  courtApplicationCases: [
    {
      prosecutionCaseReference: 'URN',
      offences: [
        {
          count: 0,
          id: 'mock-id',
          offenceTitle: 'mock-offence-title',
          wording: 'mock-wording'
        }
      ]
    }
  ],
  applicationReceivedDate: new Date('2019-01-07')
};

let courtApplication: CourtApplication;

describe('ApplicationOverviewComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(waitForAsync(() => {
    courtApplication = applicationMock as any;
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should show `HEARING_LIST.APPLICANT` label when `showAppellant` is false', () => {
    courtApplication = cloneDeep(applicationMock) as any;
    courtApplication.type.applicantAppellantFlag = false;
    component.applicationMock = courtApplication;
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should show `HEARING_LIST.APPELANT` label when `showAppellant` is true', () => {
    courtApplication = cloneDeep(applicationMock) as any;
    courtApplication.type.applicantAppellantFlag = true;
    component.applicationMock = courtApplication;
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should fire an onViewApplication event', () => {
    const applicationCourt = {} as CourtApplication;
    jest.spyOn(component.onViewApplication, 'emit');
    component.viewApplication(applicationCourt);
    fixture.detectChanges();
    expect(component.onViewApplication.emit).toHaveBeenCalledTimes(1);
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <application-overview
      [applicationCourt]="applicationMock"
      (onViewApplication)="viewApplication($event)"
    >
    </application-overview>
  `,
  imports: [ApplicationOverviewComponent]
})
class TestHostComponent {
  applicationMock = courtApplication;

  onViewApplication: EventEmitter<CourtApplication> = new EventEmitter();
  viewApplication(applicationCourt: CourtApplication) {
    this.onViewApplication.emit(applicationCourt);
  }
}
