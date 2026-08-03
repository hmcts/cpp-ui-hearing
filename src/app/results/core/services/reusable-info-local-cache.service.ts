import { Injectable } from '@angular/core';
import { ReferenceDataService, ReusablePromptDefinition } from '@cpp/reference-data';
import { flatten, groupBy } from 'lodash-es';
import { forkJoin, Observable } from 'rxjs';
import { defaultIfEmpty, map, mapTo, tap } from 'rxjs/operators';
import { DraftResult, DraftResultPrompt } from '../../results.interfaces';
import { isResolvedDraftResultLine } from '../helpers';
import { patchResuableInfoDefinitions } from '../patch';

export interface LocalPromptLike {
  promptRef: string;
  type: string;
}

export interface LocalPromptCacheItem {
  promptRef: string;
  type: string;
  value: unknown;
  updatedAt: number;
}

const LOCAL_PROMPTS_CACHE_KEY = 'prompts-cache';

@Injectable({ providedIn: 'root' })
export class ReusableInfoLocalCacheService {
  constructor(private referenceDataService: ReferenceDataService) {}

  cacheValuesFromDraftResult({ resultLines }: DraftResult): Observable<undefined> {
    const resolvedResultLines = Object.values(resultLines).filter(isResolvedDraftResultLine);
    const resultLinesByOrderedDate = groupBy(resolvedResultLines, 'orderedDate');

    return forkJoin(
      Object.keys(resultLinesByOrderedDate).map(orderedDate =>
        this.fetchReusablePrompts(orderedDate).pipe(
          map(resultPromptDefinitions => {
            const allResultPrompts = flatten(
              resultLinesByOrderedDate[orderedDate].map(({ resultPrompts = [] }) =>
                resultPrompts.map(resultPrompt =>
                  resultPrompt.type === 'ONEOF'
                    ? (resultPrompt.value as DraftResultPrompt)
                    : resultPrompt
                )
              )
            );
            return allResultPrompts.reduce((promptCacheItems, resultPrompt) => {
              if (
                resultPromptDefinitions.find(resultPromptDefinition =>
                  this.isResultPromptEqual(resultPromptDefinition, resultPrompt)
                )
              ) {
                return [
                  ...promptCacheItems,
                  {
                    promptRef: resultPrompt.promptRef,
                    type: resultPrompt.type,
                    value: resultPrompt.value,
                    updatedAt: Date.now()
                  }
                ];
              }
              return promptCacheItems;
            }, [] as LocalPromptCacheItem[]);
          })
        )
      )
    ).pipe(
      map(flatten),
      tap({
        next: (promptCacheItems: LocalPromptCacheItem[]) => {
          this.updateCache(promptCacheItems);
        }
      }),
      defaultIfEmpty([]),
      mapTo(undefined)
    );
  }

  getCachedValue(promptLike: LocalPromptLike): LocalPromptCacheItem | undefined {
    return this.getCache().find(cachedItem => this.isResultPromptEqual(cachedItem, promptLike));
  }

  private fetchReusablePrompts(orderedDate: string): Observable<ReusablePromptDefinition[]> {
    return this.referenceDataService
      .fetchResuableInfoDefinitions(orderedDate, { background: true })
      .pipe(
        map(patchResuableInfoDefinitions),
        map(({ reusablePromptDefinitions }) =>
          reusablePromptDefinitions.filter(
            ({ cacheable, cacheDataPath }) => cacheable === 2 && !cacheDataPath
          )
        )
      );
  }

  private getCache(): LocalPromptCacheItem[] {
    const json = localStorage.getItem(LOCAL_PROMPTS_CACHE_KEY);

    if (json) {
      try {
        return JSON.parse(json).filter(({ updatedAt }: { updatedAt: number }) => {
          const now = new Date(Date.now());
          const then = new Date(updatedAt);

          return (
            now.getFullYear() === then.getFullYear() &&
            now.getMonth() === then.getMonth() &&
            now.getDate() === then.getDate()
          );
        });
      } catch {
        // fall through to default values if cache cannot be parsed.
      }
    }
    return [];
  }

  private isResultPromptEqual(a: LocalPromptLike, b: LocalPromptLike): boolean {
    return a.promptRef === b.promptRef && a.type === b.type;
  }

  private setCache(value: LocalPromptCacheItem[]): void {
    localStorage.setItem(LOCAL_PROMPTS_CACHE_KEY, JSON.stringify(value));
  }

  private updateCache(promptCacheItems: LocalPromptCacheItem[]): void {
    const prevPromptCacheItems = this.getCache();

    this.setCache(
      promptCacheItems.reduce(
        (nextPromptCacheItems, promptCacheItem) => [
          ...nextPromptCacheItems.filter(item => !this.isResultPromptEqual(item, promptCacheItem)),
          promptCacheItem
        ],
        prevPromptCacheItems
      )
    );
  }
}
