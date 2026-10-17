import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { OrganisationUnit } from '@cpp/reference-data';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  AvailableHearing,
  getAvailableFutureHearingsWithOffenceSelected,
  getHasSameJurisdiction,
  isCurrentHearingStandaloneBoxworkApplication,
  ResetAvailableHearingsAction
} from '../../core';
import { JurisdictionTypes } from '../../hearing-events-log/core/models/jurisdiction-types';
import { HearingSlotsBookingActions } from '../core/store';
import { ChangeOfJurisdictionComponent } from './change-of-jurisdiction/change-of-jurisdiction.component';
import { CourtSelectionComponent } from './court-selection/court-selection.component';
import { HearingDetailsTabsComponent } from './hearing-details-tabs.component';
import { HearingDetailsContainer } from './hearing-details.container';
import {
  FixedDateWeekCommencingComponent,
  HearingDateFormValues
} from './week-commencing/fixed-date-week-commencing.component';

@Component({
  selector: 'court-selection',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockCourtSelectionComponent {
  readonly jurisdictionType = input<string>();
  readonly backUrl = input<string | string[]>();
  readonly courtCentre = input<OrganisationUnit>();
  readonly continue = output<OrganisationUnit>();
  readonly errors = output<unknown>();
}

@Component({
  selector: 'fixed-date-week-commencing',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockFixedDateWeekCommencingComponent {
  readonly initialValues = input<HearingDateFormValues>();
  readonly submitData = output<HearingDateFormValues>();
  readonly goBack = output<void>();
}

@Component({
  selector: 'cpp-change-of-jurisdiction',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockChangeOfJurisdictionComponent {
  readonly hasSameJurisdiction = input<boolean>();
  readonly hearings = input<AvailableHearing[]>();
  readonly jurisdictionType = input<JurisdictionTypes>();
  readonly mapOrganisationUnits = input<Record<string, OrganisationUnit>>();
}

@Component({
  selector: 'cpp-hearing-details-tabs',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockHearingDetailsTabsComponent {
  readonly showRelatedHearingsTab = input<boolean>();
  readonly jurisdictionType = input<JurisdictionTypes>();
  readonly weekCommencingType = input<string>();
}

describe('HearingDetailsContainer', () => {
  const courtCentre = { id: 'COURT001', oucodeL3Name: 'Courthouse A' } as OrganisationUnit;

  let fixture: ComponentFixture<HearingDetailsContainer>;
  let router: Router;
  let route: ActivatedRoute;
  let store: MockStore;
  let routeStub: {
    snapshot: {
      data: { jurisdictionType?: JurisdictionTypes };
      queryParams: Record<string, string>;
      params: Record<string, string>;
    };
    firstChild: null;
  };

  const tabs = () =>
    fixture.debugElement.query(By.directive(MockHearingDetailsTabsComponent))
      .componentInstance as MockHearingDetailsTabsComponent;

  const expectNavigatedOnceTo = (
    childPath: string,
    jurisdictionType: JurisdictionTypes,
    weekCommencingType?: string
  ) => {
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([childPath], {
      relativeTo: route,
      queryParams: { courtId: 'COURT001', jurisdictionType, weekCommencingType },
      queryParamsHandling: 'merge'
    });
  };

  beforeEach(waitForAsync(() => {
    routeStub = {
      snapshot: { data: {}, queryParams: {}, params: { hearingId: 'HEARINGID1' } },
      firstChild: null
    };

    TestBed.configureTestingModule({
      imports: [HearingDetailsContainer],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: { referenceData: { organisationUnits: [courtCentre] } },
          selectors: [
            { selector: getAvailableFutureHearingsWithOffenceSelected, value: [] },
            { selector: getHasSameJurisdiction, value: true }
          ]
        }),
        { provide: ActivatedRoute, useValue: routeStub }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(HearingDetailsContainer, {
        remove: {
          imports: [
            CourtSelectionComponent,
            FixedDateWeekCommencingComponent,
            ChangeOfJurisdictionComponent,
            HearingDetailsTabsComponent
          ]
        },
        add: {
          imports: [
            MockCourtSelectionComponent,
            MockFixedDateWeekCommencingComponent,
            MockChangeOfJurisdictionComponent,
            MockHearingDetailsTabsComponent
          ]
        }
      })
      .compileComponents();

    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
    store = TestBed.inject(MockStore);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  }));

  function createContainer(
    jurisdictionType: JurisdictionTypes,
    isStandaloneBoxworkApplication: boolean
  ): HearingDetailsContainer {
    routeStub.snapshot.data = { jurisdictionType };
    store.overrideSelector(
      isCurrentHearingStandaloneBoxworkApplication,
      isStandaloneBoxworkApplication
    );

    fixture = TestBed.createComponent(HearingDetailsContainer);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  describe('when the page opens', () => {
    beforeEach(() => {
      jest.spyOn(store, 'dispatch');
      createContainer(JurisdictionTypes.MAGISTRATES, false);
    });

    it('should reset the available hearings', () => {
      expect(store.dispatch).toHaveBeenCalledWith(new ResetAvailableHearingsAction());
    });

    it('should clear errors from an earlier booking attempt', () => {
      expect(store.dispatch).toHaveBeenCalledWith(
        HearingSlotsBookingActions.removeHearingSlotsBookingError()
      );
    });
  });

  describe('magistrates', () => {
    it('navigates to related hearings after court selection when related hearings can be allocated', () => {
      const container = createContainer(JurisdictionTypes.MAGISTRATES, false);

      container.onCourtSelected(courtCentre);
      fixture.detectChanges();

      expectNavigatedOnceTo('related-hearings', JurisdictionTypes.MAGISTRATES);
      expect(container.currentStep()).toBe(container.availableHearingStep.HEARING_DETAILS);
      expect(tabs().showRelatedHearingsTab()).toBe(true);
    });

    it('navigates to find a hearing and hides the related hearings tab for a standalone box work application', () => {
      const container = createContainer(JurisdictionTypes.MAGISTRATES, true);

      container.onCourtSelected(courtCentre);
      fixture.detectChanges();

      expectNavigatedOnceTo('hearing-details', JurisdictionTypes.MAGISTRATES);
      expect(container.currentStep()).toBe(container.availableHearingStep.HEARING_DETAILS);
      expect(tabs().showRelatedHearingsTab()).toBe(false);
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

    it('always navigates to and shows related hearings, even for a standalone box work application', () => {
      const container = createContainer(JurisdictionTypes.CROWN, true);

      container.onCourtSelected(courtCentre);
      container.submitWeekCommencing({ dateType: 'FIXED' });
      fixture.detectChanges();

      expectNavigatedOnceTo('related-hearings', JurisdictionTypes.CROWN, 'FIXED');
      expect(container.currentStep()).toBe(container.availableHearingStep.HEARING_DETAILS);
      expect(tabs().showRelatedHearingsTab()).toBe(true);
    });
  });
});
