import { provideStore, provideState } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { getUserDetails } from '@cpp/users-groups';
import {
  getCurrentHearingAmendedByUserId,
  getCurrentHearingState,
  HearingLockState,
  HearingState,
  reducers
} from '../../../core';
import { resultsReducer } from '../../core/store';
import {
  ChildResultDefinition,
  DraftResult,
  ExtendedResolvedDraftResultLine
} from '../../results.interfaces';
import { ShareableResultsContainerComponent } from '../shareable-results.container';
import draftResult from './fixtures/draft-result.v1.json';

const resultLinesArrayForTrue: ExtendedResolvedDraftResultLine[] = [
  {
    label: 'Victim Surcharge Applies?',
    valid: true,
    caseId: 'dcf4ecf0-970f-46be-97e3-2f32e387339e',
    offenceId: 'beaa105a-0268-4a77-925a-1eb90c574f36',
    shortCode: 'vsa',
    defendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    orderedDate: '2024-02-13',
    resultLevel: 'D',
    unscheduled: false,
    originalText: 'vsa',
    resultLineId: 'c289373b-a11e-4e2c-a8fd-56e5f1d47ffe',
    resultPrompts: [],
    unresolvedParts: [],
    masterDefendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    resultDefinitionId: '386a3a47-b2cb-4017-9dd8-19ffeb457b56',
    conditionalMandatory: true,
    promptChoices: [],
    excludedFromResults: false,
    childResultDefinitions: [
      {
        code: 'e866cd11-6073-4fdf-a229-51c9d694e1d0',
        shortCode: 'fvs',
        label: 'Surcharge',
        ruleType: 'mandatory',
        excludedFromResults: false,
        childResultCodes: [
          '615313b5-0647-4d61-b7b8-6b36265d8929',
          '4fdd9548-c521-48c9-baa3-1bd2f13a4fcc',
          'bdb32555-8d55-4dc1-b4b6-580db5132496',
          'f7dfefd2-64c6-11e8-adc0-fa7ae01bbebc',
          '923f8b82-d4b5-4c9b-8b54-6d1ec8e16dd6',
          'cfa66730-f81c-4768-a36e-581791cb0270'
        ]
      },
      {
        code: '204fc6b8-d6c9-4fb8-acd0-47d23c087625',
        shortCode: 'novs',
        label: 'No surcharge',
        ruleType: 'mandatory',
        excludedFromResults: false,
        childOfTrueResponse: false
      }
    ]
  },
  {
    label: 'Surcharge',
    valid: true,
    caseId: 'dcf4ecf0-970f-46be-97e3-2f32e387339e',
    offenceId: 'beaa105a-0268-4a77-925a-1eb90c574f36',
    shortCode: 'fvs',
    defendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    orderedDate: '2024-02-13',
    resultLevel: 'D',
    unscheduled: false,
    originalText: 'fvs',
    resultLineId: '0b952e90-e680-4186-ad08-ddf8c42bf25f',
    excludedFromResults: false,
    resultPrompts: [
      {
        type: 'CURR',
        label: 'Amount of surcharge',
        value: 1234,
        promptId: '629a971e-9d7a-4526-838d-0a4cb922b5cb',
        promptRef: 'AOS'
      }
    ],
    unresolvedParts: [],
    masterDefendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    resultDefinitionId: 'e866cd11-6073-4fdf-a229-51c9d694e1d0',
    conditionalMandatory: false,
    promptChoices: [],
    childResultDefinitions: [
      {
        code: '615313b5-0647-4d61-b7b8-6b36265d8929',
        shortCode: 'nocollo',
        label: 'No collection order reason',
        ruleType: 'optional',
        excludedFromResults: false
      }
    ]
  }
];

const resultLinesArrayForFalse: ExtendedResolvedDraftResultLine[] = [
  {
    label: 'Victim Surcharge Applies?',
    valid: true,
    caseId: 'dcf4ecf0-970f-46be-97e3-2f32e387339e',
    offenceId: 'beaa105a-0268-4a77-925a-1eb90c574f36',
    shortCode: 'vsa',
    defendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    orderedDate: '2024-02-13',
    resultLevel: 'D',
    unscheduled: false,
    originalText: 'vsa',
    resultLineId: 'c289373b-a11e-4e2c-a8fd-56e5f1d47ffe',
    resultPrompts: [],
    unresolvedParts: [],
    masterDefendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    resultDefinitionId: '386a3a47-b2cb-4017-9dd8-19ffeb457b56',
    conditionalMandatory: true,
    promptChoices: [],
    excludedFromResults: false,
    childResultDefinitions: [
      {
        code: 'e866cd11-6073-4fdf-a229-51c9d694e1d0',
        shortCode: 'fvs',
        label: 'Surcharge',
        ruleType: 'mandatory',
        excludedFromResults: false,
        childResultCodes: [
          '615313b5-0647-4d61-b7b8-6b36265d8929',
          '4fdd9548-c521-48c9-baa3-1bd2f13a4fcc',
          'bdb32555-8d55-4dc1-b4b6-580db5132496',
          'f7dfefd2-64c6-11e8-adc0-fa7ae01bbebc',
          '923f8b82-d4b5-4c9b-8b54-6d1ec8e16dd6',
          'cfa66730-f81c-4768-a36e-581791cb0270'
        ]
      },
      {
        code: '204fc6b8-d6c9-4fb8-acd0-47d23c087625',
        shortCode: 'novs',
        label: 'No surcharge',
        ruleType: 'mandatory',
        excludedFromResults: false,
        childOfTrueResponse: false
      }
    ]
  },
  {
    label: 'No surcharge',
    valid: true,
    caseId: 'dcf4ecf0-970f-46be-97e3-2f32e387339e',
    offenceId: 'beaa105a-0268-4a77-925a-1eb90c574f36',
    shortCode: 'novs',
    defendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    orderedDate: '2024-02-13',
    resultLevel: 'D',
    unscheduled: false,
    originalText: 'novs',
    resultLineId: '58f01ead-fd97-4785-88b3-f3ff33a1730f',
    excludedFromResults: false, // This is the added required property
    resultPrompts: [
      {
        type: 'TXT',
        label: 'Reason for no surcharge',
        value: 'test123',
        promptId: '042742a1-8d47-4558-9b3e-9f34b358e034',
        promptRef: 'reasonForNoSurcharge'
      }
    ],
    unresolvedParts: [],
    masterDefendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
    resultDefinitionId: '204fc6b8-d6c9-4fb8-acd0-47d23c087625',
    conditionalMandatory: false,
    promptChoices: [
      {
        code: '042742a1-8d47-4558-9b3e-9f34b358e034',
        promptOrder: 100,
        promptRef: 'reasonForNoSurcharge',
        label: 'Reason for no surcharge',
        type: 'TXT',
        required: true,
        minLength: '1',
        maxLength: '1000'
      }
    ],
    childResultDefinitions: []
  }
];

const resultLineMock: ExtendedResolvedDraftResultLine = {
  label: 'Victim Surcharge Applies?',
  valid: true,
  caseId: 'dcf4ecf0-970f-46be-97e3-2f32e387339e',
  offenceId: 'beaa105a-0268-4a77-925a-1eb90c574f36',
  shortCode: 'vsa',
  defendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
  orderedDate: '2024-02-13',
  resultLevel: 'D',
  unscheduled: false,
  originalText: 'vsa',
  resultLineId: 'c289373b-a11e-4e2c-a8fd-56e5f1d47ffe',
  resultPrompts: [],
  unresolvedParts: [],
  masterDefendantId: 'a7e081be-c5a7-4d9b-b1de-a9c842ce84a6',
  resultDefinitionId: '386a3a47-b2cb-4017-9dd8-19ffeb457b56',
  conditionalMandatory: true,
  promptChoices: [],
  excludedFromResults: false,
  childResultDefinitions: [
    {
      code: 'e866cd11-6073-4fdf-a229-51c9d694e1d0',
      shortCode: 'fvs',
      label: 'Surcharge',
      ruleType: 'mandatory',
      excludedFromResults: false,
      childResultCodes: [
        '615313b5-0647-4d61-b7b8-6b36265d8929',
        '4fdd9548-c521-48c9-baa3-1bd2f13a4fcc',
        'bdb32555-8d55-4dc1-b4b6-580db5132496',
        'f7dfefd2-64c6-11e8-adc0-fa7ae01bbebc',
        '923f8b82-d4b5-4c9b-8b54-6d1ec8e16dd6',
        'cfa66730-f81c-4768-a36e-581791cb0270'
      ]
    },
    {
      code: '204fc6b8-d6c9-4fb8-acd0-47d23c087625',
      shortCode: 'novs',
      label: 'No surcharge',
      ruleType: 'mandatory',
      excludedFromResults: false,
      childOfTrueResponse: false
    }
  ]
};

jest.mock('@cpp/users-groups', () => ({
  ...(jest.requireActual('@cpp/users-groups') as any),
  getUserDetails: jest.fn()
}));

jest.mock('../../../core', () => ({
  ...(jest.requireActual('../../../core') as any),
  getCurrentHearingAmendedByUserId: jest.fn(),
  getCurrentHearingState: jest.fn()
}));

describe('ShareableResultsContainerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShareableResultsContainerComponent],
      providers: [
        provideStore(reducers, {
          runtimeChecks: {},
          initialState: {
            hearings: {
              current: {
                hearing: { id: 'hearingId' }
              }
            } as HearingState
          }
        }),
        provideRouter([]),
        provideState('results', resultsReducer, {
          initialState: {
            draftResult: draftResult as DraftResult
          }
        })
      ],
      teardown: { destroyAfterEach: false }
    });
  });

  const createFixture = ({
    hearingState = HearingLockState.INITIALISED,
    currentHearingAmendedBySelf,
    ...options
  }: {
    applicationId?: string;
    caseId?: string;
    masterDefendantId?: string;
    offenceId?: string;
    applicationCaseStatus?: string;
    showResultsPlaceholder?: boolean;
    hearingState?: HearingLockState;
    currentHearingAmendedBySelf?: boolean;
    isCourtApplicationFinalised?: boolean;
    isAmendmentAllowed?: boolean;
    amendApplicationPermission?: boolean;
    showCaseLevelOffences?: boolean;
  }) => {
    const currentUserId = '1';
    const amendedByUserId = currentHearingAmendedBySelf ? currentUserId : '2';

    (getCurrentHearingAmendedByUserId as jest.Mock).mockImplementation(() => amendedByUserId);
    (getCurrentHearingState as jest.Mock).mockImplementation(() => hearingState);
    (getUserDetails as jest.Mock).mockImplementation(() => ({ userId: currentUserId }));

    const fixture = TestBed.createComponent(ShareableResultsContainerComponent);

    for (const option in options) {
      if (Object.prototype.hasOwnProperty.call(options, option)) {
        (fixture.componentInstance as any)[option] = options[option as keyof typeof options];
      }
    }
    fixture.detectChanges();
    return fixture;
  };

  describe('offence targets', () => {
    it('should render case level results', () => {
      const fixture = createFixture({
        caseId: '17766a10-db3f-4cc9-8745-6cad78edc642',
        masterDefendantId: 'd11b6c65-f9dd-4655-8eca-9af0e38bf942'
      });
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should not render application targets at case level', () => {
      const fixture = createFixture({
        caseId: '5c148559-2140-48b9-b88f-ae840cea2288',
        masterDefendantId: 'f80968c1-9969-4a29-8e6b-08db4c4edf60'
      });
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should render defendant level results', () => {
      const fixture = createFixture({ masterDefendantId: 'd11b6c65-f9dd-4655-8eca-9af0e38bf942' });

      expect(fixture).toMatchSnapshot();
    });

    it('should not render application targets at defendant level', () => {
      const fixture = createFixture({
        masterDefendantId: 'f80968c1-9969-4a29-8e6b-08db4c4edf60'
      });
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should render offence results', () => {
      const fixture = createFixture({ offenceId: '6844d634-a6fe-42a6-9b6c-1adce72af4fd' });

      expect(fixture).toMatchSnapshot();
    });

    it('should not include case-level results for an offence by default', () => {
      const fixture = createFixture({ offenceId: 'fe3704be-46ce-4dc9-8674-96b379f9a56e' });

      expect(fixture.componentInstance.resultLinesForResultLevel).toEqual([]);
    });

    it('should include case-level results for an offence when showCaseLevelOffences is true', () => {
      const fixture = createFixture({
        offenceId: 'fe3704be-46ce-4dc9-8674-96b379f9a56e',
        showCaseLevelOffences: true
      });

      expect(fixture.componentInstance.resultLinesForResultLevel).toHaveLength(1);
      expect(fixture.componentInstance.resultLinesForResultLevel[0].resultLevel).toBe('C');
      expect(fixture.componentInstance.resultLinesForResultLevel[0].shortCode).toBe('fcost');
    });
  });

  describe('application targets', () => {
    it('should render application results', () => {
      const fixture = createFixture({ applicationId: '4e8117e4-2113-463e-8bc9-adadfad3c285' });

      expect(fixture).toMatchSnapshot();
    });

    it('should not render offences with an applicationId', () => {
      const fixture = createFixture({ applicationId: 'a085e359-6069-4694-8820-7810e7dfe762' });

      expect(fixture).toMatchSnapshot();
    });

    it('should render application results regardless of the result level', () => {
      const fixture = createFixture({ applicationId: '4e8117e4-2113-463e-8bc9-adadfad3c285' });

      expect(fixture).toMatchSnapshot();
    });

    it('should not render no shareable results component for a finalised application when amendment is not allowed even when the case status is ACTIVE', () => {
      const fixture = createFixture({
        amendApplicationPermission: true,
        applicationCaseStatus: 'ACTIVE',
        isCourtApplicationFinalised: true,
        isAmendmentAllowed: false,
        showResultsPlaceholder: true
      });
      const compiled = fixture.debugElement.nativeElement;
      fixture.detectChanges();
      expect(compiled.querySelector('cpp-no-shareable-results')).toBeNull();
    });

    it('should render no shareable results component for a finalised application when amendment is allowed', () => {
      const fixture = createFixture({
        amendApplicationPermission: true,
        applicationCaseStatus: 'INACTIVE',
        isCourtApplicationFinalised: true,
        isAmendmentAllowed: true,
        showResultsPlaceholder: true
      });
      const compiled = fixture.debugElement.nativeElement;
      fixture.detectChanges();
      expect(compiled.querySelector('cpp-no-shareable-results')).not.toBeNull();
    });
  });

  describe('non-amending user', () => {
    it('should render a result line with a pending amendment', () => {
      const fixture = createFixture({
        applicationId: 'c085e359-6069-4694-8820-7810e7dfe762',
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR,
        currentHearingAmendedBySelf: false
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a deleted result line', () => {
      const fixture = createFixture({
        applicationId: 'd085e359-6069-4694-8820-7810e7dfe762',
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR,
        currentHearingAmendedBySelf: false
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a result line awaiting validation', () => {
      const fixture = createFixture({
        applicationId: 'c085e359-6069-4694-8820-7810e7dfe762',
        currentHearingAmendedBySelf: false,
        hearingState: HearingLockState.APPROVAL_REQUESTED
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a result line after validation', () => {
      const fixture = createFixture({
        applicationId: 'c085e359-6069-4694-8820-7810e7dfe762',
        currentHearingAmendedBySelf: false,
        hearingState: HearingLockState.VALIDATED
      });

      expect(fixture).toMatchSnapshot();
    });
  });

  describe('amending user', () => {
    it('should render a result line with a pending amendment', () => {
      const fixture = createFixture({
        applicationId: 'c085e359-6069-4694-8820-7810e7dfe762',
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR,
        currentHearingAmendedBySelf: true
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a deleted result line', () => {
      const fixture = createFixture({
        applicationId: 'd085e359-6069-4694-8820-7810e7dfe762',
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR,
        currentHearingAmendedBySelf: true
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a result line with a shared amendment', () => {
      const fixture = createFixture({
        hearingState: HearingLockState.SHARED,
        applicationId: 'b085e359-6069-4694-8820-7810e7dfe762'
      });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a result line awaiting validation', () => {
      const fixture = createFixture({
        applicationId: 'c085e359-6069-4694-8820-7810e7dfe762',
        currentHearingAmendedBySelf: true,
        hearingState: HearingLockState.APPROVAL_REQUESTED
      });

      expect(fixture).toMatchSnapshot();
    });
  });

  describe('getConditionalMandatoryHasChild', () => {
    let component: ShareableResultsContainerComponent;

    beforeEach(() => {
      const fixture = TestBed.createComponent(ShareableResultsContainerComponent);
      component = fixture.componentInstance;
    });

    it('should return undefined if conditionalMandatory is falsy', () => {
      const resultLine = {
        conditionalMandatory: false,
        childResultDefinitions: [] as Array<ChildResultDefinition>
      } as ExtendedResolvedDraftResultLine;
      expect(component.getConditionalMandatoryHasChild(resultLine)).toBe(undefined);
    });

    it('should return true if no child code matches a resultLine', () => {
      component.resultLinesForResultLevel = resultLinesArrayForTrue;
      const resultLine = resultLineMock;
      expect(component.getConditionalMandatoryHasChild(resultLine)).toBe(true);
    });

    it('should return false if no child code matches a resultLine', () => {
      component.resultLinesForResultLevel = resultLinesArrayForFalse;
      const resultLine = resultLineMock;
      expect(component.getConditionalMandatoryHasChild(resultLine)).toBe(false);
    });
  });

  describe('canAmendmentApplication', () => {
    const createComponent = (options: {
      amendApplicationPermission?: boolean;
      applicationCaseStatus?: string;
      isCourtApplicationFinalised?: boolean;
      isAmendmentAllowed?: boolean;
      showResultsPlaceholder?: boolean;
      activeResultLines?: ExtendedResolvedDraftResultLine[];
    }): ShareableResultsContainerComponent => {
      const fixture = TestBed.createComponent(ShareableResultsContainerComponent);
      return Object.assign(fixture.componentInstance, options);
    };

    describe('with the amend application permission', () => {
      it.each(['ACTIVE', 'INACTIVE'])(
        'should block amend application for a finalised application when amendment is not allowed and the case status is %s',
        caseStatus => {
          const component = createComponent({
            amendApplicationPermission: true,
            applicationCaseStatus: caseStatus,
            isCourtApplicationFinalised: true,
            isAmendmentAllowed: false,
            showResultsPlaceholder: true,
            activeResultLines: []
          });

          component.canAmendmentApplication();

          expect(component.hasAmendApplication).toBe(false);
        }
      );

      it('should block amend application for a finalised application when amendment is not allowed and the case status is not set', () => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: true,
          isAmendmentAllowed: false,
          showResultsPlaceholder: true,
          activeResultLines: []
        });

        component.canAmendmentApplication();

        expect(component.hasAmendApplication).toBe(false);
      });

      it.each(['ACTIVE', 'INACTIVE'])(
        'should allow amend application for a finalised application when amendment is allowed and the case status is %s',
        caseStatus => {
          const component = createComponent({
            amendApplicationPermission: true,
            applicationCaseStatus: caseStatus,
            isCourtApplicationFinalised: true,
            isAmendmentAllowed: true,
            showResultsPlaceholder: true,
            activeResultLines: []
          });

          component.canAmendmentApplication();

          expect(component.hasAmendApplication).toBe(true);
        }
      );

      it('should allow amend application for a non-finalised application when there are no active result lines and the results placeholder is shown', () => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: false,
          isAmendmentAllowed: false,
          showResultsPlaceholder: true,
          activeResultLines: []
        });

        component.canAmendmentApplication();

        expect(component.hasAmendApplication).toBe(true);
      });

      it('should block amend application for a non-finalised application when there are active result lines', () => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: false,
          isAmendmentAllowed: false,
          showResultsPlaceholder: true,
          activeResultLines: resultLinesArrayForTrue
        });

        component.canAmendmentApplication();

        expect(component.hasAmendApplication).toBe(false);
      });

      it('should block amend application for a non-finalised application when the results placeholder is not shown', () => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: false,
          isAmendmentAllowed: false,
          showResultsPlaceholder: false,
          activeResultLines: []
        });

        component.canAmendmentApplication();

        expect(component.hasAmendApplication).toBe(false);
      });
    });

    describe('without the amend application permission', () => {
      it.each(['ACTIVE', 'INACTIVE'])(
        'should keep legacy behaviour and allow amend application for a finalised application when amendment is not allowed and the case status is %s',
        caseStatus => {
          const component = createComponent({
            amendApplicationPermission: false,
            applicationCaseStatus: caseStatus,
            isCourtApplicationFinalised: true,
            isAmendmentAllowed: false,
            showResultsPlaceholder: true,
            activeResultLines: []
          });

          component.canAmendmentApplication();

          expect(component.hasAmendApplication).toBe(true);
        }
      );

      it('should keep legacy behaviour and block amend application when there are active result lines', () => {
        const component = createComponent({
          amendApplicationPermission: false,
          isCourtApplicationFinalised: false,
          isAmendmentAllowed: false,
          showResultsPlaceholder: true,
          activeResultLines: resultLinesArrayForTrue
        });

        component.canAmendmentApplication();

        expect(component.hasAmendApplication).toBe(false);
      });

      it('should keep legacy behaviour and block amend application when the results placeholder is not shown', () => {
        const component = createComponent({
          amendApplicationPermission: false,
          isCourtApplicationFinalised: false,
          isAmendmentAllowed: false,
          showResultsPlaceholder: false,
          activeResultLines: []
        });

        component.canAmendmentApplication();

        expect(component.hasAmendApplication).toBe(false);
      });
    });
  });
});
