import { HearingDetail } from '../../../../core';
import {
  ResultsValidationResponse,
  ValidationIssue,
  ValidationIssueSeverityEnum
} from '../../../results-validation.interfaces';
import {
  getDefendantLevelWarningMessages,
  getOffenceLevelWarningMessages,
  getHasResultsValidationErrors,
  getResultsValidation,
  getResultsValidationErrorMessagesByOffenceId,
  getResultsValidationErrorOffenceIds,
  getResultsValidationErrors,
  getResultsValidationSummaryErrors,
  getResultsValidationWarnings,
  ResultsState
} from '..';

const buildMagistratesHearing = (offences: { id: string; orderIndex: number }[]): HearingDetail =>
  ({
    jurisdictionType: 'MAGISTRATES',
    prosecutionCases: [
      {
        id: 'case-1',
        defendants: [
          {
            id: 'def-1',
            masterDefendantId: 'master-1',
            personDefendant: {
              personDetails: {
                firstName: 'Alice',
                lastName: 'Smith',
                dateOfBirth: '1990/01/01'
              }
            },
            offences: offences.map(o => ({
              ...o,
              offenceCode: 'CODE',
              offenceTitle: `Offence ${o.id}`
            }))
          }
        ]
      }
    ],
    courtApplications: []
  } as HearingDetail);

const buildResponse = (
  overrides: Partial<ResultsValidationResponse> = {}
): ResultsValidationResponse => ({
  validationId: 'v1',
  timestamp: '2020-01-01T00:00:00Z',
  mode: 'STRICT',
  rulesEvaluated: [],
  isValid: true,
  errors: { errorMessages: [], validationIssues: [] },
  warnings: [],
  processingTimeMs: 0,
  ...overrides
});

const buildState = (resultsValidation: ResultsValidationResponse | null): ResultsState =>
  ({ results: { resultsValidation } } as unknown as ResultsState);

describe('Results validation selectors', () => {
  describe('getResultsValidation', () => {
    it('should return the resultsValidation slice from state', () => {
      const response = buildResponse();
      expect(getResultsValidation(buildState(response))).toBe(response);
    });

    it('should return null when no validation has run', () => {
      expect(getResultsValidation(buildState(null))).toBeNull();
    });
  });

  describe('getResultsValidationErrors', () => {
    it('should return an empty array when resultsValidation is null', () => {
      expect(getResultsValidationErrors.projector(null)).toEqual([]);
    });

    it('should return an empty array when errors is missing', () => {
      expect(getResultsValidationErrors.projector(buildResponse({ errors: undefined }))).toEqual(
        []
      );
    });

    it('should return the validation issues from the response', () => {
      const validationIssues: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-001',
          severity: ValidationIssueSeverityEnum.ERROR,
          message: 'boom'
        }
      ];
      expect(
        getResultsValidationErrors.projector(
          buildResponse({ errors: { errorMessages: [], validationIssues } })
        )
      ).toBe(validationIssues);
    });
  });

  describe('getHasResultsValidationErrors', () => {
    it('should return false when there are no errors', () => {
      expect(getHasResultsValidationErrors.projector([])).toBe(false);
    });

    it('should return true when there is at least one error', () => {
      expect(
        getHasResultsValidationErrors.projector([
          { ruleId: 'DR-SENT-001', severity: ValidationIssueSeverityEnum.ERROR }
        ])
      ).toBe(true);
    });
  });

  describe('getResultsValidationErrorOffenceIds', () => {
    it('should return an empty array when there are no errors', () => {
      expect(getResultsValidationErrorOffenceIds.projector([])).toEqual([]);
    });

    it('should flatten offence ids across all errors', () => {
      const errors: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-001',
          affectedOffences: [{ offenceId: 'off-1' }, { offenceId: 'off-2' }]
        },
        { ruleId: 'DR-SENT-002', affectedOffences: [{ offenceId: 'off-3' }] }
      ];
      expect(getResultsValidationErrorOffenceIds.projector(errors)).toEqual([
        'off-1',
        'off-2',
        'off-3'
      ]);
    });

    it('should skip errors that have no affected offences', () => {
      const errors: ValidationIssue[] = [
        { ruleId: 'DR-SENT-001' },
        { ruleId: 'DR-SENT-002', affectedOffences: [{ offenceId: 'off-1' }] }
      ];
      expect(getResultsValidationErrorOffenceIds.projector(errors)).toEqual(['off-1']);
    });
  });

  describe('getResultsValidationErrorMessagesByOffenceId', () => {
    it('should return an empty map when there are no errors', () => {
      expect(getResultsValidationErrorMessagesByOffenceId.projector([])).toEqual(new Map());
    });

    it('should index per-offence messages by offence id across all errors', () => {
      const errors: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          affectedOffences: [
            { offenceId: 'off-1', message: 'Alice Offence 1 do not include details…' },
            { offenceId: 'off-2', message: 'Alice Offence 2 do not include details…' }
          ]
        },
        {
          ruleId: 'DR-SENT-002',
          affectedOffences: [
            { offenceId: 'off-3', message: 'Bob Offence 3 do not include details…' }
          ]
        }
      ];
      const result = getResultsValidationErrorMessagesByOffenceId.projector(errors);
      expect(result.get('off-1')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'Alice Offence 1 do not include details…' }
      ]);
      expect(result.get('off-2')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'Alice Offence 2 do not include details…' }
      ]);
      expect(result.get('off-3')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'Bob Offence 3 do not include details…' }
      ]);
    });

    it('should aggregate multiple messages on the same offence into an array (no message loss)', () => {
      const errors: ValidationIssue[] = [
        {
          ruleId: 'DR-FOO-001',
          affectedOffences: [{ offenceId: 'off-1', message: 'First error' }]
        },
        {
          ruleId: 'DR-BAR-002',
          affectedOffences: [{ offenceId: 'off-1', message: 'Second error' }]
        }
      ];
      expect(getResultsValidationErrorMessagesByOffenceId.projector(errors).get('off-1')).toEqual([
        { ruleId: 'DR-FOO-001', message: 'First error' },
        { ruleId: 'DR-BAR-002', message: 'Second error' }
      ]);
    });

    it('should skip affected offences with no message', () => {
      const errors: ValidationIssue[] = [
        { ruleId: 'DR-SENT-002', affectedOffences: [{ offenceId: 'off-1' }] }
      ];
      expect(getResultsValidationErrorMessagesByOffenceId.projector(errors).size).toBe(0);
    });

    it('should skip issues with no ruleId (entry needs ruleId for the unique data-test-id)', () => {
      const errors: ValidationIssue[] = [
        { affectedOffences: [{ offenceId: 'off-1', message: 'untagged' }] }
      ];
      expect(getResultsValidationErrorMessagesByOffenceId.projector(errors).size).toBe(0);
    });
  });

  describe('getResultsValidationWarnings', () => {
    it('should return an empty array when resultsValidation is null', () => {
      expect(getResultsValidationWarnings.projector(null)).toEqual([]);
    });

    it('should return the warnings array from the response', () => {
      const warnings: ValidationIssue[] = [
        { ruleId: 'DR-SENT-002', severity: ValidationIssueSeverityEnum.WARNING }
      ];
      expect(getResultsValidationWarnings.projector(buildResponse({ warnings }))).toBe(warnings);
    });
  });

  describe('getOffenceLevelWarningMessages', () => {
    it('should return an empty map when there are no warnings', () => {
      expect(getOffenceLevelWarningMessages.projector([]).size).toBe(0);
    });

    it('should index every OFFENCE-level warning message by offence id (regardless of ruleId)', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-1', message: 'both C/C on off-1' }]
        },
        {
          ruleId: 'DR-CTL-001',
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-2', message: 'No CTL on off-2' }]
        }
      ];
      const result = getOffenceLevelWarningMessages.projector(warnings);
      expect(result.get('off-1')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'both C/C on off-1' }
      ]);
      expect(result.get('off-2')).toEqual([{ ruleId: 'DR-CTL-001', message: 'No CTL on off-2' }]);
    });

    it('should aggregate multiple messages on the same offence into an array (no message loss)', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-1', message: 'both C/C on off-1' }]
        },
        {
          ruleId: 'DR-CTL-001',
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-1', message: 'No CTL on off-1' }]
        }
      ];
      expect(getOffenceLevelWarningMessages.projector(warnings).get('off-1')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'both C/C on off-1' },
        { ruleId: 'DR-CTL-001', message: 'No CTL on off-1' }
      ]);
    });

    it('should ignore DEFENDANT-level warnings', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          validationLevel: 'DEFENDANT',
          affectedDefendants: [{ defendantId: 'd1', message: 'all C/C for Alice' }]
        }
      ];
      expect(getOffenceLevelWarningMessages.projector(warnings).size).toBe(0);
    });

    it('should skip affected offences with no message', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-1' }, { offenceId: 'off-2', message: 'msg-2' }]
        }
      ];
      const result = getOffenceLevelWarningMessages.projector(warnings);
      expect(result.has('off-1')).toBe(false);
      expect(result.get('off-2')).toEqual([{ ruleId: 'DR-SENT-002', message: 'msg-2' }]);
    });

    it('should skip warnings with no ruleId (entry needs ruleId for the unique data-test-id)', () => {
      const warnings: ValidationIssue[] = [
        {
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-1', message: 'untagged' }]
        }
      ];
      expect(getOffenceLevelWarningMessages.projector(warnings).size).toBe(0);
    });
  });

  describe('getDefendantLevelWarningMessages', () => {
    it('should return an empty map when there are no warnings', () => {
      expect(getDefendantLevelWarningMessages.projector([]).size).toBe(0);
    });

    it('should index every DEFENDANT-level warning message by defendant id (regardless of ruleId)', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          validationLevel: 'DEFENDANT',
          affectedDefendants: [
            { defendantId: 'd1', message: 'd1 all C/C, no primary' },
            { defendantId: 'd2', message: 'd2 all C/C, no primary' }
          ]
        }
      ];
      const result = getDefendantLevelWarningMessages.projector(warnings);
      expect(result.get('d1')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'd1 all C/C, no primary' }
      ]);
      expect(result.get('d2')).toEqual([
        { ruleId: 'DR-SENT-002', message: 'd2 all C/C, no primary' }
      ]);
    });

    it('should aggregate multiple messages on the same defendant into an array (no message loss)', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-FOO-001',
          validationLevel: 'DEFENDANT',
          affectedDefendants: [{ defendantId: 'd1', message: 'first' }]
        },
        {
          ruleId: 'DR-BAR-002',
          validationLevel: 'DEFENDANT',
          affectedDefendants: [{ defendantId: 'd1', message: 'second' }]
        }
      ];
      expect(getDefendantLevelWarningMessages.projector(warnings).get('d1')).toEqual([
        { ruleId: 'DR-FOO-001', message: 'first' },
        { ruleId: 'DR-BAR-002', message: 'second' }
      ]);
    });

    it('should ignore OFFENCE-level warnings', () => {
      const warnings: ValidationIssue[] = [
        {
          ruleId: 'DR-SENT-002',
          validationLevel: 'OFFENCE',
          affectedOffences: [{ offenceId: 'off-1', message: 'both C/C' }]
        }
      ];
      expect(getDefendantLevelWarningMessages.projector(warnings).size).toBe(0);
    });

    it('should skip warnings with no ruleId (entry needs ruleId for the unique data-test-id)', () => {
      const warnings: ValidationIssue[] = [
        {
          validationLevel: 'DEFENDANT',
          affectedDefendants: [{ defendantId: 'd1', message: 'untagged' }]
        }
      ];
      expect(getDefendantLevelWarningMessages.projector(warnings).size).toBe(0);
    });
  });

  describe('getResultsValidationSummaryErrors', () => {
    const emptyHearing = buildMagistratesHearing([]);

    it('should return an empty array when there are no error messages', () => {
      expect(getResultsValidationSummaryErrors.projector(buildResponse(), emptyHearing)).toEqual(
        []
      );
    });

    it('should return an empty array when resultsValidation is null', () => {
      expect(getResultsValidationSummaryErrors.projector(null, emptyHearing)).toEqual([]);
    });

    it('should target each summary link at the affected offence that appears first on the page', () => {
      // off-1 has the lower orderIndex so renders first in MAGISTRATES sort order,
      // even though off-2 comes first in the backend errors payload.
      const hearing = buildMagistratesHearing([
        { id: 'off-2', orderIndex: 2 },
        { id: 'off-1', orderIndex: 1 }
      ]);
      const response = buildResponse({
        errors: {
          errorMessages: ['summary message one', 'summary message two'],
          validationIssues: [
            { ruleId: 'DR-SENT-002', affectedOffences: [{ offenceId: 'off-2' }] },
            { ruleId: 'DR-SENT-002', affectedOffences: [{ offenceId: 'off-1' }] }
          ]
        }
      });
      expect(getResultsValidationSummaryErrors.projector(response, hearing)).toEqual([
        {
          id: 'results-validation-error-off-1',
          message: 'summary message one',
          shouldFocus: false
        },
        {
          id: 'results-validation-error-off-1',
          message: 'summary message two',
          shouldFocus: false
        }
      ]);
    });

    it('should fall back to a generated id when no affected offence is on the hearing', () => {
      const hearing = buildMagistratesHearing([{ id: 'other', orderIndex: 1 }]);
      const response = buildResponse({
        errors: { errorMessages: ['first', 'second'], validationIssues: [] }
      });
      const summaryErrors = getResultsValidationSummaryErrors.projector(response, hearing);
      expect(summaryErrors.map(e => e.id)).toEqual([
        'results-validation-error-0',
        'results-validation-error-1'
      ]);
    });
  });
});
