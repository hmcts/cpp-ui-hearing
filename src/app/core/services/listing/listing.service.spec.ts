import { TestBed } from '@angular/core/testing';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import { validAvailableHearingMock1 } from '../../../results/hearing-details/related-hearings/mock/data';
import {
  SearchAvailableHearingsFormOptions,
  SearchCriteriaAvailableHearingsType
} from '../../model/available-hearing';
import { ListingService } from './listing.service';

describe('ListingService', () => {
  let service: ListingService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideCppCoreHttpServices(),
        ListingService,
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            commandSync: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(ListingService);
  });

  describe('search tests', () => {
    const mockSearchAvailableHearingsFormOptions: SearchAvailableHearingsFormOptions = {
      hearingId: 'mock-test-hearing-id',
      searchCriterias: [SearchCriteriaAvailableHearingsType.CASE_IN_HEARING]
    };

    let url = '/listing-query-api/query/api/rest/listing/hearings/range-search';
    const searchAvailableHearingsRequestType = 'application/vnd.listing.search.hearings+json';
    const hearings = [validAvailableHearingMock1];
    it('#searchAvailableHearings - normal hearing', () => {
      url = '/listing-service/query/api/rest/listing/hearings/available-search/';
      const isBoxHearing = false;
      const matchedDefendantIds: string[] = [];
      const caseUrnForLinkedCases: string = null;

      const httpResponse$ = cold('-a|', { a: { hearings } });
      const expected$ = cold('-b|', { b: { hearings } });

      const querySpy = jest.fn().mockReturnValue(httpResponse$);
      http.query = querySpy;
      const query$ = service.searchAvailableHearings(
        mockSearchAvailableHearingsFormOptions,
        isBoxHearing,
        matchedDefendantIds,
        caseUrnForLinkedCases
      );
      expect(query$).toBeObservable(expected$);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].url).toEqual(url);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].requestType).toEqual(
        searchAvailableHearingsRequestType
      );
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('hearingId')
      ).toBeTruthy();
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('caseUrnForLinkedCases')
      ).toBeFalsy();
    });

    it('#searchAvailableHearings - boxwork hearing', () => {
      url = '/listing-service/query/api/rest/listing/hearings/available-search/';
      const isBoxHearing = true;
      const matchedDefendantIds: string[] = [];
      const caseUrnForLinkedCases = 'test-linked-case-urn';

      const httpResponse$ = cold('-a|', { a: { hearings } });
      const expected$ = cold('-b|', { b: { hearings } });

      const querySpy = jest.fn().mockReturnValue(httpResponse$);
      http.query = querySpy;
      const query$ = service.searchAvailableHearings(
        mockSearchAvailableHearingsFormOptions,
        isBoxHearing,
        matchedDefendantIds,
        caseUrnForLinkedCases
      );
      expect(query$).toBeObservable(expected$);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].url).toEqual(url);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].requestType).toEqual(
        searchAvailableHearingsRequestType
      );
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('hearingId')
      ).toBeFalsy();
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('caseUrnForLinkedCases')
      ).toBeTruthy();
    });
  });

  describe('validateSessionAvailability', () => {
    const url = '/listing-query-api/query/api/rest/listing/sessionAvailabilityValidation';
    const requestType = 'application/vnd.listing.validate.session.availability+json';

    it('should send only the courtScheduleIdList when no duration is provided', () => {
      const httpResponse$ = cold('-a|', { a: {} });
      const expected$ = cold('-b|', { b: {} });
      const commandSpy = jest.fn().mockReturnValue(httpResponse$);
      http.command = commandSpy;

      const command$ = service.validateSessionAvailability('id-1');

      expect(command$).toBeObservable(expected$);
      expect(commandSpy).toHaveBeenCalledWith({
        url,
        requestType,
        body: {
          courtScheduleIdList: [{ courtScheduleId: 'id-1' }]
        }
      });
    });

    it('should include the duration in the body when provided', () => {
      const httpResponse$ = cold('-a|', { a: {} });
      const expected$ = cold('-b|', { b: {} });
      const commandSpy = jest.fn().mockReturnValue(httpResponse$);
      http.command = commandSpy;

      const command$ = service.validateSessionAvailability('id-1', 20);

      expect(command$).toBeObservable(expected$);
      expect(commandSpy).toHaveBeenCalledWith({
        url,
        requestType,
        body: {
          courtScheduleIdList: [{ courtScheduleId: 'id-1' }],
          duration: 20
        }
      });
    });
  });

  describe('getBookingStatus', () => {
    const url = '/listing-query-api/query/api/rest/listing/bookingStatus';
    const requestType = 'application/vnd.listing.query.booking.status+json';

    const bookings = [{ bookingId: 'booking-1', safeToShare: false, status: 'NONE' }];

    it('sends the bookingIds and returns the bookings response', () => {
      const response = { bookings };
      const httpResponse$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });
      const commandSpy = jest.fn().mockReturnValue(httpResponse$);
      http.command = commandSpy;

      const command$ = service.getBookingStatus(['booking-1']);

      expect(command$).toBeObservable(expected$);
      expect(commandSpy).toHaveBeenCalledWith({
        url,
        requestType,
        body: { bookingIds: ['booking-1'] }
      });
    });

    // The shape production actually produces, and the one this service used to pass straight
    // through to its callers. `CppHttp.command` posts with `{ observe: 'response',
    // responseType: 'text' }`, so the payload is an UNPARSED STRING on `.body` and the object
    // has no `bookings` of its own. Callers read `response?.bookings`, got undefined, and
    // their `?? []` read it as "nothing unsafe" - the pre-share gate shared a booking listing
    // had just reported as expired. Mocking the declared shape (the test above) cannot catch
    // that, because `command` is typed `Observable<any>` and so the compiler never objects.
    it('parses the text body of a real HttpResponse', () => {
      const httpResponse = { status: 200, body: JSON.stringify({ bookings }) };
      http.command = jest.fn().mockReturnValue(cold('-a|', { a: httpResponse }));

      expect(service.getBookingStatus(['booking-1'])).toBeObservable(
        cold('-b|', { b: { bookings } })
      );
    });

    // Must ERROR, never resolve to an empty list. Each caller has chosen its own direction for
    // a failed lookup - the pre-share gate fails open, the release effects fail closed - and
    // `{ bookings: [] }` would silently rob them of that choice by looking like a clean answer.
    it('errors rather than reporting no bookings when the body is unreadable', () => {
      http.command = jest.fn().mockReturnValue(cold('-a|', { a: { status: 200, body: 'null' } }));

      expect(service.getBookingStatus(['booking-1'])).toBeObservable(
        cold('-#', null, new Error('bookingStatus response carried no bookings array'))
      );
    });
  });
});
