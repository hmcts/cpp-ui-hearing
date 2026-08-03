import { Inject, Injectable, InjectionToken } from '@angular/core';
import { featuresExist, getUserServices } from '@cpp/users-groups';
import { select, Store } from '@ngrx/store';
import { forkJoin, from, Observable, of } from 'rxjs';
import { concatMap, defaultIfEmpty, filter, map, switchMap, take } from 'rxjs/operators';
import {
  CachedPromptValue,
  CachedPromptValuesKeyedByShortcode,
  DraftResult,
  PromptChoice,
  TargetLike
} from '../../results.interfaces';
import { ResultsState } from '../store';
import { ReusableInfoLocalCacheService } from './reusable-info-local-cache.service';
import { ReusableInfoRemoteCacheService } from './reusable-info-remote-cache.service';

export interface CreateResultPromptsForApplicationOptions {
  hearingId: string;
  applicationId: string;
  orderedDate: string;
  promptChoices: PromptChoice[];
}

export interface CreateResultPromptsForOffenceOptions {
  hearingId: string;
  masterDefendantId: string;
  offenceId?: string;
  orderedDate: string;
  promptChoices: PromptChoice[];
}

export type CreateResultPromptsOptions =
  | CreateResultPromptsForApplicationOptions
  | CreateResultPromptsForOffenceOptions;

export interface PromptHandler {
  isEqual(promptChoice: PromptChoice): boolean;
  getValue(options: Omit<CreateResultPromptsOptions, 'promptChoices'>): Observable<unknown>;
}

export const PROMPT_HANDLERS = new InjectionToken<PromptHandler[]>('PromptHandlers');

// This service acts as facade for prompt handlers, the local and remote caching
// mechanisms, and also the permissions required to use them. In the event that
// the feature is disabled then the caching methods on this service will return
// empty values compatible with their consumers. Once the feature is permanent,
// it can be omitted from this location.
@Injectable({ providedIn: 'root' })
export class ReusableInfoService {
  constructor(
    @Inject(PROMPT_HANDLERS) private promptHandlers: PromptHandler[],
    private localCache: ReusableInfoLocalCacheService,
    private remoteCache: ReusableInfoRemoteCacheService,
    private store: Store<ResultsState>
  ) {}

  /**
   * Cache any values from the draft result. This will cache only those values
   * for peristence in the local cache layer, and should be used only when the
   * draft result is being saved (and not shared).
   *
   * @param draftResult the draft result to locally cache values from
   * @returns an observable that emits once the values have been cached
   */
  cacheValuesFromDraftResult(draftResult: DraftResult): Observable<unknown> {
    if (this.enabled) {
      return this.localCache.cacheValuesFromDraftResult(draftResult);
    }
    return of();
  }

  /**
   * Cache any values from a shared result. This will cache values for
   * peristence in the remote cache layer, and should be used when the draft
   * result is being shared.
   *
   * @param draftResult the draft result to remotely cache values from
   * @returns an observable that emits once the values have been cached
   */
  cacheValuesFromSharedResult(draftResult: DraftResult): Observable<unknown> {
    if (this.enabled) {
      return this.remoteCache.cacheReusableInfoFromDraftResult(draftResult);
    }
    return of([]);
  }

  /**
   * Obtain a reusable value for a prompt choice based on the cache /
   * prompt handlers. The internal logic for determining a value for a given
   * prompt choice is, in order or priority:
   *
   * 1. a value can be obtained for this prompt choice when iterating through
   *    any registered prompt handlers
   * 2. a locally cached value exists
   * 3. the target is an offence and a remotely cached value exists.
   *
   * Note that the order of 2 and 3 is arbitrary as the prompt choices that
   * would have cached values remotely cannot also have them locally, and vice
   * versa.
   *
   * @param promptChoice the prompt choice for which to find a reusable value
   * @param options the target metadata
   * @returns an observable that emits a cached prompt value where present
   */
  getValueForPromptChoice(
    promptChoice: PromptChoice,
    options: TargetLike<{ hearingId: string; orderedDate: string }>
  ): Observable<CachedPromptValue> {
    const { promptRef, type } = promptChoice;

    return this.getValueForPromptHandlers(promptChoice, options).pipe(
      switchMap(valueFromPromptHandler => {
        if (valueFromPromptHandler === null) {
          const localCacheItem = this.localCache.getCachedValue(promptChoice);

          if ('offenceId' in options && localCacheItem === undefined) {
            return this.remoteCache.fetchCachedPromptValue({
              hearingId: options.hearingId,
              offenceId: options.offenceId,
              orderedDate: options.orderedDate,
              masterDefendantId: options.masterDefendantId,
              promptRef,
              type
            });
          }
          return of(localCacheItem);
        }
        return of({
          type,
          promptRef,
          value: valueFromPromptHandler
        });
      })
    );
  }

  /**
   * Fetch a hierarchy of cached values for a result line. Where a result
   * definition has been cached in its entirety – i.e. its prompt values, its
   * child relations, and the prompt values of its children – then multiple
   * cached values for multiple result definitions will be available. This
   * dictionary of cached values (keyed by the shortcode of each cached result
   * definition) can then be provided when (re)building the previous hierarchy
   * of result lines.
   *
   * A hierarchy can be fetched from any depth, which is to say, if a shortcode
   * 'BAIC' were to exist as a standalone result line or as the child of another
   * result line, then in both cases, a hierarchy of values can be fetched for
   * BAIC and its subsequent children.
   *
   * @param options the target keys and shortcode for which the hierarchy be
   * fetched
   * @returns an observable that emits a dictionary of cached prompt values
   * keyed by the shortcode of the result definition
   */
  getValuesForHierarchy(
    options: TargetLike<{ hearingId: string; shortCode: string }>
  ): Observable<CachedPromptValuesKeyedByShortcode> {
    // Note that applications are not yet supported by remote caching
    if ('offenceId' in options && this.enabled) {
      return this.remoteCache.getValuesForHierarchy(options);
    }
    return of({});
  }

  private get enabled(): boolean {
    let valid: boolean;

    this.store
      .pipe(
        select(getUserServices),
        map(services => featuresExist(services, ['reuseOfInformation'])),
        take(1)
      )
      .subscribe(hasFeature => {
        valid = hasFeature;
      });

    return valid;
  }

  /**
   * Obtain any values for a collection of prompt choices based on the cache /
   * prompt handlers. The internal logic for determining a value for a given
   * prompt choice is, in order or priority:
   *
   * 1. a collection of values exists in its entirey due to a remotely cached
   *    hierarchy
   * 2. a value can be obtained for this prompt choice via #getValueForPromptChoice
   *
   * @param options the prompt choices and related target data
   * @returns an observable that emits an array of result prompts
   */
  getValuesForResultLine(
    options: TargetLike<{
      hearingId: string;
      shortCode: string;
      orderedDate: string;
      promptChoices: PromptChoice[];
    }>
  ): Observable<CachedPromptValue[]> {
    if (this.enabled && options.promptChoices.length > 0) {
      return this.getValuesForHierarchy(options)
        .pipe(
          switchMap(values =>
            values[options.shortCode]
              ? of(values[options.shortCode])
              : forkJoin(
                  options.promptChoices.map(promptChoice =>
                    this.getValueForPromptChoice(promptChoice, options)
                  )
                )
          )
        )
        .pipe(map(values => values.filter(Boolean)));
    }
    return of([]);
  }

  /**
   * Iterate through any registered prompt handlers to evaluate whether a value
   * can be obtained based on the equality criteria of the prompt handler. Once
   * a prompt handler is found, and it yields a value, all subsequent handlers
   * are aborted. Note that, if a matching prompt handler is found and it does
   * not yield, the next prompt handler is considered.
   *
   * @param promptChoice the prompt choice to obtain a value for
   * @param options the options for a target
   * @returns an observable that emits either a yielded value (or null, where
   * none exists)
   */
  private getValueForPromptHandlers<T extends Omit<CreateResultPromptsOptions, 'promptChoices'>>(
    promptChoice: PromptChoice,
    options: T
  ): Observable<CachedPromptValue | null> {
    return from(this.promptHandlers).pipe(
      filter(promptHandler => promptHandler.isEqual(promptChoice)),
      concatMap(promptHandler => promptHandler.getValue(options)),
      filter(value => value !== undefined),
      take(1),
      defaultIfEmpty(null)
    );
  }
}
