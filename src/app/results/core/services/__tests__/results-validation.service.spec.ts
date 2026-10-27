import { TestBed } from '@angular/core/testing';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import {
  ResultsValidation,
  ResultsValidationResponse,
  ValidationIssueSeverityEnum
} from '../../../results-validation.interfaces';
import { ResultsValidationService } from '../results-validation.service';

describe('ResultsValidationService', () => {
  let service: ResultsValidationService;
  let cppHttp: CppHttp;

  const request: ResultsValidation = {
    hearingId: 'hearingId',
    hearingDay: '2020-01-01',
    courtType: 'MAGISTRATES',
    resultLines: [
      {
        resultLineId: 'rl-1',
        shortCode: 'IMP',
        label: 'Imprisonment',
        defendantId: 'def-1',
        offenceId: 'off-1'
      }
    ],
    defendants: [{ defendantId: 'def-1', firstName: 'Alice', lastName: 'Smith' }],
    offences: [{ offenceId: 'off-1', offenceCode: 'OC1', offenceTitle: 'Some offence' }]
  };

  const response: ResultsValidationResponse = {
    validationId: 'v1',
    timestamp: '2020-01-01T00:00:00Z',
    mode: 'STRICT',
    rulesEvaluated: ['rule-1'],
    isValid: false,
    errors: {
      errorMessages: [],
      validationIssues: [
        {
          ruleId: 'rule-1',
          severity: ValidationIssueSeverityEnum.ERROR,
          message: 'Conflict between concurrent and consecutive',
          affectedOffences: [{ offenceId: 'off-1', offenceTitle: 'Some offence' }]
        }
      ]
    },
    warnings: [],
    processingTimeMs: 12
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideCppCoreHttpServices(), CppHttp, ResultsValidationService],
      teardown: { destroyAfterEach: false }
    });
    service = TestBed.inject(ResultsValidationService);
    cppHttp = TestBed.inject(CppHttp);
  });

  describe('validate', () => {
    it('should POST the request to the validator endpoint and emit the parsed response', () => {
      const command$ = cold('--(r|)', { r: { body: JSON.stringify(response) } });
      const expected$ = cold('--(r|)', { r: response });
      cppHttp.command = jest.fn(() => command$);

      expect(service.validate(request)).toBeObservable(expected$);
      expect(cppHttp.command).toHaveBeenCalledWith({
        url: '/results-validator/api/validation/validate',
        body: request,
        requestType: 'application/json'
      });
    });

    it('should propagate errors from the underlying http command', () => {
      const command$ = cold('--#', undefined, new Error('API error'));
      const expected$ = cold('--#', undefined, new Error('API error'));
      cppHttp.command = jest.fn(() => command$);

      expect(service.validate(request)).toBeObservable(expected$);
    });
  });
});
