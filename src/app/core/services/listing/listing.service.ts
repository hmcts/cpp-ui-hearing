import { AvailableHearing } from './../../model/available-hearing';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import cleanDeep from 'clean-deep';
import { Observable } from 'rxjs';
import { SearchAvailableHearingsFormOptions } from '../../model';
import { getCPPDate } from '../../utils/cpp-date';
import { ListingNote } from '@cpp/scheduling';

@Injectable()
export class ListingService {
  constructor(private api: CppHttp) {}

  searchAvailableHearings(
    options: SearchAvailableHearingsFormOptions,
    isBoxHearing: boolean,
    matchedDefendantIds: string[],
    caseUrnForLinkedCases: string
  ): Observable<{ hearings: AvailableHearing[]; notes: ListingNote[] }> {
    const opt = {
      hearingId: !isBoxHearing ? options.hearingId : null,
      caseUrn: options.caseUrns ? options.caseUrns.join(',') : null,
      searchCriteria: options.searchCriterias ? options.searchCriterias.join(',') : null,
      matchedDefendantIds:
        isBoxHearing && !!matchedDefendantIds ? matchedDefendantIds.join(',') : null,
      caseUrnForLinkedCases,
      returnAllHearings: !!options.returnAllHearings
    };
    const params = this.toHttpParams(opt);

    return this.api.query<{ hearings: AvailableHearing[]; notes: ListingNote[] }>({
      url: '/listing-service/query/api/rest/listing/hearings/available-search/',
      requestType: 'application/vnd.listing.search.hearings+json',
      params
    });
  }

  private toHttpParams(params: any) {
    const cleanedParams = this.removeEmptyProperties(params);
    return Object.getOwnPropertyNames(cleanedParams).reduce(
      (p, key) => p.set(key, params[key]),
      new HttpParams()
    );
  }

  private removeEmptyProperties(options: any): any {
    return cleanDeep(options);
  }

  // Split multiple days hearings into individual hearing objects with only one hearing day
  // Also, remove the future hearings i.e. hearingDay.endTime >= currentDay.time (we do a day check)
  // i.e. {hearingId: '123' , hearingDays: [1, 2]} ==> {hearingId: '123', hearingDays: [1]}, {hearingId: '123', hearingDays: [2]}
  public splitFutureHearingDays(hearings: AvailableHearing[]): AvailableHearing[] {
    const dateUtil = getCPPDate();
    const currentDate = dateUtil.getCurrentDate();
    const futureHearings = [];
    for (const hearing of hearings) {
      const futureHearingDays = hearing.hearingDays.filter(
        hearingDay =>
          dateUtil.isSame(hearingDay.endTime, currentDate, 'day') ||
          dateUtil.isAfter(hearingDay.endTime, currentDate, 'day')
      );
      for (const hearingDay of futureHearingDays) {
        futureHearings.push({
          ...hearing,
          hearingDays: [hearingDay]
        });
      }
    }
    return futureHearings;
  }

  public sortByHearingDay(hearings: AvailableHearing[]): AvailableHearing[] {
    const dateUtil = getCPPDate();
    return hearings.sort((firstHearing, secondHearing) =>
      dateUtil.diff(
        firstHearing.hearingDays[0].startTime,
        secondHearing.hearingDays[0].startTime,
        'milliseconds'
      )
    );
  }
}
