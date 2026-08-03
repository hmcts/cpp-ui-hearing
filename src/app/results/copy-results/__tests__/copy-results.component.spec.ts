import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LinkType } from '@cpp/reference-data';
import { Store, provideStore, provideState } from '@ngrx/store';
import { CourtApplication, HearingDetail, HearingState, reducers } from '../../../core';
import { ApplicationItem } from '../../core/helpers';
import { DraftResultActions, resultsReducer, ResultsState } from '../../core/store';
import { createResolvedDraftResultLine } from '../../core/testing';
import { DraftResult, ResolvedDraftResultLine } from '../../results.interfaces';
import { CopyResultsContainerComponent } from '../copy-results.container';
import { CopyResultsComponent } from '../copy-results.component';

describe('CopyResultsComponent', () => {
  let fixture: ComponentFixture<CopyResultsContainerComponent>;
  let store: Store<ResultsState>;
  let copyResultsComponent: CopyResultsComponent;

  const createComponent = (params: { targetId: string }) => {
    const route = new ActivatedRoute();
    route.snapshot = new ActivatedRouteSnapshot();
    route.snapshot.url = [];
    route.snapshot.params = params;

    TestBed.configureTestingModule({
      imports: [CopyResultsContainerComponent],
      providers: [
        provideStore(reducers, {
          runtimeChecks: {},
          initialState: {
            hearings: {
              current: {
                hearing: hearingForCase
              }
            } as HearingState
          }
        }),
        provideRouter([]),
        provideState('results', resultsReducer, {
          initialState: {
            draftResult
          }
        }),
        {
          provide: ActivatedRoute,
          useValue: route
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(CopyResultsContainerComponent);
    fixture.detectChanges();
    copyResultsComponent = fixture.debugElement.children[0].componentInstance;
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  };

  describe('copy from an application target', () => {
    beforeEach(() => {
      createComponent({ targetId: 'applicationId' });
    });

    it('should render', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should copy the result to a new target', async () => {
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyFromTarget"] input'))[0]
        .nativeElement.click();
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyToTarget"] input'))[1]
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();
      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.copyDraftResultLines({
          copyTargets: [
            {
              caseId: 'caseId',
              masterDefendantId: 'masterDefendantId',
              defendantId: 'defendantId',
              offenceId: 'offenceId2',
              originalResultLineId: 'resultLineId1'
            }
          ]
        })
      );
    });

    it('should copy a result to all targets', async () => {
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyFromTarget"] input'))[0]
        .nativeElement.click();
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyToAllTargetGroups"] input'))[0]
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();
      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.copyDraftResultLines({
          copyTargets: [
            {
              caseId: 'caseId',
              masterDefendantId: 'masterDefendantId',
              defendantId: 'defendantId',
              offenceId: 'offenceId1',
              originalResultLineId: 'resultLineId1'
            },
            {
              caseId: 'caseId',
              masterDefendantId: 'masterDefendantId',
              defendantId: 'defendantId',
              offenceId: 'offenceId2',
              originalResultLineId: 'resultLineId1'
            }
          ]
        })
      );
    });
  });

  describe('copy from an offence target', () => {
    beforeEach(() => {
      createComponent({ targetId: 'offenceId1' });
    });

    it('should render', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should copy the result to an application target', async () => {
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyFromTarget"] input'))[0]
        .nativeElement.click();
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyToTarget"] input'))[1]
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.copyDraftResultLines({
          copyTargets: [
            {
              applicationId: 'applicationId',
              originalResultLineId: 'resultLineId2'
            }
          ]
        })
      );
    });

    it('should copy the result to an offence target', async () => {
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyFromTarget"] input'))[0]
        .nativeElement.click();
      fixture.debugElement
        .queryAll(By.css('[data-test-id="copyToTarget"] input'))[0]
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.copyDraftResultLines({
          copyTargets: [
            {
              caseId: 'caseId',
              masterDefendantId: 'masterDefendantId',
              defendantId: 'defendantId',
              offenceId: 'offenceId2',
              originalResultLineId: 'resultLineId2'
            }
          ]
        })
      );
    });
  });

  describe('Validation errors on initial load', () => {
    beforeEach(() => {
      createComponent({ targetId: 'offenceId1' });
    });

    it('should not display errors', () => {
      copyResultsComponent.ngOnChanges();
      expect(copyResultsComponent.errors.length).toBe(0);
    });

    it('should handle defendant level validation errors', () => {
      const invalidResultLines: ResolvedDraftResultLine[] = [
        {
          label: 'Defendant level result',
          valid: false,
          shortCode: 'defendant',
          orderedDate: '2024-05-02',
          resultLevel: 'D',
          originalText: 'DEFENDANT',
          resultLineId: 'resultLineId',
          resultPrompts: [],
          unresolvedParts: [],
          resultDefinitionId: 'resultDefinitionId',
          caseId: 'caseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId'
        }
      ];
      store.dispatch(DraftResultActions.setDraftResultLineErrors({ invalidResultLines }));
      fixture.detectChanges();
      copyResultsComponent.ngOnChanges();
      expect(copyResultsComponent.errors.length).toBe(1);
      expect(copyResultsComponent.errors[0].message).toContain(
        'You cannot apply [DEFENDANT] to two or more offences for the same defendant'
      );
    });

    it('should handle case-defendant level validation errors', () => {
      const invalidResultLines: ResolvedDraftResultLine[] = [
        {
          label: 'Case-Defendant level result',
          valid: false,
          shortCode: 'casedefendant',
          orderedDate: '2024-05-02',
          resultLevel: 'C',
          originalText: 'CASEDEFENDANT',
          resultLineId: 'resultLineId',
          resultPrompts: [],
          unresolvedParts: [],
          resultDefinitionId: 'resultDefinitionId',
          caseId: 'caseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId'
        }
      ];
      store.dispatch(DraftResultActions.setDraftResultLineErrors({ invalidResultLines }));
      fixture.detectChanges();
      copyResultsComponent.ngOnChanges();
      expect(copyResultsComponent.errors.length).toBe(1);
      expect(copyResultsComponent.errors[0].message).toContain(
        'You cannot apply [CASEDEFENDANT] to the same defendant in the same case'
      );
    });
  });

  describe('amend application gates (CHD-2574)', () => {
    interface GateComponentOptions {
      amendApplicationPermission: boolean;
      caseStatus?: string;
      copyFromTargetId?: string;
      courtApplications: CourtApplication[];
      selectedTargetIds?: string[];
    }

    const createCourtApplication = (overrides: Partial<CourtApplication>): CourtApplication =>
      ({ applicationStatus: 'LISTED', ...overrides } as CourtApplication);

    const createGateComponent = (options: GateComponentOptions): CopyResultsComponent => {
      const component = new CopyResultsComponent();
      component.hearing = {
        id: 'hearingId',
        courtApplications: options.courtApplications
      } as HearingDetail;
      component.amendApplicationPermission = options.amendApplicationPermission;
      component.copyFromTargetId = options.copyFromTargetId ?? 'copyFromTargetId';
      component.selectedTargetIds = options.selectedTargetIds ?? [];
      if (options.caseStatus) {
        component.caseStatus = options.caseStatus;
      }
      return component;
    };

    const activeApplication = createCourtApplication({ id: 'activeApplicationId' });
    const finalisedApplication = createCourtApplication({
      id: 'finalisedApplicationId',
      applicationStatus: 'FINALISED'
    });
    const finalisedAmendableApplication = createCourtApplication({
      id: 'finalisedAmendableApplicationId',
      applicationStatus: 'FINALISED',
      amendmentAllowed: true
    });

    const activeItem: ApplicationItem = {
      application: activeApplication,
      applicationId: activeApplication.id
    };
    const finalisedItem: ApplicationItem = {
      application: finalisedApplication,
      applicationId: finalisedApplication.id
    };
    const finalisedAmendableItem: ApplicationItem = {
      application: finalisedAmendableApplication,
      applicationId: finalisedAmendableApplication.id
    };

    describe('hasAmendApplication', () => {
      it('should block amending when permission is granted and a finalised application without amendment allowed exists, even when caseStatus is ACTIVE', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          caseStatus: 'ACTIVE',
          courtApplications: [finalisedApplication]
        });

        expect(component.hasAmendApplication(finalisedItem)).toBe(false);
      });

      it('should block amending when permission is granted and a finalised application without amendment allowed exists and caseStatus is not set', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [finalisedApplication]
        });

        expect(component.hasAmendApplication(finalisedItem)).toBe(false);
      });

      it('should return identical results for caseStatus INACTIVE and ACTIVE when permission is granted and an application is finalised', () => {
        const results = ['INACTIVE', 'ACTIVE'].map(caseStatus =>
          createGateComponent({
            amendApplicationPermission: true,
            caseStatus,
            courtApplications: [finalisedApplication]
          }).hasAmendApplication(finalisedItem)
        );

        expect(results).toEqual([false, false]);
      });

      it('should block amending all application items when any application in the hearing is finalised without amendment allowed and permission is granted', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [activeApplication, finalisedApplication]
        });

        expect(component.hasAmendApplication(activeItem)).toBe(false);
        expect(component.hasAmendApplication(finalisedItem)).toBe(false);
      });

      it('should allow amending a finalised application when amendment is allowed and permission is granted', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [finalisedAmendableApplication]
        });

        expect(component.hasAmendApplication(finalisedAmendableItem)).toBe(true);
      });

      it('should allow amending when permission is granted and no application in the hearing is finalised', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [activeApplication]
        });

        expect(component.hasAmendApplication(activeItem)).toBe(true);
      });

      it('should block amending the copy-from application even when permission is granted and no application is finalised', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          copyFromTargetId: activeApplication.id,
          courtApplications: [activeApplication]
        });

        expect(component.hasAmendApplication(activeItem)).toBe(false);
      });

      it('should follow the legacy copy-from condition only when the user lacks the amend application permission', () => {
        const component = createGateComponent({
          amendApplicationPermission: false,
          courtApplications: [finalisedApplication]
        });

        expect(component.hasAmendApplication(finalisedItem)).toBe(true);

        const copyFromComponent = createGateComponent({
          amendApplicationPermission: false,
          copyFromTargetId: finalisedApplication.id,
          courtApplications: [finalisedApplication]
        });

        expect(copyFromComponent.hasAmendApplication(finalisedItem)).toBe(false);
      });
    });

    describe('allowAmendApplication', () => {
      it('should block a selected finalised application without amendment allowed when permission is granted, even when caseStatus is ACTIVE', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          caseStatus: 'ACTIVE',
          courtApplications: [finalisedApplication],
          selectedTargetIds: [finalisedApplication.id]
        });

        expect(component.allowAmendApplication(finalisedApplication)).toBeFalsy();
      });

      it('should block a selected finalised application without amendment allowed when permission is granted and caseStatus is not set', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [finalisedApplication],
          selectedTargetIds: [finalisedApplication.id]
        });

        expect(component.allowAmendApplication(finalisedApplication)).toBeFalsy();
      });

      it('should return identical results for caseStatus INACTIVE and ACTIVE when permission is granted and the application is finalised', () => {
        const results = ['INACTIVE', 'ACTIVE'].map(caseStatus =>
          createGateComponent({
            amendApplicationPermission: true,
            caseStatus,
            courtApplications: [finalisedApplication],
            selectedTargetIds: [finalisedApplication.id]
          }).allowAmendApplication(finalisedApplication)
        );

        expect(results.map(result => Boolean(result))).toEqual([false, false]);
        expect(results[0]).toBe(results[1]);
      });

      it('should allow a selected finalised application when amendment is allowed and permission is granted', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [finalisedAmendableApplication],
          selectedTargetIds: [finalisedAmendableApplication.id]
        });

        expect(component.allowAmendApplication(finalisedAmendableApplication)).toBe(true);
      });

      it('should allow a selected application that is not finalised when permission is granted', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [activeApplication],
          selectedTargetIds: [activeApplication.id]
        });

        expect(component.allowAmendApplication(activeApplication)).toBe(true);
      });

      it('should block an application that is not selected even when permission is granted', () => {
        const component = createGateComponent({
          amendApplicationPermission: true,
          courtApplications: [activeApplication]
        });

        expect(component.allowAmendApplication(activeApplication)).toBe(false);
      });

      it('should follow the legacy selection condition only when the user lacks the amend application permission', () => {
        const component = createGateComponent({
          amendApplicationPermission: false,
          courtApplications: [finalisedApplication],
          selectedTargetIds: [finalisedApplication.id]
        });

        expect(component.allowAmendApplication(finalisedApplication)).toBe(true);

        const unselectedComponent = createGateComponent({
          amendApplicationPermission: false,
          courtApplications: [finalisedApplication]
        });

        expect(unselectedComponent.allowAmendApplication(finalisedApplication)).toBe(false);
      });
    });
  });
});

const hearingForCase = {
  id: 'hearingId',
  prosecutionCases: [
    {
      id: 'caseId',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityReference: 'CASE_URN'
      },
      defendants: [
        {
          id: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          legalEntityDefendant: {
            organisation: {
              name: 'HMCTS'
            }
          },
          offences: [
            {
              id: 'offenceId1',
              offenceTitle: 'Robbery',
              wording: 'Stolen diamonds'
            },
            {
              id: 'offenceId2',
              offenceTitle: 'Attempted Robbery',
              wording: 'Attempted to steal emeralds'
            }
          ]
        }
      ]
    }
  ],
  courtApplications: [
    {
      id: 'applicationId',
      subject: {
        masterDefendant: {
          masterDefendantId: 'masterDefendantId',
          defendantCase: [
            {
              caseId: 'caseId',
              defendantId: 'defendantId'
            }
          ]
        },
        personDetails: {
          firstName: 'James',
          lastName: 'Gray'
        }
      },
      type: {
        type: 'Application for witness summons',
        linkType: LinkType.LINKED
      },
      courtApplicationCases: [
        {
          prosecutionCaseId: 'caseId',
          prosecutionCaseIdentifier: {
            prosecutionAuthorityReference: 'CASE_URN'
          }
        }
      ]
    }
  ]
} as HearingDetail;

const draftResult: DraftResult = {
  hearingId: 'hearingId',
  hearingDay: '2020-01-01',
  shadowListedOffenceIds: [],
  delegatedPowers: false,
  resultLines: {
    resultLineId1: createResolvedDraftResultLine({
      applicationId: 'applicationId',
      resultLineId: 'resultLineId1',
      shortCode: 'upwr',
      resultPrompts: true
    }),
    resultLineId2: createResolvedDraftResultLine({
      caseId: 'caseId',
      masterDefendantId: 'masterDefendantId',
      defendantId: 'defendantId',
      offenceId: 'offenceId1',
      resultLineId: 'resultLineId2',
      shortCode: 'upwr',
      resultPrompts: true
    })
  },
  relations: [
    {
      resultLineId: 'resultLineId1',
      ruleType: 'standalone',
      childResultLineIds: []
    },
    {
      resultLineId: 'resultLineId2',
      ruleType: 'standalone',
      childResultLineIds: []
    }
  ]
};
