import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { ReferenceDataService, ReusableInfoDefinitions } from '@cpp/reference-data';
import { cold } from 'jasmine-marbles';
import { find } from 'lodash-es';
import { of } from 'rxjs';
import { DraftResultPrompt } from '../../../../../app/results/results.interfaces';
import {
  createDraftResultPrompt,
  DraftResultBuilder,
  getParsedResultDefinitionByShortCode
} from '../../testing';
import { ReusableInfoLocalCacheService } from '../reusable-info-local-cache.service';
import { reducers, AppState } from 'src/app/core';
import { provideCppCoreHttpServices } from '@cpp/core';

describe('ReusableInfoLocalCacheService', () => {
  let localCacheService: ReusableInfoLocalCacheService;
  let draftResultBuilder: DraftResultBuilder;
  let referenceDataService: ReferenceDataService;

  const today = new Date(2020, 0, 1).getTime();
  const tomorrow = new Date(2020, 0, 2).getTime();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        provideStore(reducers, {
          initialState: {
            hearings: {
              current: {
                hearing: { id: 'hearingId' }
              }
            }
          } as AppState,
          runtimeChecks: {}
        }),
        provideRouter([]),
        ReusableInfoLocalCacheService,
        ReferenceDataService
      ],
      teardown: { destroyAfterEach: false }
    });
    draftResultBuilder = new DraftResultBuilder();
    localCacheService = TestBed.inject(ReusableInfoLocalCacheService);
    referenceDataService = TestBed.inject(ReferenceDataService);

    Date.now = () => today;
  });

  afterEach(() => {
    localStorage.removeItem('prompts-cache');
  });

  const reusableInfoDefinitions: ReusableInfoDefinitions = {
    reusablePromptDefinitions: [
      // locally cacheable
      {
        promptRef: 'earlyReleaseProvisionsApply',
        type: 'BOOLEAN',
        cacheable: 2
      },
      // locally cacheable – ONEOF child
      {
        promptRef: 'totalCustodialPeriod',
        type: 'DURATION',
        cacheable: 2
      },
      // remote read/write
      {
        promptRef: 'consecutiveToSentenceImposedOn',
        type: 'DATE',
        cacheable: 1
      },
      // remote read only
      {
        promptRef: 'reasonForSentenceWithoutPSR',
        type: 'BOOLEAN',
        cacheDataPath: '/',
        cacheable: 2
      }
    ],
    reusableResultDefinitions: []
  };

  const createResultPromptForPromptRef = (shortCode: string, promptRef: string) => {
    const { promptChoices } = getParsedResultDefinitionByShortCode(shortCode);
    const promptChoice = find(promptChoices, { promptRef });

    return createDraftResultPrompt(promptChoice);
  };

  describe('cacheValuesFromDraftResult', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId',
        masterDefendantId: 'masterDefendantId',
        defendantId: 'defendantId',
        offenceId: 'offenceId',
        originalText: 'TIMP',
        orderedDate: '2020-01-01'
      });
    });

    it('should cache a value when it exists in the reusable prompt definitions', async () => {
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: [
          createResultPromptForPromptRef('TIMP', 'earlyReleaseProvisionsApply'),
          createResultPromptForPromptRef('TIMP', 'consecutiveToSentenceImposedOn'),
          createResultPromptForPromptRef('TIMP', 'reasonForSentenceWithoutPSR')
        ]
      });

      const draftResult = draftResultBuilder.draftResult;
      const definitions$ = cold('--(r|)', { r: reusableInfoDefinitions });
      const expected$ = cold('   --(e|)', { e: undefined });

      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() => definitions$);

      expect(localCacheService.cacheValuesFromDraftResult(draftResult)).toBeObservable(expected$);
      expect(JSON.parse(localStorage.getItem('prompts-cache'))).toMatchInlineSnapshot(`
        [
          {
            "promptRef": "earlyReleaseProvisionsApply",
            "type": "BOOLEAN",
            "updatedAt": 1577836800000,
            "value": true,
          },
        ]
      `);
    });

    it('should cache a value that appears as a child of a ONEOF result prompt', async () => {
      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() =>
        of(reusableInfoDefinitions)
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: [
          {
            type: 'ONEOF',
            promptRef: 'totalCustodialPeriod',
            value: {
              promptRef: 'totalCustodialPeriod',
              type: 'DURATION',
              value: [{ label: 'MINUTES', value: 20 }]
            }
          } as DraftResultPrompt
        ]
      });
      await localCacheService
        .cacheValuesFromDraftResult(draftResultBuilder.draftResult)
        .toPromise();

      expect(JSON.parse(localStorage.getItem('prompts-cache'))).toMatchInlineSnapshot(`
        [
          {
            "promptRef": "totalCustodialPeriod",
            "type": "DURATION",
            "updatedAt": 1577836800000,
            "value": [
              {
                "label": "MINUTES",
                "value": 20,
              },
            ],
          },
        ]
      `);
    });

    it('should replace a prompt with its newer version', async () => {
      localStorage.setItem(
        'prompts-cache',
        JSON.stringify([
          {
            promptRef: 'earlyReleaseProvisionsApply',
            type: 'BOOLEAN',
            updatedAt: today,
            value: false
          },
          {
            promptRef: 'totalCustodialPeriod',
            type: 'DURATION',
            updatedAt: today,
            value: [
              {
                label: 'MINUTES',
                value: 20
              }
            ]
          }
        ])
      );
      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() =>
        of(reusableInfoDefinitions)
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: [createResultPromptForPromptRef('TIMP', 'earlyReleaseProvisionsApply')]
      });
      await localCacheService
        .cacheValuesFromDraftResult(draftResultBuilder.draftResult)
        .toPromise();

      expect(JSON.parse(localStorage.getItem('prompts-cache'))).toMatchInlineSnapshot(`
        [
          {
            "promptRef": "totalCustodialPeriod",
            "type": "DURATION",
            "updatedAt": 1577836800000,
            "value": [
              {
                "label": "MINUTES",
                "value": 20,
              },
            ],
          },
          {
            "promptRef": "earlyReleaseProvisionsApply",
            "type": "BOOLEAN",
            "updatedAt": 1577836800000,
            "value": true,
          },
        ]
      `);
    });

    it('should handle a draft result with no cacheable prompts', async () => {
      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() =>
        of(reusableInfoDefinitions)
      );

      await localCacheService
        .cacheValuesFromDraftResult(draftResultBuilder.draftResult)
        .toPromise();

      expect(JSON.parse(localStorage.getItem('prompts-cache'))).toMatchInlineSnapshot(`[]`);
    });
  });

  describe('getCachedValue', () => {
    beforeEach(() => {
      localStorage.setItem(
        'prompts-cache',
        JSON.stringify([
          {
            promptRef: 'totalCustodialPeriod',
            type: 'DURATION',
            updatedAt: today,
            value: [{ label: 'MINUTES', value: 20 }]
          }
        ])
      );
      Date.now = () => today;
    });

    it('should fetch the value for a cached prompt', () => {
      const cachedValue = localCacheService.getCachedValue({
        promptRef: 'totalCustodialPeriod',
        type: 'DURATION'
      });

      expect(cachedValue).toEqual({
        promptRef: 'totalCustodialPeriod',
        type: 'DURATION',
        updatedAt: today,
        value: [{ label: 'MINUTES', value: 20 }]
      });
    });

    it('should ignore any value that was not cached on the same calendar day', () => {
      Date.now = () => tomorrow;

      const cachedValue = localCacheService.getCachedValue({
        promptRef: 'totalCustodialPeriod',
        type: 'DURATION'
      });

      expect(cachedValue).toBeUndefined();
    });
  });
});
