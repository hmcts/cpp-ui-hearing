import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { HearingSummary, RemoveFutureHearing } from '../../model';
import { constructApiEndPointUrl } from '../../utils/utils';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { HearingService } from '../Hearing/hearing.service';

@Injectable({ providedIn: 'root' })
export class FutureHearingsService {
  constructor(private api: CppHttp, private hearingService: HearingService) {}

  getFutureHearingForCases(caseIds: string[]) {
    return this.api
      .query<{ hearingSummaries: HearingSummary[] }>({
        url: constructApiEndPointUrl('hearingQuery', 'future-hearings-by-cases'),
        requestType: 'application/vnd.hearing.get.future-hearings+json',
        params: new HttpParams().set('caseIds', caseIds.join(','))
      })
      .pipe(map(response => response.hearingSummaries || []));
  }

  removeFutureHearing(hearing: RemoveFutureHearing) {
    if (hearing.hearingToRemove) {
      return this.hearingService.markAsDuplicate(hearing.hearingId);
    }
    return this.hearingService.removeOffencesForHearing(hearing.hearingId, hearing.offenceIds);
  }
}
