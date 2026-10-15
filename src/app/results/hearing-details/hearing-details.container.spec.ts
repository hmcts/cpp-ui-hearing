import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { OrganisationUnit } from '@cpp/reference-data';
import { provideMockStore } from '@ngrx/store/testing';
import {
  getAvailableFutureHearingsWithOffenceSelected,
  getHasSameJurisdiction,
  isCurrentHearingStandaloneBoxworkApplication
} from '../../core';
import { JurisdictionTypes } from '../../hearing-events-log/core/models/jurisdiction-types';
import { HearingDetailsContainer } from './hearing-details.container';

describe('HearingDetailsContainer', () => {
  const courtCentre = { id: 'COURT001', oucodeL3Name: 'Courthouse A' } as OrganisationUnit;

  let router: Router;
  let route: ActivatedRoute;

  function createContainer(
    jurisdictionType: JurisdictionTypes,
    isStandaloneBoxworkApplication: boolean
  ): HearingDetailsContainer {
    TestBed.configureTestingModule({
      imports: [HearingDetailsContainer],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: { referenceData: { organisationUnits: [courtCentre] } },
          selectors: [
            {
              selector: isCurrentHearingStandaloneBoxworkApplication,
              value: isStandaloneBoxworkApplication
            },
            { selector: getAvailableFutureHearingsWithOffenceSelected, value: [] },
            { selector: getHasSameJurisdiction, value: true }
          ]
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { jurisdictionType },
              queryParams: {},
              params: { hearingId: 'HEARINGID1' }
            },
            firstChild: null
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    TestBed.overrideTemplate(HearingDetailsContainer, '');

    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    return TestBed.createComponent(HearingDetailsContainer).componentInstance;
  }

  describe('magistrates', () => {
    it('navigates to related hearings after court selection when related hearings can be allocated', () => {
      const container = createContainer(JurisdictionTypes.MAGISTRATES, false);

      container.onCourtSelected(courtCentre);

      expect(router.navigate).toHaveBeenCalledWith(['related-hearings'], {
        relativeTo: route,
        queryParams: {
          courtId: 'COURT001',
          jurisdictionType: JurisdictionTypes.MAGISTRATES,
          weekCommencingType: undefined
        },
        queryParamsHandling: 'merge'
      });
      expect(container.currentStep()).toBe(container.availableHearingStep.HEARING_DETAILS);
    });

    it('navigates to find a hearing after court selection for a standalone box work application', () => {
      const container = createContainer(JurisdictionTypes.MAGISTRATES, true);

      container.onCourtSelected(courtCentre);

      expect(router.navigate).toHaveBeenCalledWith(['hearing-details'], {
        relativeTo: route,
        queryParams: {
          courtId: 'COURT001',
          jurisdictionType: JurisdictionTypes.MAGISTRATES,
          weekCommencingType: undefined
        },
        queryParamsHandling: 'merge'
      });
      expect(router.navigate).not.toHaveBeenCalledWith(['related-hearings'], expect.anything());
      expect(container.currentStep()).toBe(container.availableHearingStep.HEARING_DETAILS);
    });

    it('does not navigate when no court is selected', () => {
      const container = createContainer(JurisdictionTypes.MAGISTRATES, true);

      container.onCourtSelected(null);

      expect(router.navigate).not.toHaveBeenCalled();
      expect(container.currentStep()).toBe(container.availableHearingStep.COURT_SELECTION);
    });
  });

  describe('crown', () => {
    it('goes to week commencing after court selection', () => {
      const container = createContainer(JurisdictionTypes.CROWN, true);

      container.onCourtSelected(courtCentre);

      expect(router.navigate).not.toHaveBeenCalled();
      expect(container.currentStep()).toBe(container.availableHearingStep.WEEK_COMMENCING);
    });

    it('always navigates to related hearings, even for a standalone box work application', () => {
      const container = createContainer(JurisdictionTypes.CROWN, true);

      container.onCourtSelected(courtCentre);
      container.submitWeekCommencing({ dateType: 'FIXED' });

      expect(router.navigate).toHaveBeenCalledWith(['related-hearings'], {
        relativeTo: route,
        queryParams: {
          courtId: 'COURT001',
          jurisdictionType: JurisdictionTypes.CROWN,
          weekCommencingType: 'FIXED'
        },
        queryParamsHandling: 'merge'
      });
      expect(container.currentStep()).toBe(container.availableHearingStep.HEARING_DETAILS);
    });
  });
});
