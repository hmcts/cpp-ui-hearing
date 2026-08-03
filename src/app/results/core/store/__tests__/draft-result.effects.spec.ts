import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, provideStore, provideState, Store } from '@ngrx/store';
import { cold, hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';
import { DraftResultPrompt } from '../../../../results/results.interfaces';
import { UserDetails, reducers } from '../../../../core';
import { DraftResultBuilderService } from '../../services/draft-result-builder.service';
import { ReusableInfoService } from '../../services/reusable-info.service';
import { ResultsService } from '../../services/results.service';
import { createDraftResult, createDraftResultPromptsForShortcode } from '../../testing';
import { DraftResultActions } from '../draft-result.actions';
import { DraftResultEffects } from '../draft-result.effects';
import { resultsReducer } from '../index';
import { UsersGroupsState } from '@cpp/users-groups';
import { ResultsValidationService } from '../../services/results-validation.service';
import { ResultsValidationActions } from '../results-validation.actions';
import { ResultsValidationResponse } from '../../../results-validation.interfaces';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { hasResultingAssistant } from '../../../../core/selectors/user-groups';

jest.mock('../../services/draft-result-builder.service');
jest.mock('../../services/results.service');
jest.mock('../../services/reusable-info.service');
jest.mock('../../services/results-validation.service');
jest.mock('../../helpers/results-validation');

describe('DraftResultEffects', () => {
  let actions$: Observable<Action>;
  let draftResultBuilderService: DraftResultBuilderService;
  let effects: DraftResultEffects;
  let resultsService: ResultsService;
  let reusableInfoService: ReusableInfoService;
  let resultsValidationService: ResultsValidationService;
  let router: Router;

  const draftResult = createDraftResult();
  const successAction = DraftResultActions.saveDraftResult({ draftResult });
  const userDetails: UserDetails = {
    userId: 'userId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: '1@1.com'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
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
            } as UsersGroupsState['usersGroups']
          }
        }),
        provideRouter([]),
        provideState('results', resultsReducer, {
          initialState: {
            draftResult
          }
        }),
        DraftResultEffects,
        DraftResultBuilderService,
        ResultsService,
        ReusableInfoService,
        ResultsValidationService,
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            navigateByUrl: jest.fn()
          }
        },
        provideMockActions(() => actions$)
      ],
      teardown: { destroyAfterEach: false }
    });

    actions$ = TestBed.inject(Actions);
    draftResultBuilderService = TestBed.inject(DraftResultBuilderService);
    effects = TestBed.inject(DraftResultEffects);
    resultsService = TestBed.inject(ResultsService);
    reusableInfoService = TestBed.inject(ReusableInfoService);
    resultsValidationService = TestBed.inject(ResultsValidationService);
    router = TestBed.inject(Router);
  });

  describe('draft result actions', () => {
    it('should process actions in series', () => {
      const action = DraftResultActions.parseNotepadItems({
        items: [
          {
            applicationId: '*',
            orderedDate: '*',
            originalText: '*'
          }
        ]
      });

      actions$ = hot('        -aa-----', { a: action });
      const response$ = cold(' ---(r|)', { r: draftResult });
      const expected$ = cold('----b--b', { b: successAction });
      draftResultBuilderService.parseResultDefinitions = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.addChildToDraftResultLine', () => {
    const requestAction = DraftResultActions.addChildToDraftResultLine({
      options: {
        belongsToResultLineId: 'resultLineId',
        orderedDate: '2020-01-01',
        shortCode: 'PAYT'
      }
    });

    it('should add a child result definition to the draft result', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.addChildResultDefinition = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.addChildResultDefinition).toHaveBeenCalledWith(
        draftResult,
        userDetails,
        {
          belongsToResultLineId: 'resultLineId',
          orderedDate: '2020-01-01',
          shortCode: 'PAYT'
        }
      );
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.addChildResultDefinition = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.copyDraftResultLines', () => {
    const requestAction = DraftResultActions.copyDraftResultLines({
      copyTargets: [
        {
          originalResultLineId: 'resultLineId',
          offenceId: '*',
          defendantId: 'defendantId',
          masterDefendantId: '*',
          caseId: '*'
        }
      ]
    });

    it('should copy the identified result lines to new targets', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.copyResultLines = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.copyResultLines).toHaveBeenCalledWith(
        draftResult,
        userDetails,
        [
          {
            originalResultLineId: 'resultLineId',
            offenceId: '*',
            defendantId: 'defendantId',
            masterDefendantId: '*',
            caseId: '*'
          }
        ]
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/manage',
        draftResult.hearingId,
        'enter-results'
      ]);
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.copyResultLines = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.destroyDraftResultLine', () => {
    const requestAction = DraftResultActions.destroyDraftResultLine({
      resultLineId: 'resultLineId'
    });

    it('should destroy the identified result line', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.destroyResultLine = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.destroyResultLine).toHaveBeenCalledWith(
        draftResult,
        userDetails,
        'resultLineId'
      );
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.destroyResultLine = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.destroyDraftResultLinePart', () => {
    const requestAction = DraftResultActions.destroyDraftResultLinePart({
      resultLineId: 'resultLineId',
      partIndex: 0
    });

    it('should destroy the identified result line part', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.destroyPart = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.destroyPart).toHaveBeenCalledWith(draftResult, userDetails, {
        resultLineId: 'resultLineId',
        partIndex: 0
      });
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.destroyPart = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.parseNotepadItems', () => {
    const requestAction = DraftResultActions.parseNotepadItems({
      items: [
        {
          applicationId: 'applicationId',
          orderedDate: '2020-01-01',
          originalText: 'NCOSTS'
        }
      ]
    });

    it('should parse the notepad items', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.parseResultDefinitions = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.parseResultDefinitions).toHaveBeenCalledWith(
        draftResult,
        userDetails,
        [
          {
            applicationId: 'applicationId',
            orderedDate: '2020-01-01',
            originalText: 'NCOSTS'
          }
        ]
      );
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.parseResultDefinitions = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.replaceDraftResultLine', () => {
    const requestAction = DraftResultActions.replaceDraftResultLine({
      options: {
        resultLineId: 'resultLineId',
        originalText: '*',
        orderedDate: '2020-01-01'
      }
    });

    it('should replace the identified result line with the the parsed result', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.replaceResultLine = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.replaceResultLine).toHaveBeenCalledWith(
        draftResult,
        userDetails,
        {
          resultLineId: 'resultLineId',
          originalText: '*',
          orderedDate: '2020-01-01'
        }
      );
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.replaceResultLine = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.resolveDraftResultLinePart', () => {
    const requestAction = DraftResultActions.resolveDraftResultLinePart({
      resultLineId: 'resultLineId',
      partIndex: 0,
      choice: {} as DraftResultPrompt
    });

    it('should resolve an unresolved part', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.resolvePart = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.resolvePart).toHaveBeenCalledWith(draftResult, userDetails, {
        resultLineId: 'resultLineId',
        partIndex: 0,
        choice: {}
      });
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.resolvePart = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.setConditionalMandatory', () => {
    const requestAction = DraftResultActions.setConditionalMandatory({
      resultLineId: 'resultLineId',
      selected: true
    });

    it('should toggle a conditional mandatory child', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.toggleConditionalMandatoryChild = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.toggleConditionalMandatoryChild).toHaveBeenCalledWith(
        draftResult,
        userDetails,
        {
          resultLineId: 'resultLineId',
          selected: true
        }
      );
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.toggleConditionalMandatoryChild = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('DraftResultActions.setAmendmentReason', () => {
    const requestAction = DraftResultActions.setAmendmentReason({
      resultLineId: 'resultLineId',
      amendmentReason: { id: 'amendmentReasonId' },
      amendmentDate: new Date(2020, 0, 1).toISOString()
    });

    it('should set the amendment reason', () => {
      actions$ = hot('        -a-', { a: requestAction });
      const expected$ = cold('-b-', { b: successAction });
      draftResultBuilderService.setAmendmentReason = jest.fn(() => draftResult);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.setAmendmentReason).toHaveBeenCalledWith(draftResult, {
        resultLineId: 'resultLineId',
        amendmentReason: { id: 'amendmentReasonId' },
        amendmentDate: new Date(2020, 0, 1).toISOString(),
        userDetails
      });
    });
  });

  describe('DraftResultActions.setDelegatedPowers', () => {
    const requestAction = DraftResultActions.setDelegatedPowers({
      amendmentReason: { id: 'amendmentReasonId' },
      amendmentDate: new Date(2020, 0, 1).toISOString(),
      delegatedPowers: true
    });

    it('should set the delegated powers', () => {
      actions$ = hot('        -a-', { a: requestAction });
      const expected$ = cold('-b-', { b: successAction });
      draftResultBuilderService.setDelegatedPowers = jest.fn(() => draftResult);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.setDelegatedPowers).toHaveBeenCalledWith(draftResult, {
        amendmentReason: { id: 'amendmentReasonId' },
        amendmentDate: new Date(2020, 0, 1).toISOString(),
        delegatedPowers: true,
        userDetails
      });
    });
  });

  describe('DraftResultActions.setShadowListedOffenceIds', () => {
    const requestAction = DraftResultActions.setShadowListedOffenceIds({
      offenceIds: ['offenceId']
    });

    it('should set the shadow listed offence ids', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const expected$ = cold('-b---', { b: successAction });
      draftResultBuilderService.setShadowListedOffenceIds = jest.fn(() => draftResult);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.setShadowListedOffenceIds).toHaveBeenCalledWith(
        draftResult,
        ['offenceId']
      );
    });
  });

  describe('DraftResultActions.updateResultPromptsForDraftResultLine', () => {
    const resultPrompts = createDraftResultPromptsForShortcode('NCOSTS');
    const requestAction = DraftResultActions.updateResultPromptsForDraftResultLine({
      resultLineId: 'resultLineId',
      redirectTo: ['/test'],
      resultPrompts
    });

    it('should update the results prompts for a result line', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: draftResult });
      const expected$ = cold('--b---', { b: successAction });
      draftResultBuilderService.updateResultPrompts = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
      expect(draftResultBuilderService.updateResultPrompts).toHaveBeenCalledWith(draftResult, {
        resultLineId: 'resultLineId',
        resultPrompts
      });
      expect(router.navigate).toHaveBeenCalledWith(['/test']);
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, new Error('Something has gone wrong!'));
      const expected$ = cold('--b---', { b: errorAction });
      draftResultBuilderService.updateResultPrompts = jest.fn(() => response$);

      expect(effects.draftResultEvents$).toBeObservable(expected$);
    });
  });

  describe('validate$', () => {
    const validResponse: ResultsValidationResponse = {
      validationId: 'v1',
      timestamp: '2024-01-01T00:00:00Z',
      mode: 'STRICT',
      rulesEvaluated: [],
      isValid: true,
      errors: { errorMessages: [], validationIssues: [] },
      warnings: [],
      processingTimeMs: 10
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should dispatch validateResultsSuccess and navigate when navigateOnSuccess is true and response is valid', () => {
      const requestAction = ResultsValidationActions.validateResults({ navigateOnSuccess: true });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: validResponse });
      const expected$ = cold('--b---', {
        b: ResultsValidationActions.validateResultsSuccess({ response: validResponse })
      });
      resultsValidationService.validate = jest.fn(() => response$);

      expect(effects.validate$).toBeObservable(expected$);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/manage/hearingId');
    });

    it('should dispatch validateResultsSuccess without navigating when navigateOnSuccess is false', () => {
      const requestAction = ResultsValidationActions.validateResults({ navigateOnSuccess: false });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: validResponse });
      const expected$ = cold('--b---', {
        b: ResultsValidationActions.validateResultsSuccess({ response: validResponse })
      });
      resultsValidationService.validate = jest.fn(() => response$);

      expect(effects.validate$).toBeObservable(expected$);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should dispatch clearValidationResults and navigate on service error when navigateOnSuccess is true', () => {
      const requestAction = ResultsValidationActions.validateResults({ navigateOnSuccess: true });
      const error = new Error('API error');

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, error);
      const expected$ = cold('--b---', {
        b: ResultsValidationActions.clearValidationResults()
      });
      resultsValidationService.validate = jest.fn(() => response$);

      expect(effects.validate$).toBeObservable(expected$);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/manage/hearingId');
    });

    it('should dispatch clearValidationResults without navigating on service error when navigateOnSuccess is false', () => {
      const requestAction = ResultsValidationActions.validateResults({ navigateOnSuccess: false });
      const error = new Error('API error');

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, error);
      const expected$ = cold('--b---', {
        b: ResultsValidationActions.clearValidationResults()
      });
      resultsValidationService.validate = jest.fn(() => response$);

      expect(effects.validate$).toBeObservable(expected$);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not invoke the validator when draftResult is null', () => {
      const store = TestBed.inject(Store);
      store.dispatch(DraftResultActions.setDraftResult({ draftResult: null }));
      resultsValidationService.validate = jest.fn();
      const requestAction = ResultsValidationActions.validateResults({ navigateOnSuccess: true });

      actions$ = hot('-a---', { a: requestAction });
      expect(effects.validate$).toBeObservable(cold('-----'));
      expect(resultsValidationService.validate).not.toHaveBeenCalled();
    });
  });

  describe('validateOnDraftResultLoad$', () => {
    it('should not emit when draftResult is null', () => {
      actions$ = hot('-a---', { a: DraftResultActions.setDraftResult({ draftResult: null }) });
      expect(effects.validateOnDraftResultLoad$).toBeObservable(cold('-----'));
    });

    it('should not emit when hasResultingAssistant is false', () => {
      actions$ = hot('-a---', { a: DraftResultActions.setDraftResult({ draftResult }) });
      expect(effects.validateOnDraftResultLoad$).toBeObservable(cold('-----'));
    });
  });

  describe('DraftResultActions.saveDraftResult', () => {
    const requestAction = DraftResultActions.saveDraftResult({ draftResult });

    it('should update the results prompts for a result line', () => {
      actions$ = hot('                -a------', { a: requestAction });
      const cacheDraftResult$ = cold(' --(r|) ');
      const saveDraftResult$ = cold('  ---(r|)');
      const expected$ = cold('        ----b   ', {
        b: DraftResultActions.saveDraftResultSuccess({ draftResult })
      });

      reusableInfoService.cacheValuesFromDraftResult = jest.fn(() => cacheDraftResult$);
      resultsService.saveDraftResult = jest.fn(() => saveDraftResult$);

      expect(effects.saveDraftResult$).toBeObservable(expected$);
      expect(reusableInfoService.cacheValuesFromDraftResult).toHaveBeenCalledWith(draftResult);
      expect(resultsService.saveDraftResult).toHaveBeenCalledWith(draftResult, undefined);
    });

    it('should handle an error', () => {
      const errorAction = DraftResultActions.setDraftResultError({
        action: requestAction,
        error: 'Something has gone wrong!'
      });

      actions$ = hot('                -a--', { a: requestAction });
      const cacheDraftResult$ = cold(' -# ', undefined, new Error('Something has gone wrong!'));
      const saveDraftResult$ = cold('  ---');
      const expected$ = cold('        --b-', { b: errorAction });

      reusableInfoService.cacheValuesFromDraftResult = jest.fn(() => cacheDraftResult$);
      resultsService.saveDraftResult = jest.fn(() => saveDraftResult$);

      expect(effects.saveDraftResult$).toBeObservable(expected$);
    });
  });
});

describe('DraftResultEffects validateOnDraftResultLoad$ (hasResultingAssistant enabled)', () => {
  let actions$: Observable<Action>;
  let effects: DraftResultEffects;
  let store: MockStore;
  const draftResult = createDraftResult();

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideMockStore(),
        provideRouter([]),
        DraftResultEffects,
        DraftResultBuilderService,
        ResultsService,
        ReusableInfoService,
        ResultsValidationService,
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn() }
        },
        provideMockActions(() => actions$)
      ]
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(hasResultingAssistant, true);
    effects = TestBed.inject(DraftResultEffects);
  });

  it('should dispatch validateResults with navigateOnSuccess false when setDraftResult fires with a non-null draftResult', () => {
    const requestAction = DraftResultActions.setDraftResult({ draftResult });
    const expectedAction = ResultsValidationActions.validateResults({ navigateOnSuccess: false });

    actions$ = hot('-a---', { a: requestAction });
    expect(effects.validateOnDraftResultLoad$).toBeObservable(cold('-b---', { b: expectedAction }));
  });
});
