import { OverlayRef } from '@angular/cdk/overlay';
import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ModalService } from '@cpp/pdk';
import { getOrganisationUnits, HearingType, LinkType, OrganisationUnit } from '@cpp/reference-data';
import { getUserDetails } from '@cpp/users-groups';
import { Store, provideState, provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import {
  ApiError,
  clearStandaloneAncillaryResults,
  getCurrentHearingAmendedByUserId,
  getCurrentHearingState,
  HearingDetail,
  HearingLockState,
  HearingPersonDetails,
  HearingState,
  ListingService,
  reducers,
  WelshDefendantTranslate
} from '../../../core';
import { getTargetsForHearing } from '../../core/helpers';
import {
  getDraftResult,
  ResultsState,
  ShareResultsActions,
  resultsReducer
} from '../../core/store';
import { createDraftResultPromptsForShortcode, DraftResultBuilder } from '../../core/testing';
import { DraftResult } from '../../results.interfaces';
import { ShareResultContainerComponent } from '../share-result.container';
import { ShareResultActionBarComponent } from '../share-result-action-bar.component';
import { provideCppCoreHttpServices } from '@cpp/core';

jest.mock('@cpp/users-groups', () => ({
  ...(jest.requireActual('@cpp/users-groups') as any),
  getUserDetails: jest.fn()
}));

jest.mock('@cpp/reference-data', () => ({
  ...(jest.requireActual('@cpp/reference-data') as any),
  getOrganisationUnits: jest.fn()
}));

jest.mock('../../../core', () => ({
  ...(jest.requireActual('../../../core') as any),
  getCurrentHearingAmendedByUserId: jest.fn(),
  getCurrentHearingState: jest.fn()
}));

jest.mock('../../core/helpers', () => ({
  ...(jest.requireActual('../../core/helpers') as any),
  getTargetsForHearing: jest.fn()
}));

jest.mock('../../core/store', () => ({
  ...(jest.requireActual('../../core/store') as any),
  getDraftResult: jest.fn()
}));

const pendingAttendanceDefendantsMock: HearingPersonDetails[] = [
  {
    firstName: 'Eliza',
    lastName: 'Rowe',
    defendantId: '8970136c-0caa-4106-b1ae-81f24d169eb2',
    offences: [],
    masterDefendantId: '8970136c-0caa-4106-b1ae-81f24d169eb2'
  },
  {
    firstName: 'Estelle',
    lastName: 'Schimmel',
    defendantId: '2ade19df-018f-4996-94a0-5a0ace2893b2',
    offences: [],
    masterDefendantId: '2ade19df-018f-4996-94a0-5a0ace2893b2'
  }
];

const isApplicationJourneyMock: any[] = [
  {
    applications: [
      {
        type: {
          linkType: LinkType.LINKED
        }
      }
    ]
  }
];

// Mock hearing types for trial effectiveness tests
const mockHearingTypes: HearingType[] = [
  {
    id: 'trial-id-1',
    seqId: 1,
    hearingCode: 'TRL',
    hearingDescription: 'Trial',
    welshHearingDescription: 'Treial',
    defaultDurationMin: 60,
    trialTypeFlag: true,
    magistratesFlag: true,
    crownFlag: false,
    strategicFlag: false,
    tacticalFlag: false,
    validFrom: null,
    validTo: null
  },
  {
    id: 'non-trial-id-1',
    seqId: 2,
    hearingCode: 'PLE',
    hearingDescription: 'Plea',
    welshHearingDescription: 'Pled',
    defaultDurationMin: 30,
    trialTypeFlag: false,
    magistratesFlag: true,
    crownFlag: false,
    strategicFlag: false,
    tacticalFlag: false,
    validFrom: null,
    validTo: null
  },
  {
    id: 'non-trial-id-2',
    seqId: 3,
    hearingCode: 'SEN',
    hearingDescription: 'Sentence',
    welshHearingDescription: 'Dedfryd',
    defaultDurationMin: 45,
    trialTypeFlag: false,
    magistratesFlag: true,
    crownFlag: false,
    strategicFlag: false,
    tacticalFlag: false,
    validFrom: null,
    validTo: null
  }
];

// Mock hearing with trial effectiveness selected
const mockTrialHearingWithEffectiveness: HearingDetail = {
  id: 'hearingId',
  type: { id: 'trial-id-1', description: 'Trial' },
  isEffectiveTrial: true,
  prosecutionCases: [
    {
      defendants: [
        {
          id: 'defendant-id',
          personDefendant: { personDetails: { firstName: '' } }
        }
      ]
    }
  ],
  courtCentre: { id: 'court-centre-id' }
} as HearingDetail;

// Mock hearing with trial effectiveness not selected
const mockTrialHearingWithoutEffectiveness: HearingDetail = {
  id: 'hearingId',
  type: { id: 'trial-id-1', description: 'Trial' },
  isEffectiveTrial: null,
  isVacatedTrial: null,
  crackedIneffectiveTrial: null,
  prosecutionCases: [
    {
      defendants: [
        {
          id: 'defendant-id',
          personDefendant: { personDetails: { firstName: '' } }
        }
      ]
    }
  ],
  courtCentre: { id: 'court-centre-id' }
} as HearingDetail;

// Mock non-trial hearing
const mockNonTrialHearing: HearingDetail = {
  id: 'hearingId',
  type: { id: 'non-trial-id-1', description: 'Plea' },
  prosecutionCases: [
    {
      defendants: [
        {
          id: 'defendant-id',
          personDefendant: { personDetails: { firstName: '' } }
        }
      ]
    }
  ],
  courtCentre: { id: 'court-centre-id' }
} as HearingDetail;

describe('ShareResultContainerComponent', () => {
  let draftResultBuilder: DraftResultBuilder;
  let overlayRef: OverlayRef;
  let store: Store<ResultsState>;
  let mockModalService: { open: jest.Mock };

  beforeEach(() => {
    overlayRef = { dispose: jest.fn() } as unknown as OverlayRef;

    mockModalService = {
      open: jest.fn(() => {
        return overlayRef;
      })
    };

    TestBed.configureTestingModule({
      imports: [ShareResultContainerComponent],
      providers: [
        provideCppCoreHttpServices(),
        provideStore(reducers, {
          runtimeChecks: {},
          initialState: {
            hearings: {
              current: {
                hearing: {
                  id: 'hearingId',
                  prosecutionCases: [
                    {
                      defendants: [
                        {
                          id: 'defendant-id',
                          personDefendant: { personDetails: { firstName: '' } }
                        }
                      ]
                    }
                  ],
                  courtCentre: { id: 'court-centre-id' }
                }
              }
            } as HearingState,
            referenceData: {
              hearingTypes: mockHearingTypes
            },
            usersGroups: {
              permissionsMap: {},
              userServices: [
                {
                  name: 'test',
                  containsSearch: false,
                  features: [{ key: 'CitSubreason', title: 'CitSubreason', type: 'COMPONENT' }]
                }
              ]
            }
          }
        }),
        provideState('results', resultsReducer),
        provideRouter([])
      ],
      teardown: { destroyAfterEach: false }
    });

    TestBed.overrideComponent(ShareResultContainerComponent, {
      remove: {
        providers: [ModalService]
      },
      add: {
        providers: [{ provide: ModalService, useValue: mockModalService }]
      }
    });

    TestBed.overrideComponent(ShareResultActionBarComponent, {
      remove: {
        providers: [ModalService]
      },
      add: {
        providers: [{ provide: ModalService, useValue: mockModalService }]
      }
    });

    draftResultBuilder = new DraftResultBuilder();
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  });

  const createFixture = ({
    amendedByUserId,
    currentUserId,
    draftResult,
    hearingState,
    organisationUnits = [{ id: 'court-centre-id' } as OrganisationUnit],
    targetIdsForHearing = ['applicationId'],
    hearing = null,
    hearingTypes = mockHearingTypes,
    pendingAttendanceDefendants = [],
    isApplicationJourney = [],
    amendApplicationPermission = false,
    caseStatus = ''
  }: {
    amendedByUserId: string;
    currentUserId: string;
    draftResult: DraftResult;
    hearingState: HearingLockState;
    organisationUnits?: OrganisationUnit[];
    targetIdsForHearing?: string[];
    hearing?: HearingDetail | null;
    hearingTypes?: HearingType[];
    pendingAttendanceDefendants?: HearingPersonDetails[];
    isApplicationJourney?: any[];
    amendApplicationPermission?: boolean;
    caseStatus?: string;
  }) => {
    (getCurrentHearingAmendedByUserId as jest.Mock).mockImplementation(() => amendedByUserId);
    (getCurrentHearingState as jest.Mock).mockImplementation(() => hearingState);
    (getDraftResult as jest.Mock).mockImplementation(() => draftResult);
    (getUserDetails as jest.Mock).mockImplementation(() => ({ userId: currentUserId }));
    (getOrganisationUnits as jest.Mock).mockImplementation(() => organisationUnits);
    (getTargetsForHearing as jest.Mock).mockImplementation(() =>
      targetIdsForHearing.map(id => ({ id }))
    );

    const fixture = TestBed.createComponent(ShareResultContainerComponent);
    const component = fixture.componentInstance;
    (component as any).pendingAttendanceDefendants = () => pendingAttendanceDefendants;
    (component as any).isApplicationJourney = () => isApplicationJourney;
    (component as any).amendApplicationPermission = () => amendApplicationPermission;
    (component as any).caseStatus = () => caseStatus;

    if (hearing) {
      (component as any).hearing$ = of(hearing);
    }
    (component as any).hearingTypes$ = of(hearingTypes);

    fixture.detectChanges();

    return fixture;
  };

  describe('when the hearing has no shared results', () => {
    it('should render empty when the draft result is invalid', async () => {
      // no completed result prompts
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'NCOSTS'
      });

      const fixture = createFixture({
        amendedByUserId: 'userId1',
        currentUserId: 'userId1',
        hearingState: HearingLockState.INITIALISED,
        draftResult: draftResultBuilder.draftResult
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render the share button when the draft result is valid', async () => {
      // completed results
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'NCOSTS'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
      });

      const fixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.INITIALISED
      });

      expect(fixture).toMatchSnapshot();

      await fixture.debugElement.query(By.css('button')).nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    });

    it('should render empty when the draft result is valid but has no result lines', () => {
      const fixture = createFixture({
        amendedByUserId: 'userId1',
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.INITIALISED
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should not share the results when there are defendants with the attendance pending', async () => {
      // completed results
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'NCOSTS'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
      });

      const validationResultSpy = jest.fn();

      const fixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.INITIALISED,
        pendingAttendanceDefendants: pendingAttendanceDefendantsMock,
        isApplicationJourney: isApplicationJourneyMock
      });

      fixture.componentInstance.sharedResultsValidation.subscribe(validationResultSpy);
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();

      await fixture.debugElement.query(By.css('button')).nativeElement.click();

      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      expect(validationResultSpy).toHaveBeenCalledWith({
        hasAttendanceError: true,
        hasTrialEffectivenessError: false,
        pendingAttendanceDefendants: pendingAttendanceDefendantsMock
      });
    });
  });

  describe('when the hearing has shared results', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'AD'
      });
    });

    it('should render empty when there are no dirty result lines', async () => {
      // shared result belonging to this hearing day
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-02');

      const fixture = createFixture({
        amendedByUserId: 'userId1',
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.SHARED
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render the shared button when there are dirty result lines', async () => {
      // unshared result belonging to this hearing day (shared state is caused by a different hearing day)
      const fixture = createFixture({
        amendedByUserId: 'userId1',
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.SHARED
      });

      expect(fixture).toMatchSnapshot();
    });
  });

  describe('when a shared result has been amended', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'NCOSTS'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
      });
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({
        id: '*',
        reasonDescription: '*'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: []
      });
    });

    describe('admin error', () => {
      it('should render empty to the user who did not commence the amendments', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId2',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
        });

        expect(fixture).toMatchSnapshot();
      });

      it('should always display a cancel option to the amending user', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId1',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
        });

        expect(fixture).toMatchSnapshot();
      });

      it('should display a request approval option to the amending user for a valid draft result (admin error amendment)', async () => {
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
        });

        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId1',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
        });

        expect(fixture).toMatchSnapshot();

        fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
        expect(store.dispatch).toHaveBeenCalledWith(
          ShareResultsActions.requestApprovalForAmendments()
        );
      });

      it('should clear the ancillairy errors when cancelling amendments', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId1',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
        });

        fixture.componentInstance.handleCancelAmendments();

        fixture.detectChanges();

        expect(store.dispatch).toHaveBeenCalledWith(clearStandaloneAncillaryResults());
      });
    });

    describe('user error', () => {
      it('should display no options to the user who did not commence the amendments', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId2',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
        });

        expect(fixture).toMatchSnapshot();
      });

      it('should always display a cancel option to the amending user', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId1',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
        });

        expect(fixture).toMatchSnapshot();

        fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
        expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.cancelAmendments());
      });

      it('should display a request approval option to the amending user for a valid draft result (user error amendment)', async () => {
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
        });

        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId1',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
        });

        expect(fixture).toMatchSnapshot();

        await fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
        expect(store.dispatch).toHaveBeenCalledWith(
          ShareResultsActions.requestApprovalForAmendments()
        );
      });
    });

    describe('requested for approval', () => {
      beforeEach(async () => {
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
        });
      });

      it('should display no options to the user who requested the approval', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId1',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.APPROVAL_REQUESTED
        });

        expect(fixture).toMatchSnapshot();
      });

      it('should display adjudication buttons to a different user', () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId2',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.APPROVAL_REQUESTED
        });

        expect(fixture).toMatchSnapshot();

        fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
        expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.approveAmendments());
      });

      it('should display validation buttons to a different user', async () => {
        const fixture = createFixture({
          amendedByUserId: 'userId1',
          currentUserId: 'userId2',
          draftResult: draftResultBuilder.draftResult,
          hearingState: HearingLockState.VALIDATED
        });

        expect(fixture).toMatchSnapshot();

        await fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
        expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });
    });
  });

  describe('when a hearing has incomplete targets upon sharing', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'AD'
      });
    });

    const getConfirmationActions = (): { onSubmit: () => void; onCancel: () => void } => {
      return mockModalService.open.mock.calls[0][1].data;
    };

    it('should confirm sharing via a confirmation modal', async () => {
      const fixture = createFixture({
        amendedByUserId: 'userId1',
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.SHARED,
        targetIdsForHearing: ['applicationId', 'applicationId2']
      });

      fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());

      const { onSubmit } = getConfirmationActions();

      onSubmit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    });

    it('should cancel sharing via a confirmation modal', fakeAsync(() => {
      const fixture = createFixture({
        amendedByUserId: 'userId1',
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.SHARED,
        targetIdsForHearing: ['applicationId', 'applicationId2']
      });

      fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());

      const { onCancel } = getConfirmationActions();

      onCancel();

      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    }));
  });

  describe('when a hearing is in Welsh court and check for Welsh translate', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'AD'
      });
    });

    const getWelshTranslateActions = (): {
      onSubmit: (data: WelshDefendantTranslate[]) => void;
      onCancel: () => void;
    } => {
      return mockModalService.open.mock.calls[0][1].data;
    };

    it('should select yes and choose defendants from modal', async () => {
      const fixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        organisationUnits: [{ id: 'court-centre-id', isWelsh: 'true' } as OrganisationUnit],
        hearingState: HearingLockState.INITIALISED
      });

      fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());

      const { onSubmit } = getWelshTranslateActions();
      const payload: WelshDefendantTranslate[] = [
        { welshTranslation: true, defendantId: 'defendant-id-1' }
      ];

      onSubmit(payload);
      await fixture.whenStable();

      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(
        ShareResultsActions.shareDraftResultWithWelshTranslate({ payload })
      );
    });

    it('should select no and proceed to share results', async () => {
      const fixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        organisationUnits: [{ id: 'court-centre-id', isWelsh: 'true' } as OrganisationUnit],
        hearingState: HearingLockState.INITIALISED
      });

      fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());

      const { onSubmit } = getWelshTranslateActions();
      const payload: WelshDefendantTranslate[] = [];

      onSubmit(payload);
      await fixture.whenStable();
      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(
        ShareResultsActions.shareDraftResultWithWelshTranslate({ payload })
      );
    });

    it('should cancel sharing via welsh translate modal', fakeAsync(() => {
      const fixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        organisationUnits: [{ id: 'court-centre-id', isWelsh: 'true' } as OrganisationUnit],
        hearingState: HearingLockState.INITIALISED
      });

      fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());

      const { onCancel } = getWelshTranslateActions();

      onCancel();
      flush();

      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalledWith(
        ShareResultsActions.shareDraftResultWithWelshTranslate({ payload: [] })
      );
    }));
  });

  describe('Trial Effectiveness Validation', () => {
    let component: ShareResultContainerComponent;
    let validationResultSpy: jest.Mock;

    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate: '2020-01-01',
        originalText: 'NCOSTS'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
      });
    });

    const setupFixture = (
      hearing: HearingDetail,
      pendingAttendance: HearingPersonDetails[] = []
    ) => {
      validationResultSpy = jest.fn();
      const testFixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult: draftResultBuilder.draftResult,
        hearingState: HearingLockState.INITIALISED,
        hearing: hearing,
        pendingAttendanceDefendants: pendingAttendance,
        isApplicationJourney: isApplicationJourneyMock
      });

      component = testFixture.componentInstance;
      component.citSubreasonEnabled$ = of(true);

      component.sharedResultsValidation.subscribe(validationResultSpy);
      testFixture.detectChanges();
      return testFixture;
    };

    describe('handleShareDraftResult', () => {
      it('should emit validationResult with hasTrialEffectivenessError=true when trial hearing has no effectiveness selected', () => {
        setupFixture(mockTrialHearingWithoutEffectiveness, []);

        component.handleShareDraftResult();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: true,
          pendingAttendanceDefendants: undefined
        });
        expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should emit validationResult with hasTrialEffectivenessError=false when trial hearing has effectiveness selected', () => {
        setupFixture(mockTrialHearingWithEffectiveness, []);

        component.handleShareDraftResult();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: undefined
        });
        expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should emit validationResult with hasTrialEffectivenessError=false for non-trial hearing', () => {
        setupFixture(mockNonTrialHearing, []);

        component.handleShareDraftResult();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: undefined
        });
        expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should emit validationResult with hasAttendanceError=true when attendance errors exist', () => {
        setupFixture(mockTrialHearingWithEffectiveness, pendingAttendanceDefendantsMock);

        component.handleShareDraftResult();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: true,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: pendingAttendanceDefendantsMock
        });
        expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should emit validationResult with both errors when both attendance and trial effectiveness errors exist', () => {
        setupFixture(mockTrialHearingWithoutEffectiveness, pendingAttendanceDefendantsMock);

        component.handleShareDraftResult();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: true,
          hasTrialEffectivenessError: true,
          pendingAttendanceDefendants: pendingAttendanceDefendantsMock
        });
        expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });
    });

    describe('handleShareDraftResultWithWelshTranslate', () => {
      beforeEach(() => {
        mockModalService.open.mockClear();
      });

      it('should emit validationResult and not open modal when trial hearing has no effectiveness selected', () => {
        setupFixture(mockTrialHearingWithoutEffectiveness, []);

        component.handleShareDraftResultWithWelshTranslate();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: true,
          pendingAttendanceDefendants: undefined
        });
        expect(mockModalService.open).not.toHaveBeenCalled();
      });

      it('should emit validationResult and open Welsh translate modal when trial hearing has effectiveness selected', () => {
        setupFixture(mockTrialHearingWithEffectiveness, []);

        component.handleShareDraftResultWithWelshTranslate();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: undefined
        });
        expect(mockModalService.open).toHaveBeenCalled();
      });

      it('should emit validationResult and open Welsh translate modal for non-trial hearing', () => {
        setupFixture(mockNonTrialHearing, []);

        component.handleShareDraftResultWithWelshTranslate();

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: undefined
        });
        expect(mockModalService.open).toHaveBeenCalled();
      });
    });

    describe('validateAndShare', () => {
      beforeEach(() => {
        mockModalService.open.mockClear();
        validationResultSpy.mockClear();
      });

      it('should emit validation single object and NOT dispatch share when attendance errors exist', () => {
        setupFixture(mockTrialHearingWithEffectiveness, pendingAttendanceDefendantsMock);
        component['validateAndShare'](
          mockTrialHearingWithEffectiveness,
          mockHearingTypes,
          undefined,
          false,
          true
        );

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: true,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: pendingAttendanceDefendantsMock
        });
        expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should emit validation single object and NOT dispatch share when trial effectiveness errors exist', () => {
        setupFixture(mockTrialHearingWithoutEffectiveness, []);
        component['validateAndShare'](
          mockTrialHearingWithoutEffectiveness,
          mockHearingTypes,
          undefined,
          false,
          true
        );

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: true,
          pendingAttendanceDefendants: undefined
        });
        expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should dispatch shareDraftResult when there are no errors and withWelshTranslate is false', () => {
        setupFixture(mockTrialHearingWithEffectiveness, []);
        component['validateAndShare'](
          mockTrialHearingWithEffectiveness,
          mockHearingTypes,
          undefined,
          false,
          true
        );

        expect(validationResultSpy).toHaveBeenCalledWith({
          hasAttendanceError: false,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: undefined
        });
        expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      });

      it('should trigger sharing with Welsh translations when there are no errors and withWelshTranslate is true', () => {
        setupFixture(mockTrialHearingWithEffectiveness, []);
        const welshSpy = jest
          .spyOn<any, any>(component, 'shareWithWelshTranslation')
          .mockReturnValue(Promise.resolve());
        component['validateAndShare'](
          mockTrialHearingWithEffectiveness,
          mockHearingTypes,
          [],
          true,
          true
        );

        expect(welshSpy).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Private Methods - checkIfTrialApplication and checkTrialEffectiveness', () => {
    let component: ShareResultContainerComponent;
    let fixture: any;

    beforeEach(() => {
      fixture = TestBed.createComponent(ShareResultContainerComponent);
      component = fixture.componentInstance;
    });

    describe('checkIfTrialApplication', () => {
      it('should return true when hearing type has trialTypeFlag = true', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' }
        } as HearingDetail;
        const result = component['checkIfTrialApplication'](hearing, mockHearingTypes);
        expect(result).toBe(true);
      });

      it('should return false when hearing type has trialTypeFlag = false', () => {
        const hearing: HearingDetail = {
          type: { id: 'non-trial-id-1', description: 'Plea' }
        } as HearingDetail;
        const result = component['checkIfTrialApplication'](hearing, mockHearingTypes);
        expect(result).toBe(false);
      });

      it('should return false when hearing is null', () => {
        const result = component['checkIfTrialApplication'](null, mockHearingTypes);
        expect(result).toBe(false);
      });

      it('should return false when hearing has no type', () => {
        const hearing: HearingDetail = {} as HearingDetail;
        const result = component['checkIfTrialApplication'](hearing, mockHearingTypes);
        expect(result).toBe(false);
      });

      it('should return false when hearingTypes is null', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' }
        } as HearingDetail;
        const result = component['checkIfTrialApplication'](hearing, null);
        expect(result).toBe(false);
      });

      it('should return false when hearing type is not found', () => {
        const hearing: HearingDetail = {
          type: { id: 'unknown-id', description: 'Unknown' }
        } as HearingDetail;
        const result = component['checkIfTrialApplication'](hearing, mockHearingTypes);
        expect(result).toBe(false);
      });
    });

    describe('checkTrialEffectiveness', () => {
      beforeEach(() => {});

      it('should return true when hearing has isEffectiveTrial = true', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          isEffectiveTrial: true
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(true);
      });

      it('should return true when hearing has isEffectiveTrial = false', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          isEffectiveTrial: false
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(true);
      });

      it('should return true when hearing has isVacatedTrial = true', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          isVacatedTrial: true
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(true);
      });

      it('should return false when hearing has crackedIneffectiveTrial without subReasonId even if it has id', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          crackedIneffectiveTrial: { id: 'reason-id' }
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(false);
      });

      it('should return false when hearing has crackedIneffectiveTrial without subReasonId even if it has value', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          crackedIneffectiveTrial: { value: 'reason-value' }
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(false);
      });

      it('should return false when hearing has crackedIneffectiveTrial without subReasonId even if it has reasonShortDescription', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          crackedIneffectiveTrial: { reasonShortDescription: 'Reason description' }
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(false);
      });

      it('should return true when hearing has crackedIneffectiveTrial with subReasonId and at least one other field', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          crackedIneffectiveTrial: {
            id: 'reason-id',
            crackedIneffectiveSubReasonId: 'sub-reason-id'
          }
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(true);
      });

      it('should return false for trial hearing with no effectiveness fields', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' },
          isEffectiveTrial: null,
          isVacatedTrial: null,
          crackedIneffectiveTrial: null
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(false);
      });

      it('should return true for non-trial hearing even without effectiveness fields', () => {
        const hearing: HearingDetail = {
          type: { id: 'non-trial-id-1', description: 'Plea' }
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, mockHearingTypes, true);
        expect(result).toBe(true);
      });

      it('should return false when hearing is null', () => {
        const result = component['checkTrialEffectiveness'](null, mockHearingTypes, true);
        expect(result).toBe(false);
      });

      it('should return false when hearingTypes is null', () => {
        const hearing: HearingDetail = {
          type: { id: 'trial-id-1', description: 'Trial' }
        } as HearingDetail;
        const result = component['checkTrialEffectiveness'](hearing, null, true);
        expect(result).toBe(false);
      });
    });
  });

  describe('Crown session availability validation', () => {
    const crownHearing: HearingDetail = {
      id: 'hearingId',
      type: { id: 'non-trial-id-1', description: 'Plea' },
      jurisdictionType: 'CROWN',
      prosecutionCases: [
        {
          defendants: [
            {
              id: 'defendant-id',
              personDefendant: { personDetails: { firstName: '' } }
            }
          ]
        }
      ],
      courtCentre: { id: 'court-centre-id' }
    } as HearingDetail;

    const magistratesHearing = {
      ...crownHearing,
      jurisdictionType: 'MAGISTRATES'
    } as HearingDetail;

    const crownNextHearingLine = {
      resultLineId: 'line-1',
      shortCode: 'nhccs',
      resultPrompts: [
        {
          type: 'HIDDEN',
          promptId: 'booking-prompt-id',
          promptRef: 'bookingReference',
          label: 'Booking reference',
          value: 'court-schedule-1'
        },
        {
          type: 'DURATION',
          promptId: 'duration-prompt-id',
          promptRef: 'HEST',
          label: 'Estimated duration',
          value: [{ label: 'MINUTES', value: 30 }]
        }
      ]
    };

    const draftResultWithLines = (lines: Record<string, unknown>) =>
      ({
        hearingId: 'hearingId',
        hearingDay: '2026-06-01',
        relations: [],
        shadowListedOffenceIds: [],
        resultLines: lines
      } as unknown as DraftResult);

    const crownDraftResult = draftResultWithLines({ 'line-1': crownNextHearingLine });

    let component: ShareResultContainerComponent;
    let listingService: ListingService;
    let validationResultSpy: jest.Mock;

    const setup = (hearing: HearingDetail, draftResult: DraftResult) => {
      validationResultSpy = jest.fn();
      const fixture = createFixture({
        amendedByUserId: null,
        currentUserId: 'userId1',
        draftResult,
        hearingState: HearingLockState.INITIALISED,
        hearing
      });
      component = fixture.componentInstance;
      listingService = (component as any).listingService;
      component.sharedResultsValidation.subscribe(validationResultSpy);
      return fixture;
    };

    it('validates the booked session before sharing and shares when it is available', () => {
      setup(crownHearing, crownDraftResult);
      const validateSpy = jest
        .spyOn(listingService, 'validateSessionAvailability')
        .mockReturnValue(of({}));

      component.handleShareDraftResult();

      expect(validateSpy).toHaveBeenCalledWith('court-schedule-1', 30);
      expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    });

    it('blocks sharing and emits a session availability error when the session is no longer available', () => {
      setup(crownHearing, crownDraftResult);
      jest
        .spyOn(listingService, 'validateSessionAvailability')
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

      component.handleShareDraftResult();

      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      expect(validationResultSpy).toHaveBeenCalledWith({
        hasAttendanceError: false,
        hasTrialEffectivenessError: false,
        hasSessionAvailabilityError: true
      });
    });

    it('dispatches an ApiError and does not show the availability banner when validation fails technically', () => {
      setup(crownHearing, crownDraftResult);
      jest
        .spyOn(listingService, 'validateSessionAvailability')
        .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      component.handleShareDraftResult();

      expect(store.dispatch).toHaveBeenCalledWith(expect.any(ApiError));
      expect(store.dispatch).not.toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
      expect(validationResultSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ hasSessionAvailabilityError: true })
      );
    });

    it('validates a Crown next hearing even when the current hearing is magistrates (committal to Crown)', () => {
      setup(magistratesHearing, crownDraftResult);
      const validateSpy = jest
        .spyOn(listingService, 'validateSessionAvailability')
        .mockReturnValue(of({}));

      component.handleShareDraftResult();

      expect(validateSpy).toHaveBeenCalledWith('court-schedule-1', 30);
      expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    });

    it('does not validate when the booking is a magistrates next hearing (NHMC)', () => {
      const magistratesBooking = draftResultWithLines({
        'line-1': {
          resultLineId: 'line-1',
          shortCode: 'nhmc',
          resultPrompts: [
            {
              type: 'TXT',
              promptId: 'booking-prompt-id',
              promptRef: 'bookingReference',
              label: 'Booking reference',
              value: 'provisional-booking-id'
            }
          ]
        }
      });
      setup(crownHearing, magistratesBooking);
      const validateSpy = jest
        .spyOn(listingService, 'validateSessionAvailability')
        .mockReturnValue(of({}));

      component.handleShareDraftResult();

      expect(validateSpy).not.toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    });

    it('shares without validation when the Crown next hearing has no booked session', () => {
      const draftWithoutBooking = draftResultWithLines({
        'line-1': { resultLineId: 'line-1', shortCode: 'nhccs', resultPrompts: [] }
      });
      setup(crownHearing, draftWithoutBooking);
      const validateSpy = jest
        .spyOn(listingService, 'validateSessionAvailability')
        .mockReturnValue(of({}));

      component.handleShareDraftResult();

      expect(validateSpy).not.toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledWith(ShareResultsActions.shareDraftResult());
    });
  });
});
