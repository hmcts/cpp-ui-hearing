import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { UsersGroupsState } from '@cpp/users-groups';
import { Action, Store, provideStore, provideState } from '@ngrx/store';
import produce from 'immer';
import moment from 'moment';
import { HearingDetail, HearingState, reducers } from '../../../core';
import { Offence } from '../../../magistrates/interfaces/magistrates-hearing.interface';
import { NotepadParserService } from '../../core/services/notepad-parser.service';
import { DraftResultActions, resultsReducer, ResultsState } from '../../core/store';
import { createDraftResultPromptsForShortcode, DraftResultBuilder } from '../../core/testing';
import {
  DraftResult,
  DraftResultRelation,
  PromptEntry,
  ResolvedDraftResultLine
} from '../../results.interfaces';
import { ParseTextValue } from '../draft-result/draft-result-body.component';
import { EnterResultsContainerComponent } from '../enter-results.container';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ValidationError } from '@cpp/pdk';
import { provideCppCoreHttpServices } from '@cpp/core';
import { JsonPipe } from '@angular/common';

describe('EnterResultsContainerComponent', () => {
  let draftResultBuilder: DraftResultBuilder;
  let fixture: ComponentFixture<EnterResultsContainerComponent>;
  let store: Store<ResultsState>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideCppCoreHttpServices(),
        provideStore(reducers, {
          runtimeChecks: {},
          initialState: {
            hearings: {
              selectedHearingDate: moment().format(),
              current: {
                hearing: { id: 'hearingId' }
              }
            } as HearingState,
            usersGroups: {
              userDetails: {
                userId: 'userId'
              }
            } as UsersGroupsState['usersGroups']
          }
        }),
        provideRouter([]),
        provideState('results', resultsReducer),
        NotepadParserService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ isHmctsOrganisation: true })
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(EnterResultsContainerComponent);
    store = TestBed.inject(Store);
    draftResultBuilder = new DraftResultBuilder();
    updateDraftResultInStore(draftResultBuilder.draftResult);
  });

  const updateDraftResultInStore = (draftResult: DraftResult) => {
    store.dispatch(DraftResultActions.setDraftResult({ draftResult }));
    fixture.detectChanges();
  };

  it('should render an empty draft result', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should render the saving status of the draft result', () => {
    store.dispatch(
      DraftResultActions.saveDraftResult({ draftResult: draftResultBuilder.draftResult })
    );

    expect(fixture).toMatchSnapshot();
  });

  it('should render the error status of the draft result', () => {
    store.dispatch(
      DraftResultActions.setDraftResultError({
        error: 'Something has gone wrong!',
        action: {} as Action
      })
    );
    expect(fixture).toMatchSnapshot();
  });

  describe('draft result validity', () => {
    it('should render the validity based on required result prompts', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          applicationId: 'applicationId1',
          originalText: 'NCOSTS ok',
          orderedDate: '2020-01-01'
        },
        {
          applicationId: 'applicationId2',
          originalText: 'NCOSTS',
          orderedDate: '2020-01-01'
        }
      );

      updateDraftResultInStore(draftResultBuilder.draftResult);

      expect(fixture).toMatchSnapshot();

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:2',
        resultPrompts: createDraftResultPromptsForShortcode('NCOSTS')
      });

      updateDraftResultInStore(draftResultBuilder.draftResult);

      expect(fixture).toMatchSnapshot();
    });

    it('should render valid for conditional mandatory', async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId1',
        originalText: 'EMREQ',
        orderedDate: '2020-01-01'
      });

      updateDraftResultInStore(draftResultBuilder.draftResult);

      expect(fixture).toMatchSnapshot();
    });

    it('should render valid for an optional child with no result prompts', async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId1',
        originalText: 'IMP',
        orderedDate: '2020-01-01'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('IMP')
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:2',
        resultPrompts: createDraftResultPromptsForShortcode('TIMP')
      });

      updateDraftResultInStore(draftResultBuilder.draftResult);

      expect(fixture).toMatchSnapshot();
    });
  });

  it('should render the delegated powers of the draft result', async () => {
    await draftResultBuilder.setDelegatedPowers({ delegatedPowers: true } as any);

    updateDraftResultInStore(draftResultBuilder.draftResult);

    expect(fixture).toMatchSnapshot();
  });

  it('should render a draft result with shadow listed offence ids', async () => {
    await draftResultBuilder.setShadowListedOffenceIds(['offenceId']);

    updateDraftResultInStore(draftResultBuilder.draftResult);

    expect(fixture).toMatchSnapshot();
  });

  it('should render a draft result with a hierarchy of result lines', async () => {
    await draftResultBuilder.parseTextOptions({
      applicationId: 'applicationId',
      originalText: 'IMP',
      orderedDate: '2020-01-01'
    });

    updateDraftResultInStore(draftResultBuilder.draftResult);

    expect(fixture).toMatchSnapshot();
  });

  it('should render a draft result with shared targets', async () => {
    await draftResultBuilder.parseTextOptions(
      {
        applicationId: 'applicationId1',
        originalText: 'NCOSTS ok',
        orderedDate: '2020-01-01'
      },
      {
        applicationId: 'applicationId2',
        originalText: 'NCOSTS ok',
        orderedDate: '2020-01-01'
      }
    );

    updateDraftResultInStore(
      produce(draftResultBuilder.draftResult, draftResult => {
        (Object.values(draftResult.resultLines)[1] as ResolvedDraftResultLine).sharedDate =
          '2020-01-02';
      })
    );

    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'delegated-powers',
  template: ` {{ delegatedPowers | json }}<br /> `,
  imports: [JsonPipe]
})
export class DelegatedPowersComponent {
  @Input() delegatedPowers: string;
  @Output() delegatedPowersChange = new EventEmitter<boolean>();
}

@Component({
  selector: 'cpp-draft-result',
  template: `
    draftResultError: {{ draftResultError | json }}<br />
    draftResultPromptsValid: {{ draftResultPromptsValid | json }}<br />
    draftResultRelations: {{ draftResultRelations | json }}<br />
    draftResultSaving: {{ draftResultSaving | json }}<br />
    prosecutorToBeNotified: {{ prosecutorToBeNotified | json }}<br />
    hearing: {{ hearing | json }}<br />
    shadowListedOffenceIds: {{ shadowListedOffenceIds | json }}<br />
    sharedTargetIds: {{ sharedTargetIds | json }}<br />
  `,
  imports: [JsonPipe]
})
export class DraftResultComponent {
  @Input() draftResultError: { action: Action } | null = null;
  @Input() draftResultPromptsValid = false;
  @Input() draftResultRelations: Record<string, DraftResultRelation[]>;
  @Input() draftResultSaving = false;
  @Input() hearing: HearingDetail;
  @Input() readonly = false;
  @Input() shadowListedOffenceIds: string[] = [];
  @Input() sharedTargetIds: string[] = [];
  @Input() electronicMonitoringOffences: Offence[];
  @Input() warrantOfArrestOffences: Offence[];
  @Input() hasHmctsOrganisation: boolean;
  @Input() prosecutorToBeNotified: PromptEntry[];
  @Input() canAllocateRelatedHearing: boolean;
  @Input() amendApplicationPermission = false;
  @Input() caseStatus: string;

  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() parseTextValues = new EventEmitter<ParseTextValue[]>();
  @Output() retryFailedAction = new EventEmitter<Action>();
  @Output() shadowListedOffenceIdsChange = new EventEmitter<string[]>();
}

@Component({
  selector: 'offence-conditions-dialog',
  template: ` offences: {{ offences | json }} `,
  imports: [JsonPipe]
})
export class OffenceConditionsDialogComponent {
  @Input() offences: Offence[];
}
