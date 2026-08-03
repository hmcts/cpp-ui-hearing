import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { ExtendedResolvedDraftResultLine, PromptChoice } from '../../../results.interfaces';
import { findResult, isActiveDraftResultLine } from '../../helpers';
import { getDraftResult, ResultsState } from '../../store';
import { CreateResultPromptsForOffenceOptions, PromptHandler } from '../reusable-info.service';

@Injectable({ providedIn: 'root' })
export class CtlDatePromptHandler implements PromptHandler {
  constructor(private cppHttp: CppHttp, private store: Store<ResultsState>) {}

  isEqual(promptChoice: PromptChoice): boolean {
    return promptChoice.promptRef === 'CTLDATE';
  }

  getValue(options: CreateResultPromptsForOffenceOptions): Observable<unknown> {
    const { hearingId, orderedDate, offenceId } = options;

    return this.store.pipe(
      select(getDraftResult),
      take(1),
      switchMap(draftResult => {
        const result = findResult<ExtendedResolvedDraftResultLine>(
          draftResult,
          ({ resultLine }) => isActiveDraftResultLine(resultLine) && 'bailStatusCode' in resultLine
        );

        if (result) {
          return this.cppHttp
            .query<{ custodyTimeLimit: string }>({
              url: `/hearing-query-api/query/api/rest/hearing/hearings/${hearingId}/${orderedDate}/offences/${offenceId}`,
              requestType: 'application/vnd.hearing.custody-time-limit+json',
              params: new HttpParams({
                fromObject: {
                  bailStatusCode: result.resultLine.bailStatusCode
                }
              })
            })
            .pipe(map(res => res.custodyTimeLimit));
        }

        return of(undefined);
      })
    );
  }
}
