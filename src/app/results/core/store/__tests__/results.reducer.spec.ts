import { PromptEntry, ResolvedDraftResultLine } from 'src/app/results/results.interfaces';
import {
  ResultsValidationErrors,
  ResultsValidationResponse,
  ValidationIssueSeverityEnum
} from '../../../results-validation.interfaces';
import { createDraftResult } from '../../testing';
import { DraftResultActions } from '../draft-result.actions';
import { ResultsValidationActions } from '../results-validation.actions';
import { ShareResultsActions } from '../share-results.actions';
import { initialState, results as reducer } from '../results.reducer';

describe('ResultsReducer', () => {
  const draftResult = createDraftResult();
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

  describe('undefined action', () => {
    it('should return the default state', () => {
      const action = {} as any;
      const result = reducer(undefined, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResultError": null,
          "draftResultSaving": false,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.saveDraftResult', () => {
    it('should set the draft result', () => {
      const action = DraftResultActions.saveDraftResult({ draftResult });
      const result = reducer({ ...initialState, draftResultError: { error: '*', action } }, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResult": {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [],
            "resultLines": {},
            "shadowListedOffenceIds": [],
            "version": 2,
          },
          "draftResultError": null,
          "draftResultSaving": true,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.saveDraftResultSuccess', () => {
    it('should update the saving status', () => {
      const action = DraftResultActions.saveDraftResultSuccess({ draftResult });
      const result = reducer({ ...initialState, draftResultSaving: true }, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResultError": null,
          "draftResultSaving": false,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.setDraftResult', () => {
    it('should set the draft result', () => {
      const action = DraftResultActions.setDraftResult({ draftResult });
      const result = reducer(initialState, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResult": {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [],
            "resultLines": {},
            "shadowListedOffenceIds": [],
            "version": 1,
          },
          "draftResultError": null,
          "draftResultSaving": false,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.setDraftResultError', () => {
    it('should set the draft result error', () => {
      const action = DraftResultActions.setDraftResultError({
        error: '*',
        action: DraftResultActions.saveDraftResultSuccess({ draftResult })
      });
      const result = reducer({ ...initialState, draftResultSaving: true }, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResultError": {
            "action": {
              "draftResult": {
                "hearingDay": "2020-01-01",
                "hearingId": "hearingId",
                "relations": [],
                "resultLines": {},
                "shadowListedOffenceIds": [],
                "version": 1,
              },
              "type": "SAVE_DRAFT_RESULT_SUCCESS",
            },
            "error": "*",
          },
          "draftResultSaving": false,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.setDraftResultLineErrors', () => {
    it('should set the invalid result lines', () => {
      const action = DraftResultActions.setDraftResultLineErrors({ invalidResultLines });
      const result = reducer({ ...initialState, draftResultSaving: false }, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResultError": null,
          "draftResultSaving": false,
          "invalidResultLines": [
            {
              "caseId": "caseId",
              "defendantId": "defendantId",
              "label": "Case-Defendant level result",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "orderedDate": "2024-05-02",
              "originalText": "CASEDEFENDANT",
              "resultDefinitionId": "resultDefinitionId",
              "resultLevel": "C",
              "resultLineId": "resultLineId",
              "resultPrompts": [],
              "shortCode": "casedefendant",
              "unresolvedParts": [],
              "valid": false,
            },
          ],
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.clearDraftResultLineErrors', () => {
    it('should clear the invalid result lines', () => {
      const action = DraftResultActions.setDraftResultLineErrors({ invalidResultLines });
      let result = reducer({ ...initialState, draftResultSaving: false }, action);

      const action2 = DraftResultActions.clearDraftResultLineErrors();
      result = reducer({ ...initialState, draftResultSaving: false }, action2);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResultError": null,
          "draftResultSaving": false,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": null,
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('DraftResultActions.setReusableInfoSuccess', () => {
    it('should update the reusable info', () => {
      const mockData = [
        {
          type: 'NAMEADDRESS',
          cacheDataPath:
            'respondents[0].prosecutingAuthority.name; applicant.prosecutingAuthority.name',
          cacheable: 2,
          applicationId: '256624f5-b70e-4211-8907-085a1a3e08d6',
          promptRef: 'prosecutortobenotified',
          value: {
            prosecutortobenotifiedOrganisationName: 'Derbyshire Police',
            prosecutortobenotifiedAddress1: 'Criminal Justice Department',
            prosecutortobenotifiedAddress2: 'Derbyshire Constabulary',
            prosecutortobenotifiedAddress3: 'Butterley Hall',
            prosecutortobenotifiedAddress4: 'Ripley',
            prosecutortobenotifiedAddress5: 'Derby',
            prosecutortobenotifiedPostCode: 'DE5 3RS',
            prosecutortobenotifiedEmailAddress1: 'criminaldataderbyshire@derbyshire.police.uk',
            prosecutortobenotifiedEmailAddress2: 'criminaldataderbyshire@derbyshire.police.uk'
          }
        }
      ] as PromptEntry[];
      const action = DraftResultActions.setReusableInfoSuccess({ reusableResults: mockData });
      const result = reducer({ ...initialState, reusableResults: mockData }, action);

      expect(result).toMatchInlineSnapshot(`
        {
          "draftResultError": null,
          "draftResultSaving": false,
          "invalidResultLines": null,
          "manageHearingError": null,
          "resultsValidation": null,
          "reusableResults": [
            {
              "applicationId": "256624f5-b70e-4211-8907-085a1a3e08d6",
              "cacheDataPath": "respondents[0].prosecutingAuthority.name; applicant.prosecutingAuthority.name",
              "cacheable": 2,
              "promptRef": "prosecutortobenotified",
              "type": "NAMEADDRESS",
              "value": {
                "prosecutortobenotifiedAddress1": "Criminal Justice Department",
                "prosecutortobenotifiedAddress2": "Derbyshire Constabulary",
                "prosecutortobenotifiedAddress3": "Butterley Hall",
                "prosecutortobenotifiedAddress4": "Ripley",
                "prosecutortobenotifiedAddress5": "Derby",
                "prosecutortobenotifiedEmailAddress1": "criminaldataderbyshire@derbyshire.police.uk",
                "prosecutortobenotifiedEmailAddress2": "criminaldataderbyshire@derbyshire.police.uk",
                "prosecutortobenotifiedOrganisationName": "Derbyshire Police",
                "prosecutortobenotifiedPostCode": "DE5 3RS",
              },
            },
          ],
          "shareResultsValidationFailure": null,
        }
      `);
    });
  });

  describe('ShareResultsActions.shareDraftResultValidationFailed', () => {
    const validationErrors: ResultsValidationErrors = {
      errorMessages: ['A custody time limit result is required'],
      validationIssues: [
        {
          ruleId: 'CTL-001',
          severity: ValidationIssueSeverityEnum.ERROR,
          validationLevel: 'OFFENCE',
          message: 'A custody time limit result is required',
          affectedOffences: [
            { offenceId: 'offenceId', message: 'A custody time limit result is required' }
          ]
        }
      ]
    };

    it('should store the share results validation failure on state', () => {
      const result = reducer(
        { ...initialState, draftResult },
        ShareResultsActions.shareDraftResultValidationFailed({ validationErrors })
      );

      expect(result.shareResultsValidationFailure).toEqual(validationErrors);
      expect(result.draftResultSaving).toBe(false);
    });

    it('should clear a previously stored share results validation failure when the share is re-attempted', () => {
      const populated = reducer(
        { ...initialState, draftResult },
        ShareResultsActions.shareDraftResultValidationFailed({ validationErrors })
      );

      const result = reducer(populated, ShareResultsActions.shareDraftResult());

      expect(result.shareResultsValidationFailure).toBeNull();
      expect(result.manageHearingError).toBeNull();
    });
  });

  describe('ResultsValidationActions.validateResultsSuccess', () => {
    it('should store the validation response on state', () => {
      const response: ResultsValidationResponse = {
        validationId: 'v1',
        timestamp: '2020-01-01T00:00:00Z',
        mode: 'STRICT',
        rulesEvaluated: ['DR-SENT-001'],
        isValid: false,
        errors: {
          errorMessages: [],
          validationIssues: [
            {
              ruleId: 'DR-SENT-001',
              severity: ValidationIssueSeverityEnum.ERROR,
              message: 'Concurrent/consecutive conflict',
              affectedOffences: [{ offenceId: 'off-1' }]
            }
          ]
        },
        warnings: [],
        processingTimeMs: 12
      };
      const action = ResultsValidationActions.validateResultsSuccess({ response });
      const result = reducer(initialState, action);

      expect(result.resultsValidation).toBe(response);
    });
  });

  describe('ResultsValidationActions.clearValidationResults', () => {
    it('should clear the stored validation response from state', () => {
      const response: ResultsValidationResponse = {
        validationId: 'v1',
        timestamp: '2020-01-01T00:00:00Z',
        mode: 'STRICT',
        rulesEvaluated: [],
        isValid: true,
        errors: { errorMessages: [], validationIssues: [] },
        warnings: [],
        processingTimeMs: 0
      };
      const populated = reducer(
        initialState,
        ResultsValidationActions.validateResultsSuccess({ response })
      );

      const result = reducer(populated, ResultsValidationActions.clearValidationResults());

      expect(result.resultsValidation).toBeNull();
    });
  });
});
