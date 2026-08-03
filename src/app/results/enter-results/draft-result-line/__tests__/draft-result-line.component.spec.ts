import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, provideRouter } from '@angular/router';
import { Store, provideStore, provideState } from '@ngrx/store';
import { provideCppCoreHttpServices } from '@cpp/core';
import { AppState, reducers } from '../../../../core';
import { DraftResultActions, resultsReducer, ResultsState } from '../../../core/store';
import { ReusableInfoService } from '../../../core/services/reusable-info.service';
import { of } from 'rxjs';
import {
  createDraftResultPromptsForShortcode,
  DraftResultBuilder,
  getParsedResultDefinitionByShortCode
} from '../../../core/testing';
import { DraftResult, DraftResultRelation, PromptEntry } from '../../../results.interfaces';
import { DraftResultComponent } from '../../draft-result/draft-result.component';
import { ChildResultDefinitionsFormComponent } from '../child-result-definitions-form.component';
import { DraftResultLineContainerComponent } from '../draft-result-line.container';
import { NotepadParserService } from '../../../core/services/notepad-parser.service';

let mockCanUserAmendHearing = true;

jest.mock('../../../../core', () => ({
  ...(jest.requireActual('../../../../core') as any),
  canUserAmendHearing: () => mockCanUserAmendHearing
}));

describe('DraftResultLineContainer', () => {
  let draftResultBuilder: DraftResultBuilder;
  let fixture: ComponentFixture<DraftResultLineContainerTestComponent>;
  let store: Store<ResultsState>;

  beforeEach(() => {
    const route = new ActivatedRoute();
    route.snapshot = new ActivatedRouteSnapshot();
    route.snapshot.url = [];
    route.snapshot.params = { hearingId: 'hearingId' };

    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        NotepadParserService,
        provideStore(reducers, {
          runtimeChecks: {},
          initialState: {
            usersGroups: {
              userDetails: {
                userId: 'userId',
                firstName: 'firstName',
                lastName: 'lastName',
                email: '1@1.com'
              }
            },
            hearings: {
              current: {
                hearing: { id: 'hearingId' }
              }
            }
          } as AppState
        }),
        provideRouter([]),
        provideState('results', resultsReducer),
        {
          provide: ActivatedRoute,
          useValue: route
        },
        {
          provide: DraftResultComponent,
          useValue: {
            registerResultLineChildForm: jest.fn(),
            deregisterResultLineChildForm: jest.fn(),
            isResultLineChildFormRegistered: jest.fn()
          }
        },
        {
          provide: ReusableInfoService,
          useValue: {
            getValueForPromptChoice: jest.fn(() => of(undefined))
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    draftResultBuilder = new DraftResultBuilder();
    fixture = TestBed.createComponent(DraftResultLineContainerTestComponent);
    mockCanUserAmendHearing = true;
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  });

  const installDraftResult = async (draftResult: DraftResult, resultLineId = 'UUID:1') => {
    const { ruleType } = draftResult.relations.find(
      relation => relation.resultLineId === resultLineId
    );

    store.next(
      DraftResultActions.setDraftResult({
        draftResult
      })
    );

    fixture.componentInstance.resultLineId = resultLineId;
    fixture.componentInstance.ruleType = ruleType;
    fixture.detectChanges();

    await fixture.whenStable();
  };

  describe('unresolved result line', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        originalText: 'UNKNOWN',
        orderedDate: '2020-01-01'
      });
      await installDraftResult(draftResultBuilder.draftResult);
    });

    it('should render', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should handle destroying the result line', () => {
      fixture.debugElement
        .query(By.css('[data-test-id="delete-result-line"]'))
        .nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.destroyDraftResultLine({ resultLineId: 'UUID:1' })
      );
    });

    it('should handle changing the result line', async () => {
      fixture.debugElement
        .query(By.css('[data-test-id="change-result-line"]'))
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();

      const parserInput = fixture.debugElement.query(
        By.css('cpp-draft-result-line-parser [name="originalText"]')
      ).nativeElement;

      expect(parserInput.value).toEqual('UNKNOWN');

      parserInput.value = '*';
      parserInput.dispatchEvent(new Event('input'));

      await fixture.whenStable();

      fixture.debugElement
        .query(By.css('cpp-draft-result-line-parser button[type="submit"]'))
        .nativeElement.click();
      fixture.detectChanges();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.replaceDraftResultLine({
          options: {
            resultLineId: 'UUID:1',
            originalText: '*',
            orderedDate: '2020-01-01'
          }
        })
      );
      expect(fixture).toMatchSnapshot();
    });
  });

  describe('resolved result line', () => {
    describe('"atLeastOneOf" child result definitions', () => {
      const parsedResult = getParsedResultDefinitionByShortCode('CREFT');

      let atLeastOneOfFormRef: ChildResultDefinitionsFormComponent;

      beforeEach(async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'CREFT',
          orderedDate: '*'
        });
        await installDraftResult(draftResultBuilder.draftResult);

        atLeastOneOfFormRef = fixture.debugElement.query(
          By.directive(ChildResultDefinitionsFormComponent)
        ).componentInstance;
      });

      it('should render', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should register the child result definitions form for global submit', () => {
        const draftResult = TestBed.inject(DraftResultComponent);

        expect(draftResult.registerResultLineChildForm).toHaveBeenCalledWith(atLeastOneOfFormRef);
      });

      it('should deregister the child result definitions form when destroyed', () => {
        const draftResult = TestBed.inject(DraftResultComponent);

        atLeastOneOfFormRef.ngOnDestroy();

        expect(draftResult.deregisterResultLineChildForm).toHaveBeenCalledWith(atLeastOneOfFormRef);
      });

      it('should handle selecting a choice', async () => {
        const control = fixture.debugElement.query(
          By.css('[name="atLeastOneOf"]')
        ).componentInstance;

        (control.ngControl as NgControl).control.setValue(parsedResult.childResultDefinitions[0]);

        await fixture.whenStable();

        expect(store.dispatch).toHaveBeenCalledWith(
          DraftResultActions.addChildToDraftResultLine({
            options: {
              belongsToResultLineId: 'UUID:1',
              shortCode: parsedResult.childResultDefinitions[0].shortCode,
              orderedDate: parsedResult.orderedDate
            }
          })
        );
      });
    });

    describe('"conditionalMandatory" child result definition', () => {
      beforeEach(async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'EMREQ',
          orderedDate: '2020-01-01'
        });
      });

      const installDraftResultForConditionalMandatory = async (draftResult: DraftResult) => {
        await installDraftResult(draftResult);
      };

      it('should render', async () => {
        await installDraftResultForConditionalMandatory(draftResultBuilder.draftResult);

        const ngModel = fixture.debugElement.query(By.css('[name="conditionalMandatory"]'))
          .componentInstance.ngControl;

        expect(ngModel.value).toEqual(null);
        expect(fixture).toMatchSnapshot();
      });

      it('should handle selecting a choice', async () => {
        await installDraftResultForConditionalMandatory(draftResultBuilder.draftResult);

        fixture.debugElement
          .queryAll(By.css('[name="conditionalMandatory"] input'))[0]
          .nativeElement.click();

        expect(store.dispatch).toHaveBeenCalledWith(
          DraftResultActions.setConditionalMandatory({
            resultLineId: 'UUID:1',
            selected: true
          })
        );
      });

      it('should pre-populate "Yes" when the conditional mandatory was selected', async () => {
        await draftResultBuilder.toggleConditionalMandatory({
          resultLineId: 'UUID:1',
          selected: true
        });
        await installDraftResult(draftResultBuilder.draftResult);

        const ngModel = fixture.debugElement.query(By.css('[name="conditionalMandatory"]'))
          .componentInstance.ngControl;

        expect(ngModel.value).toEqual(true);
      });

      it('should pre-populate "No" when the conditional mandatory child was declined', async () => {
        await draftResultBuilder.toggleConditionalMandatory({
          resultLineId: 'UUID:1',
          selected: false
        });
        await installDraftResult(draftResultBuilder.draftResult);

        const ngModel = fixture.debugElement.query(By.css('[name="conditionalMandatory"]'))
          .componentInstance.ngControl;

        expect(ngModel.value).toEqual(false);
      });
    });

    describe('"oneOf" child result definitions', () => {
      const parsedResult = getParsedResultDefinitionByShortCode('RT');

      let oneOfFormRef: ChildResultDefinitionsFormComponent;

      beforeEach(async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'RT',
          orderedDate: '*'
        });
        await installDraftResult(draftResultBuilder.draftResult);

        oneOfFormRef = fixture.debugElement.query(
          By.directive(ChildResultDefinitionsFormComponent)
        ).componentInstance;
      });

      it('should render', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should register the child result definitions form when first rendered', () => {
        const draftResult = TestBed.inject(DraftResultComponent);

        expect(draftResult.registerResultLineChildForm).toHaveBeenCalledWith(oneOfFormRef);
      });

      it('should deregister the child result definitions form when destroyed', () => {
        const draftResult = TestBed.inject(DraftResultComponent);

        oneOfFormRef.ngOnDestroy();

        expect(draftResult.deregisterResultLineChildForm).toHaveBeenCalledWith(oneOfFormRef);
      });

      it('should handle selecting a choice', async () => {
        fixture.debugElement.queryAll(By.css('[name="oneOf"] input'))[0].nativeElement.click();

        expect(store.dispatch).toHaveBeenCalledWith(
          DraftResultActions.addChildToDraftResultLine({
            options: {
              belongsToResultLineId: 'UUID:1',
              shortCode: parsedResult.childResultDefinitions[0].shortCode,
              orderedDate: parsedResult.orderedDate
            }
          })
        );
      });
    });

    describe('NHCCS definition', () => {
      beforeEach(async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'NHCCS',
          orderedDate: '*'
        });
        await installDraftResult(draftResultBuilder.draftResult);
      });

      it('should render', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should render the result prompts form for a related hearing', async () => {
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: [
            {
              promptId: 'a0ec3e68-5210-422f-9959-73c1c7ce495a',
              promptRef: 'existingHearingId',
              label: 'Existing Hearing Id',
              type: 'HIDDEN',
              value: 'hearingId'
            }
          ]
        });
        await installDraftResult(draftResultBuilder.draftResult);

        expect(fixture).toMatchSnapshot();
      });
    });

    describe('NHMC definition', () => {
      beforeEach(async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'NHMC',
          orderedDate: '*'
        });
        await installDraftResult(draftResultBuilder.draftResult);
      });

      it('should render', () => {
        expect(fixture).toMatchSnapshot();
      });
    });

    describe('optional result branch', () => {
      it('should not require child result definition when part of an optional branch', async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'PBVAR',
          orderedDate: '*'
        });

        await installDraftResult(draftResultBuilder.draftResult, 'UUID:2');

        expect(fixture).toMatchSnapshot();
      });
    });

    describe('result definition', () => {
      const parsedResult = getParsedResultDefinitionByShortCode('NCOSTS');

      beforeEach(async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          originalText: 'NCOSTS',
          orderedDate: '*'
        });
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
        });
      });

      describe('when a hearing is locked', () => {
        beforeEach(async () => {
          mockCanUserAmendHearing = false;
          await installDraftResult(draftResultBuilder.draftResult);
        });

        it('should restrict the editing privileges', async () => {
          expect(fixture).toMatchSnapshot();
        });
      });

      describe('when a hearing is unlocked', () => {
        beforeEach(async () => {
          await installDraftResult(draftResultBuilder.draftResult);
        });

        it('should render the completed result prompts', () => {
          expect(fixture).toMatchSnapshot();
        });

        it('should handle changing the chosen result definition', async () => {
          fixture.debugElement
            .query(By.css('[data-test-id="change-result-line"]'))
            .nativeElement.click();
          fixture.detectChanges();

          await fixture.whenStable();

          const parserInput = fixture.debugElement.query(
            By.css('cpp-draft-result-line-parser [name="originalText"]')
          ).nativeElement;

          expect(parserInput.value).toEqual('NCOSTS');

          parserInput.value = '*';
          parserInput.dispatchEvent(new Event('input'));

          await fixture.whenStable();

          fixture.debugElement
            .query(By.css('cpp-draft-result-line-parser button[type="submit"]'))
            .nativeElement.click();
          fixture.detectChanges();

          expect(store.dispatch).toHaveBeenCalledWith(
            DraftResultActions.replaceDraftResultLine({
              options: {
                resultLineId: 'UUID:1',
                originalText: '*',
                orderedDate: parsedResult.orderedDate
              }
            })
          );
          expect(fixture).toMatchSnapshot();
        });

        it('should render optional results', async () => {
          await draftResultBuilder.parseTextOptions({
            applicationId: 'applicationId',
            originalText: 'STDEC',
            orderedDate: '*'
          });
          await installDraftResult(draftResultBuilder.draftResult, 'UUID:3');

          expect(fixture).toMatchSnapshot();
        });

        it('should disable the result line options for a child result line', () => {
          fixture.componentInstance.ruleType = 'optional';
          fixture.detectChanges();

          const changeOption = fixture.debugElement.query(
            By.css('[data-test-id="change-result-line"]')
          );
          const deleteOption = fixture.debugElement.query(
            By.css('[data-test-id="delete-result-line"]')
          );

          expect(changeOption).toBeNull();
          expect(deleteOption).toBeNull();
        });

        it('should handle deleting the result line', () => {
          fixture.debugElement
            .query(By.css('[data-test-id="delete-result-line"]'))
            .nativeElement.click();

          expect(store.dispatch).toHaveBeenCalledWith(
            DraftResultActions.destroyDraftResultLine({ resultLineId: 'UUID:1' })
          );
        });
      });
    });
  });

  @Component({
    template: `
      <cpp-draft-result-line-container
        [resultLineId]="resultLineId"
        [ruleType]="ruleType"
        [hasHmctsOrganisation]="hasHmctsOrganisation"
        [prosecutorToBeNotified]="prosecutorToBeNotified"
        [isCourtApplicationFinalised]="isCourtApplicationFinalised"
        [isAmendmentAllowed]="isAmendmentAllowed"
        [amendApplicationPermission]="amendApplicationPermission"
        (errors)="onErrors($event)"
      >
      </cpp-draft-result-line-container>
    `,
    imports: [DraftResultLineContainerComponent]
  })
  class DraftResultLineContainerTestComponent {
    resultLineId: string;
    @Input() hasHmctsOrganisation?: boolean;
    @Input() prosecutorToBeNotified?: PromptEntry[];
    @Input() isCourtApplicationFinalised?: boolean;
    @Input() isAmendmentAllowed?: boolean;
    @Input() amendApplicationPermission?: boolean;
    @Input() caseStatus?: string;
    ruleType: DraftResultRelation['ruleType'];
    onErrors = jest.fn();
  }
});
