import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';

import { ApplicantCounsel, RespondentCounsel, CourtApplication } from '../../../core';
import { PageScrollService } from 'ngx-page-scroll-core';
import { ApplicationCounselsPanelComponent } from './application-counsels-panel.component';

jest.mock('uuid/v4', () => () => 'UUID');

describe('ApplicationCounselsPanelComponent', () => {
  let fixture: ComponentFixture<MockApplicationCounselsPanelComponent>;
  let pageScrollServiceSpy;
  let pageScrollInstanceSpy;
  let pageScrollServiceCreateSpy;

  beforeEach(async () => {
    pageScrollServiceSpy = jest.fn();
    pageScrollInstanceSpy = jest.fn();
    pageScrollServiceCreateSpy = jest.fn().mockReturnValue(pageScrollInstanceSpy);

    const mockScrollService = {
      start: pageScrollServiceSpy,
      create: pageScrollServiceCreateSpy
    };

    await TestBed.configureTestingModule({
      imports: [MockApplicationCounselsPanelComponent],
      providers: [provideTranslateService()]
    });

    TestBed.overrideComponent(ApplicationCounselsPanelComponent, {
      remove: {
        providers: [PageScrollService]
      },
      add: {
        providers: [{ provide: PageScrollService, useValue: mockScrollService }]
      }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(MockApplicationCounselsPanelComponent);
  });

  const addCounsel = () => {
    fixture.debugElement.query(By.css('[data-test-id="add-counsel"]')).nativeElement.click();
    fixture.detectChanges();
  };

  const removeCounselByIndex = (idx: number) => {
    const elements = fixture.debugElement.queryAll(
      By.css('[data-test-id="remove-application-counsel"]')
    );
    elements[idx].nativeElement.click();
    fixture.detectChanges();
  };

  const setCounselValuesByIndex = (
    idx: number,
    { firstName, lastName }: { firstName: string; lastName: string }
  ) => {
    const counsels = fixture.debugElement.queryAll(By.css('section'));
    const firstNameElem = counsels[idx].query(By.css('[name=firstName]')).nativeElement;
    const lastNameElem = counsels[idx].query(By.css('[name=lastName]')).nativeElement;

    firstNameElem.value = firstName;
    firstNameElem.dispatchEvent(new Event('input'));
    lastNameElem.value = lastName;
    lastNameElem.dispatchEvent(new Event('input'));
  };

  describe('when there are no existing applicants', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render correctly', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should emit the correct form state when the form is invalid', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.formState).toHaveBeenCalledWith({
        added: [],
        updated: [],
        valid: false
      });
    });

    // TODO check application coounsel is required
    it.skip('should perform validation across multiple counsels in the form', () => {
      addCounsel();
      setCounselValuesByIndex(0, { firstName: '*', lastName: '*' });
      expect(fixture.componentInstance.formState).toHaveBeenCalledWith({
        added: [
          {
            id: 'UUID',
            applicants: ['applicantId1', 'applicantId2'],
            attendanceDays: ['2019-05-01'],
            firstName: '*',
            lastName: '*',
            status: '',
            title: ''
          },
          {
            id: 'UUID',
            applicants: ['applicantId1', 'applicantId2'],
            attendanceDays: ['2019-05-01'],
            firstName: '',
            lastName: '',
            status: '',
            title: ''
          }
        ],
        updated: [],
        valid: false
      });
    });

    // TODO check application coounsel is required
    it.skip('should emit the correct form state when the form is valid', () => {
      fixture.componentInstance.counselType = 'applicant';
      fixture.detectChanges();
      setCounselValuesByIndex(0, { firstName: '*', lastName: '*' });

      expect(fixture.componentInstance.formState).toHaveBeenCalledWith({
        added: [
          {
            id: 'UUID',
            applicants: ['applicantId1', 'applicantId2'],
            attendanceDays: ['2019-05-01'],
            firstName: '*',
            lastName: '*',
            status: '',
            title: ''
          }
        ],
        updated: [],
        valid: true
      });
    });

    it('should handle adding and removing counsels', () => {
      addCounsel();
      expect(fixture.debugElement.queryAll(By.css('section'))).toHaveLength(2);
      removeCounselByIndex(1);
      expect(fixture.debugElement.queryAll(By.css('section'))).toHaveLength(1);
      expect(fixture.componentInstance.destroy).not.toHaveBeenCalled();
    });
  });

  describe.skip('when there are no existing respondents', () => {
    beforeEach(() => {
      fixture.componentInstance.counselType = 'respondent';
      fixture.detectChanges();
    });

    it('should emit the correct form state when the form is valid', () => {
      setCounselValuesByIndex(0, { firstName: '*', lastName: '*' });

      expect(fixture.componentInstance.formState).toHaveBeenCalledWith({
        added: [
          {
            id: 'UUID',
            attendanceDays: ['2019-05-01'],
            firstName: '*',
            lastName: '*',
            respondents: ['respondentId1', 'respondentId2', 'respondentId3'],
            status: '',
            title: ''
          }
        ],
        updated: [],
        valid: true
      });
    });
  });

  describe('when there are existing counsels', () => {
    beforeEach(() => {
      fixture.componentInstance.counsels = [
        {
          id: 'counselId1',
          applicants: ['applicantId1', 'applicantId2'],
          attendanceDays: ['2019-05-01'],
          firstName: 'James',
          lastName: 'Gray',
          status: '',
          title: ''
        },
        {
          id: 'counselId2',
          applicants: ['applicantId1', 'applicantId2'],
          attendanceDays: ['2019-05-01'],
          firstName: 'Gordon',
          lastName: 'Cumming',
          status: '',
          title: ''
        }
      ];
      fixture.detectChanges();
    });

    it('should render correctly', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should emit the correct form state when the counsels are unchanged', () => {
      expect(fixture.componentInstance.formState).toHaveBeenCalledWith({
        added: [],
        updated: [],
        valid: false
      });
    });

    it('should handle a counsel being updated', () => {
      setCounselValuesByIndex(0, { firstName: '*', lastName: '*' });
      expect(fixture.componentInstance.formState).toHaveBeenLastCalledWith({
        added: [],
        updated: [
          {
            id: 'counselId1',
            applicants: ['applicantId1', 'applicantId2'],
            attendanceDays: ['2019-05-01'],
            firstName: '*',
            lastName: '*',
            status: '',
            title: ''
          }
        ],
        valid: true
      });
    });

    it('should handle a counsel being removed', () => {
      removeCounselByIndex(0);
      expect(fixture.componentInstance.destroy).toHaveBeenCalledWith(
        fixture.componentInstance.counsels[0]
      );
    });

    it('should handle the only counsel being removed', () => {
      fixture.componentInstance.counsels = [
        {
          id: 'counselId1',
          applicants: ['applicantId1', 'applicantId2'],
          attendanceDays: ['2019-05-01'],
          firstName: 'James',
          lastName: 'Gray',
          status: '',
          title: ''
        }
      ];
      fixture.detectChanges();
      removeCounselByIndex(0);
      expect(fixture).toMatchSnapshot();
    });
  });
});

@Component({
  selector: 'application-counsels-panel-test',
  template: `
    <application-counsels-panel
      [applications]="applications"
      [attendanceDay]="attendanceDay"
      [counsels]="counsels"
      [counselType]="counselType"
      (destroyCounsel)="destroy($event)"
      (formState)="formState($event)"
    >
    </application-counsels-panel>
  `,
  imports: [ApplicationCounselsPanelComponent]
})
class MockApplicationCounselsPanelComponent {
  attendanceDay = '2019-05-01';
  counsels = [] as ApplicantCounsel[] | RespondentCounsel[];
  counselType = 'applicant';
  applications = [
    {
      applicant: {
        id: 'applicantId1'
      },
      respondents: [
        {
          personDetails: {
            firstName: 'respondentId1'
          }
        },
        {
          personDetails: {
            firstName: 'respondentId2'
          }
        }
      ],
      type: {
        id: 'type-id'
      }
    },
    {
      applicant: {
        id: 'applicantId2'
      },
      respondents: [
        {
          personDetails: {
            firstName: 'respondentId3'
          }
        }
      ]
    }
  ] as CourtApplication[];
  destroy = jest.fn();
  formState = jest.fn();
}
