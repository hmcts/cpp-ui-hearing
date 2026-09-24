import { AvailableHearing } from './../../model/available-hearing';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import cleanDeep from 'clean-deep';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchAvailableHearingsFormOptions } from '../../model';
import { getCPPDate } from '../../utils/cpp-date';
import { ListingNote } from '@cpp/scheduling';

export interface BookingStatus {
  bookingId: string;
  safeToShare: boolean;
  status: string;
}

export interface BookingStatusResponse {
  bookings: BookingStatus[];
}

/**
 * Pulls the `bookings` array out of whatever `CppHttp.command` hands back.
 *
 * <p>In production that is an `HttpResponse<string>` whose `body` is unparsed JSON. Tests and
 * any future change to `CppHttp` may pass the object straight through, so both are accepted -
 * but a shape carrying no `bookings` array is an error, never an empty result. See
 * {@link ListingService.getBookingStatus} for why that distinction is load-bearing.
 */
const parseBookingStatusResponse = (response: unknown): BookingStatusResponse => {
  const payload =
    typeof (response as { body?: unknown })?.body === 'string'
      ? JSON.parse((response as { body: string }).body)
      : response;

  const bookings = (payload as BookingStatusResponse)?.bookings;

  if (!Array.isArray(bookings)) {
    throw new Error('bookingStatus response carried no bookings array');
  }

  return { bookings };
};

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

  validateSessionAvailability(courtScheduleId: string, duration?: number): Observable<unknown> {
    const body = {
      courtScheduleIdList: [{ courtScheduleId }],
      ...(duration != null && { duration })
    };

    return this.api.command({
      url: '/listing-query-api/query/api/rest/listing/sessionAvailabilityValidation',
      requestType: 'application/vnd.listing.validate.session.availability+json',
      body
    });
  }

  /**
   * Asks listing whether each booking is still safe to share.
   *
   * <p>`bookingStatus` is a POST, so it must go through `api.command` rather than `api.query`.
   * That matters: `command` resolves to an Angular `HttpResponse` built with
   * `{ observe: 'response', responseType: 'text' }`, so the payload arrives as an UNPARSED
   * STRING on `.body` and the object itself has no `bookings` property. `command` is also
   * typed `Observable<any>`, so returning it directly satisfies any declared return type and
   * the compiler says nothing.
   *
   * <p>That combination is what made the pre-share gate pass a booking it had just been told
   * was expired: the gate read `response?.bookings`, got `undefined` off the `HttpResponse`,
   * and its `?? []` turned that into "no unsafe bookings". The request was made, the correct
   * `safeToShare: false` came back over the wire, and nothing acted on it.
   *
   * <p>So the parse belongs here, once, rather than at each of the three call sites. It
   * deliberately THROWS on a body it cannot read instead of answering `{ bookings: [] }` -
   * an empty list is indistinguishable from "everything is fine" and is precisely how this
   * failed silently before. Every caller already handles the error stream and has chosen its
   * own direction: the pre-share gate fails open, the two release effects fail closed.
   *
   * @param bookingIds the bookings to ask about
   * @returns the parsed `bookings` array
   */
  getBookingStatus(bookingIds: string[]): Observable<BookingStatusResponse> {
    return this.api
      .command({
        url: '/listing-query-api/query/api/rest/listing/bookingStatus',
        requestType: 'application/vnd.listing.query.booking.status+json',
        body: { bookingIds }
      })
      .pipe(map(response => parseBookingStatusResponse(response)));
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
