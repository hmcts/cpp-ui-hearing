import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { ReferenceDataService } from '@cpp/reference-data';
import { cold } from 'jasmine-marbles';
import { reducers } from '../../../../core';
import { ExtendedResolvedDraftResultLine, PromptChoice } from '../../../results.interfaces';
import {
  createDraftResult,
  enableFeature,
  getParsedResultDefinitionByShortCode
} from '../../testing';
import { ReusableInfoLocalCacheService } from '../reusable-info-local-cache.service';
import { ReusableInfoRemoteCacheService } from '../reusable-info-remote-cache.service';
import { PROMPT_HANDLERS, ReusableInfoService } from '../reusable-info.service';
import { provideCppCoreHttpServices } from '@cpp/core';

describe('ReusableInfoService', () => {
  let localCache: ReusableInfoLocalCacheService;
  let remoteCache: ReusableInfoRemoteCacheService;
  let reusableInfoService: ReusableInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        provideStore(reducers, {
          runtimeChecks: {}
        }),
        provideRouter([]),
        ReferenceDataService,
        ReusableInfoService,
        ReusableInfoLocalCacheService,
        ReusableInfoRemoteCacheService,
        {
          provide: PROMPT_HANDLERS,
          multi: true,
          useValue: {
            isEqual: () => false
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    localCache = TestBed.inject(ReusableInfoLocalCacheService);
    remoteCache = TestBed.inject(ReusableInfoRemoteCacheService);
    reusableInfoService = TestBed.inject(ReusableInfoService);

    // While reuse of information remains opt-in, we must force enable it for testing
    enableFeature('reuseOfInformation');
  });

  const draftResult = createDraftResult();

  describe('cacheValuesFromDraftResult', () => {
    it('should cache applicable result prompts in local storage', () => {
      const cacheValues$ = cold('--(r|)');
      const expected$ = cold('   --(r|)');

      localCache.cacheValuesFromDraftResult = jest.fn(() => cacheValues$);

      expect(reusableInfoService.cacheValuesFromDraftResult(draftResult)).toBeObservable(expected$);
      expect(localCache.cacheValuesFromDraftResult).toHaveBeenCalledWith(draftResult);
    });
  });

  describe('cacheValuesFromSharedResult', () => {
    it('should cache applicable result prompts in remote storage', async () => {
      const cacheValues$ = cold('--(r|)');
      const expected$ = cold('   --(r|)');

      remoteCache.cacheReusableInfoFromDraftResult = jest.fn(() => cacheValues$);

      expect(reusableInfoService.cacheValuesFromSharedResult(draftResult)).toBeObservable(
        expected$
      );
      expect(remoteCache.cacheReusableInfoFromDraftResult).toHaveBeenCalledWith(draftResult);
    });
  });

  describe('getValuesForResultLine', () => {
    const { promptChoices } = getParsedResultDefinitionByShortCode('NCOSTS');

    it('should fetch from a prompt handler', () => {
      const hierarchy$ = cold('  --(r|)  ', { r: {} });
      const cachedValue$ = cold('  --(r|)', { r: 'CACHED_VALUE' });
      const expected$ = cold('   ----(r|)', {
        r: [
          {
            type: promptChoices[0].type,
            promptRef: promptChoices[0].promptRef,
            value: 'CACHED_VALUE'
          }
        ]
      });

      remoteCache.getValuesForHierarchy = jest.fn(() => hierarchy$);
      TestBed.inject(PROMPT_HANDLERS).push({
        getValue: () => cachedValue$,
        isEqual: (promptChoice: PromptChoice) =>
          promptChoice.promptRef === promptChoices[0].promptRef
      });

      const resultPrompts$ = reusableInfoService.getValuesForResultLine({
        caseId: 'caseId',
        hearingId: 'hearingId',
        orderedDate: '2020-01-01',
        offenceId: 'offenceId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        shortCode: 'NCOSTS',
        promptChoices
      });

      expect(resultPrompts$).toBeObservable(expected$);
    });

    it('should fetch from the local cache', () => {
      const localValue = {
        type: promptChoices[0].type,
        promptRef: promptChoices[0].promptRef,
        value: 'CACHED_VALUE',
        updatedAt: 0
      };
      const hierarchy$ = cold('--(r|)', { r: {} });
      const expected$ = cold(' --(r|)', { r: [localValue] });

      remoteCache.getValuesForHierarchy = jest.fn(() => hierarchy$);
      localCache.getCachedValue = jest.fn(() => localValue);

      const resultPrompts$ = reusableInfoService.getValuesForResultLine({
        caseId: 'caseId',
        hearingId: 'hearingId',
        orderedDate: '2020-01-01',
        offenceId: 'offenceId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        shortCode: 'NCOSTS',
        promptChoices
      });

      expect(resultPrompts$).toBeObservable(expected$);
      expect(localCache.getCachedValue).toHaveBeenCalledWith(promptChoices[0]);
    });

    it('should fetch from the remote cache', () => {
      const remoteValue = {
        type: promptChoices[0].type,
        promptRef: promptChoices[0].promptRef,
        value: 'CACHED_VALUE'
      };
      const hierarchy$ = cold('  --(r|)  ', { r: {} });
      const cachedValue$ = cold('  --(r|)', { r: remoteValue });
      const expected$ = cold('   ----(r|)', { r: [remoteValue] });

      remoteCache.getValuesForHierarchy = jest.fn(() => hierarchy$);
      remoteCache.fetchCachedPromptValue = jest.fn(() => cachedValue$);

      const resultPrompts$ = reusableInfoService.getValuesForResultLine({
        caseId: 'caseId',
        hearingId: 'hearingId',
        orderedDate: '2020-01-01',
        offenceId: 'offenceId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        shortCode: 'NCOSTS',
        promptChoices
      });

      expect(resultPrompts$).toBeObservable(expected$);
      expect(remoteCache.fetchCachedPromptValue).toHaveBeenCalledWith({
        hearingId: 'hearingId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        orderedDate: '2020-01-01',
        promptRef: promptChoices[0].promptRef,
        type: promptChoices[0].type
      });
    });

    it('should not fetch from the remote cache for application targets', () => {
      const expected$ = cold('(r|)', { r: [] });

      const resultPrompts$ = reusableInfoService.getValuesForResultLine({
        hearingId: 'hearingId',
        orderedDate: '2020-01-01',
        applicationId: 'offenceId',
        shortCode: 'NCOSTS',
        promptChoices
      });

      expect(resultPrompts$).toBeObservable(expected$);
    });

    it('should filter empty values', () => {
      const hierarchy$ = cold('--(r|)  ', { r: {} });
      const cachedValue$ = cold('--(r|)', { r: undefined });
      const expected$ = cold(' ----(r|)', { r: [] });

      localCache.getCachedValue = jest.fn();
      remoteCache.getValuesForHierarchy = jest.fn(() => hierarchy$);
      remoteCache.fetchCachedPromptValue = jest.fn(() => cachedValue$);

      const resultPrompts$ = reusableInfoService.getValuesForResultLine({
        caseId: 'caseId',
        hearingId: 'hearingId',
        orderedDate: '2020-01-01',
        offenceId: 'offenceId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        shortCode: 'NCOSTS',
        promptChoices
      });

      expect(resultPrompts$).toBeObservable(expected$);
    });

    it('should handle an empty prompt choices array', () => {
      const expected$ = cold(' (r|)', { r: [] });
      const resultPrompts$ = reusableInfoService.getValuesForResultLine({
        caseId: 'caseId',
        hearingId: 'hearingId',
        orderedDate: '2020-01-01',
        offenceId: 'offenceId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        shortCode: 'NCOSTS',
        promptChoices: []
      });

      expect(resultPrompts$).toBeObservable(expected$);
    });
  });

  describe('fetchPromptValuesForHierarchy', () => {
    it('should fetch the values of child definitions', () => {
      const fetchValues$ = cold('--(r|)', { r: {} });
      const expected$ = cold('   --(r|)', { r: {} });

      remoteCache.getValuesForHierarchy = jest.fn(() => fetchValues$);

      const resultLine = { offenceId: 'offenceId' } as ExtendedResolvedDraftResultLine;
      const result$ = reusableInfoService.getValuesForHierarchy({
        ...resultLine,
        hearingId: 'hearingId'
      });

      expect(result$).toBeObservable(expected$);
      expect(remoteCache.getValuesForHierarchy).toHaveBeenCalledWith({
        hearingId: 'hearingId',
        ...resultLine
      });
    });

    it('should do nothing for application result lines', () => {
      const expected$ = cold('(r|)', { r: {} });
      const resultLine = { applicationId: 'applicationId' } as ExtendedResolvedDraftResultLine;
      const result$ = reusableInfoService.getValuesForHierarchy({
        ...resultLine,
        hearingId: 'hearingId'
      });

      remoteCache.getValuesForHierarchy = jest.fn();

      expect(result$).toBeObservable(expected$);
      expect(remoteCache.getValuesForHierarchy).not.toHaveBeenCalled();
    });
  });
});
