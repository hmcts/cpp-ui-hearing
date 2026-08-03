import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';

import { AttendeesPanelComponent } from './attendees-panel.component';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { CourtApplication, Defendant, ProsecutionCounsel } from '../../core';
import {
  mockBulkDefendant,
  mockDefendants,
  mockProsecutionCasesSummary
} from '../../mock-data/test-mock-data';
import { ProsecutionCaseSummary } from '../../core/model/shared/prosecution-case-summary';
import { PageScrollService } from 'ngx-page-scroll-core';
import { ApplicationCounselsPanelComponent } from './application-counsels-panel/application-counsels-panel.component';
import { of } from 'rxjs';

describe('AttendeesPanelComponent', () => {
  let component: AttendeesPanelComponent;
  let fixture: ComponentFixture<AttendeesPanelComponent>;
  let translateService: TranslateService;
  let translateGetSpy: jest.SpyInstance;

  const mockScrollService = {
    scroll: jest.fn(),
    create: jest.fn().mockReturnValue({
      start: jest.fn()
    }),
    start: jest.fn()
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [AttendeesPanelComponent],
      teardown: { destroyAfterEach: false }
    });

    TestBed.overrideComponent(AttendeesPanelComponent, {
      remove: {
        providers: [PageScrollService]
      },
      add: {
        providers: [{ provide: PageScrollService, useValue: mockScrollService }]
      }
    });

    TestBed.overrideComponent(ApplicationCounselsPanelComponent, {
      remove: {
        providers: [PageScrollService]
      },
      add: {
        providers: [{ provide: PageScrollService, useValue: mockScrollService }]
      }
    });

    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendeesPanelComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    translateGetSpy = jest.spyOn(translateService, 'get').mockReturnValue(of('Hearing list'));
    component.urns = ['test-urn'];
    component.courtApplications = [
      {
        respondents: [{}],
        type: {
          applicantAppellantFlag: false
        },
        applicant: {
          id: 'test-applicant-id'
        }
      } as CourtApplication
    ];
    component.defendantsCurrentHearing = mockDefendants as Defendant[];
    component.prosecutionCasesSummary = mockProsecutionCasesSummary as ProsecutionCaseSummary[];
    component.prosecutionCounsels = [];
    component.defenceCounsels = [];
    component.companyRepresentatives = [];
    component.intermediariesCounsel = [];
    component.applicantCounsels = [];
    component.respondentCounsels = [];
    component.counselsCacheOptions = {} as any;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('should get attendees items', () => {
    it('for standalone applications with respondents', () => {
      const expectedAttendeesItem = ['APPLICANT', 'RESPONDENT', 'INTERPRETER / INTERMEDIARY'];
      component.isStandAloneApplication = true;
      fixture.detectChanges();

      expect(component.attendeesMenuItems).toEqual(expectedAttendeesItem);
    });

    it('for standalone applications without respondents', () => {
      const expectedAttendeesItem = ['APPLICANT', 'INTERPRETER / INTERMEDIARY'];
      component.isStandAloneApplication = true;
      component.courtApplications = [
        {
          respondents: [],
          type: {
            applicantAppellantFlag: false
          },
          applicant: {
            id: 'test-applicant-id'
          }
        } as CourtApplication
      ];
      fixture.detectChanges();
      expect(component.attendeesMenuItems).toEqual(expectedAttendeesItem);
    });

    it('if not standalone applications ', () => {
      const expectedAttendeesItem = [
        'PROSECUTION',
        'DEFENCE',
        'COMPANY REPRESENTATIVE',
        'INTERPRETER / INTERMEDIARY'
      ];
      component.isStandAloneApplication = false;

      fixture.detectChanges();

      expect(component.attendeesMenuItems).toEqual(expectedAttendeesItem);
    });

    it('for bulk defendants with removed defendants', () => {
      const expectedAttendeesItem = [
        'PROSECUTION',
        'DEFENCE',
        'COMPANY REPRESENTATIVE',
        'INTERPRETER / INTERMEDIARY'
      ];
      component.defendantsCurrentHearing = mockBulkDefendant as unknown as Defendant[];
      component.hearingHasBulkCaseOnly = false;
      fixture.detectChanges();

      expect(component.attendeesMenuItems).toEqual(expectedAttendeesItem);
    });

    it('for bulk defendants with no removed defendants', () => {
      const expectedAttendeesItem = ['PROSECUTION'];
      component.defendantsCurrentHearing = mockBulkDefendant as unknown as Defendant[];
      component.hearingHasBulkCaseOnly = true;
      fixture.detectChanges();

      expect(component.attendeesMenuItems).toEqual(expectedAttendeesItem);
    });
  });

  it('should have the expected template', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  describe('#selectAttendeeMenuItem', () => {
    it('should change the selected counsel type', () => {
      component.selectAttendeeMenuItem('DEFENCE');
      expect(component.selectedAttendeeItem).toBe('DEFENCE');
    });
  });

  describe('#getAttendeeMenuItemLabel', () => {
    describe('for active offences (proceedingsConcluded falsy)', () => {
      beforeEach(() => {
        component.proceedingsConcluded = false;
      });

      it('should keep the PROSECUTION label', () => {
        expect(component.getAttendeeMenuItemLabel(component.PROSECUTION)).toBe('PROSECUTION');
      });

      it('should keep the DEFENCE label', () => {
        expect(component.getAttendeeMenuItemLabel(component.DEFENCE)).toBe('DEFENCE');
      });
    });

    describe('for inactive offences (proceedingsConcluded true)', () => {
      beforeEach(() => {
        component.proceedingsConcluded = true;
      });

      it('should relabel PROSECUTION as APPLICANT', () => {
        expect(component.getAttendeeMenuItemLabel(component.PROSECUTION)).toBe(component.APPLICANT);
      });

      it('should relabel DEFENCE as RESPONDENT', () => {
        expect(component.getAttendeeMenuItemLabel(component.DEFENCE)).toBe(component.RESPONDENT);
      });

      it('should not relabel other menu items', () => {
        expect(component.getAttendeeMenuItemLabel(component.COMPANY_REPRESENTATIVE)).toBe(
          component.COMPANY_REPRESENTATIVE
        );
        expect(component.getAttendeeMenuItemLabel(component.INTERPRETER_INTERMEDIARY)).toBe(
          component.INTERPRETER_INTERMEDIARY
        );
      });
    });

    it('should return the applicant/appellant synonym for the APPLICANT menu item', () => {
      component.applicantAppellantSynonym = 'Appellant';
      expect(component.getAttendeeMenuItemLabel(component.APPLICANT)).toBe('Appellant');
    });
  });

  describe('#toggleUrns', () => {
    it('should change the showMoreUrns property', () => {
      component.showMoreUrns = true;
      component.toggleUrns();
      expect(component.showMoreUrns).toBeFalsy();
    });
  });

  describe('#updateProsecutionCounsel', () => {
    it('should emit the right event', fakeAsync(() => {
      const updatedProsecutionCounsel = {
        firstName: 'test',
        lastName: 'test',
        status: 'test'
      } as ProsecutionCounsel;
      jest.spyOn(component.onUpdateProsecutionCounsel, 'emit');
      component.updateProsecutionCounsel({ pc: updatedProsecutionCounsel });
      tick();
      expect(component.onUpdateProsecutionCounsel.emit).toHaveBeenCalledWith({
        pc: updatedProsecutionCounsel
      });
    }));
  });

  describe('#applicantAppellantSynonym and #applicantAppellantTitle', () => {
    it('should set `applicantAppellantTitle` to the title translation and `applicantAppellantSynonym` to the upcase translation when `applicantAppellantFlag` is true', () => {
      const titleKey = 'ENTER_COUNSELS.APPELLANT';
      const upcaseKey = 'ENTER_COUNSELS.APPELLANT_UPCASE';
      translateGetSpy.mockClear();
      translateGetSpy.mockReturnValue(of({ [titleKey]: 'Appellant', [upcaseKey]: 'APPELLANT' }));
      component.courtApplications = [
        {
          respondents: [{}],
          type: {
            applicantAppellantFlag: true
          }
        } as CourtApplication
      ];
      component.ngOnInit();

      expect(component.applicantAppellantTitle).toEqual('Appellant');
      expect(component.applicantAppellantSynonym).toEqual('APPELLANT');
      expect(translateGetSpy).toHaveBeenCalledWith([titleKey, upcaseKey]);
    });

    it('should set `applicantAppellantTitle` to the title translation and `applicantAppellantSynonym` to the upcase translation when `applicantAppellantFlag` is false', () => {
      const titleKey = 'ENTER_COUNSELS.APPLICANT';
      const upcaseKey = 'ENTER_COUNSELS.APPLICANT_UPCASE';
      translateGetSpy.mockClear();
      translateGetSpy.mockReturnValue(of({ [titleKey]: 'Applicant', [upcaseKey]: 'APPLICANT' }));
      component.courtApplications = [
        {
          respondents: [{}],
          type: {
            applicantAppellantFlag: false
          }
        } as CourtApplication
      ];
      component.ngOnInit();

      expect(component.applicantAppellantTitle).toEqual('Applicant');
      expect(component.applicantAppellantSynonym).toEqual('APPLICANT');
      expect(translateGetSpy).toHaveBeenCalledWith([titleKey, upcaseKey]);
    });
  });
});
