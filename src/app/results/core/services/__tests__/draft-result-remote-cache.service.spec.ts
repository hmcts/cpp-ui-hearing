import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { ReferenceDataService, ReusableInfoDefinitions } from '@cpp/reference-data';
import { cold } from 'jasmine-marbles';
import { find } from 'lodash-es';
import { DraftResultPrompt, ReusableInfo } from '../../../results.interfaces';
import {
  createDraftResultPrompt,
  createDraftResultPromptsForShortcode,
  DraftResultBuilder,
  getParsedResultDefinitionByShortCode
} from '../../testing';
import { ReusableInfoRemoteCacheService } from '../reusable-info-remote-cache.service';
import { FullNamePipe } from '../../../../../app/shared';
import { reducers, AppState } from 'src/app/core';

describe('ReusableInfoRemoteCacheService', () => {
  let cacheService: ReusableInfoRemoteCacheService;
  let cppHttp: CppHttp;
  let draftResultBuilder: DraftResultBuilder;
  let referenceDataService: ReferenceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
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
        provideCppCoreHttpServices(),
        CppHttp,
        ReusableInfoRemoteCacheService,
        ReferenceDataService,
        FullNamePipe
      ],
      teardown: { destroyAfterEach: false }
    });
    cacheService = TestBed.inject(ReusableInfoRemoteCacheService);
    cppHttp = TestBed.inject(CppHttp);
    draftResultBuilder = new DraftResultBuilder();
    referenceDataService = TestBed.inject(ReferenceDataService);
  });

  const reusableInfoDefinitions: ReusableInfoDefinitions = {
    reusablePromptDefinitions: [
      // locally cacheable
      {
        promptRef: 'earlyReleaseProvisionsApply',
        type: 'BOOLEAN',
        cacheable: 2
      },
      // remote read/write
      {
        promptRef: 'consecutiveToSentenceImposedOn',
        type: 'DATE',
        cacheable: 1
      },
      // remote read/write – ONEOF child
      {
        promptRef: 'totalCustodialPeriod',
        type: 'DURATION',
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
    reusableResultDefinitions: [{ shortCode: 'BAIC' }]
  };

  const createResultPromptForPromptRef = (shortCode: string, promptRef: string) => {
    const { promptChoices } = getParsedResultDefinitionByShortCode(shortCode);
    const promptChoice = find(promptChoices, { promptRef });

    return createDraftResultPrompt(promptChoice);
  };

  describe('cacheReusableInfoFromDraftResult', () => {
    beforeEach(async () => {});

    it('should cache any writable prompts', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId',
        masterDefendantId: 'masterDefendantId',
        defendantId: 'defendantId',
        offenceId: 'offenceId',
        originalText: 'TIMP',
        orderedDate: '2020-01-01'
      });

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: [
          createResultPromptForPromptRef('TIMP', 'earlyReleaseProvisionsApply'),
          createResultPromptForPromptRef('TIMP', 'consecutiveToSentenceImposedOn'),
          createResultPromptForPromptRef('TIMP', 'reasonForSentenceWithoutPSR')
        ]
      });

      const draftResult = draftResultBuilder.draftResult;
      const definitions$ = cold('--(r|)  ', { r: reusableInfoDefinitions });
      const saveInfo$ = cold('     --(r|)');
      const expected$ = cold('   ----(e|)', { e: undefined });

      cppHttp.command = jest.fn(() => saveInfo$);
      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() => definitions$);

      expect(cacheService.cacheReusableInfoFromDraftResult(draftResult)).toBeObservable(expected$);
      expect(cppHttp.command).toHaveBeenLastCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/reusable-info/hearingId',
        requestType: 'application/vnd.hearing.reusable-info+json',
        body: {
          reusablePrompts: [
            {
              masterDefendantId: 'masterDefendantId',
              offenceId: 'offenceId',
              promptRef: 'consecutiveToSentenceImposedOn',
              type: 'DATE',
              value: '2020-01-01'
            }
          ],
          reusableResults: []
        }
      });
    });

    it('should cache any writable result hierarchies', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId',
        masterDefendantId: 'masterDefendantId',
        defendantId: 'defendantId',
        offenceId: 'offenceId',
        originalText: 'BAIC',
        orderedDate: '2020-01-01'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'pore10',
        orderedDate: '2020-01-01'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'porr3',
        orderedDate: '2020-01-01'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:3',
        resultPrompts: createDraftResultPromptsForShortcode('porr3')
      });

      const draftResult = draftResultBuilder.draftResult;
      const definitions$ = cold('--(r|)  ', { r: reusableInfoDefinitions });
      const saveInfo$ = cold('     --(r|)');
      const expected$ = cold('   ----(e|)', { e: undefined });

      cppHttp.command = jest.fn(() => saveInfo$);
      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() => definitions$);

      expect(cacheService.cacheReusableInfoFromDraftResult(draftResult)).toBeObservable(expected$);
      expect(cppHttp.command).toHaveBeenLastCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/reusable-info/hearingId',
        requestType: 'application/vnd.hearing.reusable-info+json',
        body: {
          reusablePrompts: [],
          reusableResults: [
            {
              masterDefendantId: 'masterDefendantId',
              offenceId: 'offenceId',
              value: JSON.stringify({
                BAIC: [],
                PORE10: [],
                porr3: [
                  {
                    masterDefendantId: 'masterDefendantId',
                    offenceId: 'offenceId',
                    promptRef: 'address',
                    type: 'TXT',
                    value: '*'
                  }
                ]
              }),
              shortCode: 'BAIC'
            }
          ]
        }
      });
    });

    it('should cache a value that appears as a child of a ONEOF result prompt', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId',
        masterDefendantId: 'masterDefendantId',
        defendantId: 'defendantId',
        offenceId: 'offenceId',
        originalText: 'TIMP',
        orderedDate: '2020-01-01'
      });
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

      const draftResult = draftResultBuilder.draftResult;
      const definitions$ = cold('--(r|)  ', { r: reusableInfoDefinitions });
      const saveInfo$ = cold('     --(r|)');
      const expected$ = cold('   ----(e|)', { e: undefined });

      cppHttp.command = jest.fn(() => saveInfo$);
      referenceDataService.fetchResuableInfoDefinitions = jest.fn(() => definitions$);

      expect(cacheService.cacheReusableInfoFromDraftResult(draftResult)).toBeObservable(expected$);
      expect(cppHttp.command).toHaveBeenLastCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/reusable-info/hearingId',
        requestType: 'application/vnd.hearing.reusable-info+json',
        body: {
          reusablePrompts: [
            {
              masterDefendantId: 'masterDefendantId',
              offenceId: 'offenceId',
              promptRef: 'totalCustodialPeriod',
              type: 'DURATION',
              value: '20 MINUTES'
            }
          ],
          reusableResults: []
        }
      });
    });

    it('should ignore application-based result lines', async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        originalText: 'TIMP',
        orderedDate: '2020-01-01'
      });

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: [createResultPromptForPromptRef('TIMP', 'consecutiveToSentenceImposedOn')]
      });

      const draftResult = draftResultBuilder.draftResult;
      const expected$ = cold('(e|)', { e: undefined });

      expect(cacheService.cacheReusableInfoFromDraftResult(draftResult)).toBeObservable(expected$);
    });
  });

  describe('fetchCachedPromptValue', () => {
    const reusablePrompts = [
      {
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        promptRef: 'promptRef',
        type: 'TXT',
        value: 'CACHED_VALUE'
      },
      {
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        promptRef: 'promptRef2',
        type: 'TXT',
        value: 'CACHED_VALUE_2'
      },
      {
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId2',
        promptRef: 'promptRef',
        type: 'TXT',
        value: 'CACHED_VALUE_3'
      },
      {
        masterDefendantId: 'masterDefendantId2',
        promptRef: 'promptRef',
        type: 'TXT',
        value: 'CACHED_VALUE_4'
      }
    ];

    it('should fetch a value for matching offenceId', () => {
      const reusableInfo = {
        reusablePrompts,
        reusableResults: []
      } as ReusableInfo;
      const reusableInfo$ = cold('--(r|)', { r: reusableInfo });
      const expected$ = cold('    --(r|)', { r: reusablePrompts[0] });

      cppHttp.query = jest.fn(() => reusableInfo$);

      const result$ = cacheService.fetchCachedPromptValue({
        orderedDate: '2020-01-01',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        promptRef: 'promptRef',
        type: 'TXT',
        hearingId: 'hearingId'
      });

      expect(result$).toBeObservable(expected$);
      expect(cppHttp.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/reusable-info/hearingId',
        requestType: 'application/vnd.hearing.query.reusable-info+json'
      });
    });

    it('should fetch a value for matching masterDefendantId', () => {
      const reusableInfo = {
        reusablePrompts,
        reusableResults: []
      } as ReusableInfo;
      const reusableInfo$ = cold('--(r|)', { r: reusableInfo });
      const expected$ = cold('    --(r|)', { r: reusablePrompts[3] });

      cppHttp.query = jest.fn(() => reusableInfo$);

      const result$ = cacheService.fetchCachedPromptValue({
        orderedDate: '2020-01-01',
        masterDefendantId: 'masterDefendantId2',
        promptRef: 'promptRef',
        type: 'TXT',
        hearingId: 'hearingId'
      });

      expect(result$).toBeObservable(expected$);
    });
  });

  describe('fetchPromptValuesForHierarchy', () => {
    const reusableResults = [
      {
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        promptValues: {
          BAIC: [],
          PORE10: [],
          porr3: [
            {
              masterDefendantId: 'masterDefendantId',
              offenceId: 'offenceId',
              promptRef: 'address',
              type: 'TXT',
              value: 'ADDRESS_VALUE_1'
            }
          ]
        },
        shortCode: 'BAIC'
      },
      {
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId2',
        promptValues: {
          BAIC: [],
          PORE10: [],
          porr3: [
            {
              masterDefendantId: 'masterDefendantId',
              offenceId: 'offenceId2',
              promptRef: 'address',
              type: 'TXT',
              value: 'ADDRESS_VALUE_2'
            }
          ]
        },
        shortCode: 'BAIC'
      },
      {
        masterDefendantId: 'masterDefendantId2',
        promptValues: {
          BAIC: [],
          PORE10: [],
          porr3: [
            {
              masterDefendantId: 'masterDefendantId2',
              promptRef: 'address',
              type: 'TXT',
              value: 'ADDRESS_VALUE_3'
            }
          ]
        },
        shortCode: 'BAIC'
      }
    ] as any[];
    const reusableInfo = {
      reusablePrompts: [] as any[],
      reusableResults: reusableResults.map(({ promptValues, ...data }) => ({
        ...data,
        value: JSON.stringify(promptValues)
      }))
    };

    it('should fetch a value for matching offenceId', () => {
      const reusableInfo$ = cold('--(r|)', { r: reusableInfo });
      const expected$ = cold('    --(r|)', { r: reusableResults[0].promptValues });

      cppHttp.query = jest.fn(() => reusableInfo$);

      const result$ = cacheService.getValuesForHierarchy({
        hearingId: 'hearingId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        shortCode: 'BAIC'
      });

      expect(result$).toBeObservable(expected$);
      expect(cppHttp.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/reusable-info/hearingId',
        requestType: 'application/vnd.hearing.query.reusable-info+json'
      });
    });

    it('should fetch a value for matching masterDefendantId', () => {
      const reusableInfo$ = cold('--(r|)', { r: reusableInfo });
      const expected$ = cold('    --(r|)', { r: reusableResults[2].promptValues });

      cppHttp.query = jest.fn(() => reusableInfo$);

      const result$ = cacheService.getValuesForHierarchy({
        hearingId: 'hearingId',
        masterDefendantId: 'masterDefendantId2',
        shortCode: 'BAIC'
      });

      expect(result$).toBeObservable(expected$);
    });
  });
});
