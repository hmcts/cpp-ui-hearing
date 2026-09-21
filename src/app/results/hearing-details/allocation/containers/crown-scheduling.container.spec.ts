import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JsonPipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Params,
  Router,
  provideRouter
} from '@angular/router';
import { provideCppCoreHttpServices } from '@cpp/core';
import { ValidationError } from '@cpp/pdk';
import { HearingType, OrganisationUnit, RotaBusinessType } from '@cpp/reference-data';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AppState, HearingDetail, HearingLockState } from '../../../../core';
import { CrownSchedulingContainer } from './crown-scheduling.container';
import { CrownSchedulingComponent } from '../components/crown-scheduling.component';
import { createDraftResult, extendDraftResult } from '../../../core/testing';
import {
  BookingRefusedError,
  ProvisionalBookingService
} from '../services/provisionalBooking.service';
import { HearingSlot, CrownSchedulingFilters, SearchHearingSlotsParams } from '@cpp/scheduling';
import { AllocateHearingParams } from './magistrates.container';

describe('CrownSchedulingContainer', () => {
  let activatedRoute: ActivatedRoute;
  let fixture: ComponentFixture<CrownSchedulingContainer>;
  let router: Router;
  let store: MockStore<AppState>;
  let storeNextSpy: jest.SpyInstance;
  let provisionalBookingService: ProvisionalBookingService;

  const searchParams: SearchHearingSlotsParams = {
    oucodeL2Code: '1',
    oucodeL3Code: 'OUCODEL32',
    ouCode: 'OUCODEL32',
    courtSession: 'AM',
    sessionStartDate: '2019-01-01',
    sessionEndDate: '2019-01-31',
    panel: 'ADULT,YOUTH',
    businessType: 'HEARINGTYPE002',
    hearingTypeId: 'All',
    jurisdiction: 'CROWN'
  };
  const hearingId = 'HEARINGID1';
  const draftResult = extendDraftResult(createDraftResult({ results: ['NHMC'] }));
  const resultLineId = Object.keys(draftResult.resultLines)[0];

  const hearingDetail = {
    id: hearingId,
    startDate: '2019-01-01',
    courtCentre: {
      id: 'COURT004',
      roomId: 'C1'
    },
    hearingDays: [
      {
        sittingDay: '2019-01-01T09:00:00.000Z'
      }
    ],
    prosecutionCases: []
  } as unknown as HearingDetail;

  const hearingTypes = [
    { id: 'HEARINGTYPEA', hearingDescription: 'Hearing Type A', defaultDurationMin: 20 },
    { id: 'HEARINGTYPEB', hearingDescription: 'Hearing Type B', defaultDurationMin: 30 }
  ] as HearingType[];

  const organisationUnits = [
    {
      id: 'COURT002',
      oucode: 'OUCODEL32',
      oucodeL2Code: '1',
      oucodeL2Name: 'OUL2 X',
      oucodeL3Code: 'OUCODEL32',
      oucodeL3Name: 'Courthouse B'
    },
    {
      id: 'COURT004',
      oucode: 'OUCODEL34',
      oucodeL2Code: '2',
      oucodeL2Name: 'ouL2 Y',
      oucodeL3Code: 'OUCODEL34',
      oucodeL3Name: 'Courthouse D'
    }
  ] as OrganisationUnit[];

  const rotaBusinessTypes = [
    { id: 'RBT001', typeCode: 'DVLA', typeDescription: 'DVLA', duration: false },
    { id: 'RBT002', typeCode: 'TRL', typeDescription: 'TRL', duration: true }
  ] as RotaBusinessType[];

  const initialState = {
    hearings: {
      current: {
        hearing: hearingDetail,
        hearingState: HearingLockState.INITIALISED
      }
    },
    results: {
      draftResult
    },
    scheduling: {
      allocation: {
        hearingSlots: [{ courtScheduleId: '*' } as HearingSlot],
        params: {
          ...searchParams,
          pageSize: 10,
          pageNumber: 2
        },
        totalResults: 25
      }
    },
    referenceData: {
      hearingTypes,
      organisationUnits,
      rotaBusinessTypes,
      localJusticeAreas: []
    },
    usersGroups: {},
    router: {
      state: {
        root: {
          queryParams: {}
        }
      }
    }
  } as any;

  beforeEach(() => {
    activatedRoute = {
      snapshot: {
        params: {
          hearingId,
          resultLineId
        } as Params,
        queryParams: {}
      } as ActivatedRouteSnapshot
    } as ActivatedRoute;

    TestBed.configureTestingModule({
      imports: [CrownSchedulingContainer],
      providers: [
        provideCppCoreHttpServices(),
        provideMockStore({ initialState }),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: activatedRoute
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        },
        {
          provide: ProvisionalBookingService,
          useValue: {
            bookProvisionalHearingSlots: jest.fn()
          }
        },
        provideTranslateService()
      ],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(CrownSchedulingContainer, {
      remove: { imports: [CrownSchedulingComponent] },
      add: { imports: [TestCrownSchedulingComponent] }
    });

    store = TestBed.inject(MockStore);
    store.setState(initialState);
    store.refreshState();
    (store as any).next = jest.fn((action: any) => {
      store.dispatch(action);
    });
    storeNextSpy = (store as any).next as jest.Mock;

    router = TestBed.inject<Router>(Router);
    provisionalBookingService = TestBed.inject(ProvisionalBookingService);

    fixture = TestBed.createComponent(CrownSchedulingContainer);

    router.navigate = jest.fn();
    (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
      of({
        bookingId: 'test-booking-reference-id'
      })
    );
    fixture.detectChanges();
  });

  it('should compile correctly', () => {
    expect(fixture).toBeTruthy();
  });

  describe('reserving a picked session', () => {
    beforeEach(() => {
      storeNextSpy.mockClear();
    });

    const createHearingSlot = (data: Partial<HearingSlot> = {}) => {
      return {
        courtScheduleId: 'cs-9999',
        sessionDate: '2020-01-01',
        courtSession: 'AD',
        courtHouseName: 'Crown Court',
        courtRoomName: 'Courtroom 01',
        ouCode: 'OUCODEL32',
        ...data
      } as HearingSlot;
    };

    const submitHearingSlotAllocations = (params: Partial<AllocateHearingParams> = {}) => {
      fixture.debugElement
        .query(By.directive(TestCrownSchedulingComponent))
        .componentInstance.hearingSlotAllocationsSubmit.emit({
          hearingSlotAllocations: [
            {
              hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
              hearingSlotTime: '2020-01-01T10:00:00.000Z',
              duration: 60
            }
          ],
          hearingType: {
            id: 'HEARINGTYPEA',
            hearingDescription: 'Hearing Type A',
            defaultDurationMin: 20
          },
          ...params
        });
    };

    it('reserves the picked session and writes the returned bookingId as bookingReference', fakeAsync(() => {
      const bookingId = 'bk-1111-2222';
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        of({ bookingId })
      );

      submitHearingSlotAllocations();
      tick();

      expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
        expect.objectContaining({
          hearingId,
          courtScheduleBookings: [expect.objectContaining({ courtScheduleId: 'cs-9999' })]
        })
      );

      const dispatched = storeNextSpy.mock.calls.pop()[0];
      const bookingRefPrompt = dispatched.resultPrompts.find(
        (p: { promptRef: string }) => p.promptRef === 'bookingReference'
      );
      expect(bookingRefPrompt.value).toBe(bookingId);
      expect(bookingRefPrompt.value).not.toBe('cs-9999');
    }));

    it('sends no bookingId on a first pick (no prior booking reference)', fakeAsync(() => {
      submitHearingSlotAllocations();
      tick();

      const [args] = (
        provisionalBookingService.bookProvisionalHearingSlots as jest.Mock
      ).mock.calls.pop();
      expect(args).not.toEqual(expect.objectContaining({ bookingId: expect.anything() }));
    }));

    it('re-sends the existing bookingId when re-picking a session that already has a booking reference', fakeAsync(() => {
      const existingBookingId = 'existing-booking-reference-id';
      store.setState({
        ...initialState,
        results: {
          draftResult: {
            ...draftResult,
            resultLines: {
              ...draftResult.resultLines,
              [resultLineId]: {
                ...draftResult.resultLines[resultLineId],
                resultPrompts: [
                  {
                    promptId: 'p-booking-ref',
                    promptRef: 'bookingReference',
                    label: 'Booking reference',
                    type: 'TXT',
                    value: existingBookingId
                  }
                ]
              }
            }
          }
        }
      });
      store.refreshState();

      submitHearingSlotAllocations();
      tick();

      expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
        expect.objectContaining({ bookingId: existingBookingId })
      );
    }));

    it('does not write any prompt when the reservation fails', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new Error('no capacity'))
      );

      submitHearingSlotAllocations();
      tick();

      expect(storeNextSpy).not.toHaveBeenCalled();
    }));

    it('does not navigate away when the reservation fails', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new Error('no capacity'))
      );

      submitHearingSlotAllocations();
      tick();

      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('surfaces an error to the component when the reservation is refused', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new BookingRefusedError('no capacity'))
      );

      submitHearingSlotAllocations();
      tick();
      fixture.detectChanges();

      const stub = fixture.debugElement.query(By.directive(TestCrownSchedulingComponent))
        .componentInstance as TestCrownSchedulingComponent;

      expect(stub.externalErrors).toEqual([
        expect.objectContaining({
          message: 'MANAGE_HEARING.SESSION_NOT_AVAILABLE'
        })
      ]);
    }));

    // A technical failure of the booking call says nothing about the session's
    // availability. Reporting it as "fully booked" sends the clerk off to re-pick
    // a session that was never the problem - which is exactly what happened on
    // STE02 when a schema rejection rolled the command back and no event arrived.
    it('does not blame the session when the booking fails for a technical reason', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(
          () => new Error('Timeout waiting for public.hearing.hearing-slots-provisionally-booked')
        )
      );

      submitHearingSlotAllocations();
      tick();
      fixture.detectChanges();

      const stub = fixture.debugElement.query(By.directive(TestCrownSchedulingComponent))
        .componentInstance as TestCrownSchedulingComponent;

      expect(stub.externalErrors).toEqual([
        expect.objectContaining({
          message: 'MANAGE_HEARING.SESSION_BOOKING_FAILED'
        })
      ]);
    }));

    it('leaves the clerk on the picker - the stream survives a failure and a later pick still succeeds', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValueOnce(
        throwError(() => new Error('no capacity'))
      );

      submitHearingSlotAllocations();
      tick();

      expect(storeNextSpy).not.toHaveBeenCalled();

      const bookingId = 'bk-after-refusal';
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        of({ bookingId })
      );

      submitHearingSlotAllocations();
      tick();

      const dispatched = storeNextSpy.mock.calls.pop()[0];
      const bookingRefPrompt = dispatched.resultPrompts.find(
        (p: { promptRef: string }) => p.promptRef === 'bookingReference'
      );
      expect(bookingRefPrompt.value).toBe(bookingId);
    }));

    it('clears an earlier error once a later pick succeeds', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValueOnce(
        throwError(() => new Error('no capacity'))
      );

      submitHearingSlotAllocations();
      tick();
      fixture.detectChanges();

      let stub = fixture.debugElement.query(By.directive(TestCrownSchedulingComponent))
        .componentInstance as TestCrownSchedulingComponent;
      expect(stub.externalErrors).not.toBeNull();

      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        of({ bookingId: 'bk-clears-error' })
      );

      submitHearingSlotAllocations();
      tick();
      fixture.detectChanges();

      stub = fixture.debugElement.query(By.directive(TestCrownSchedulingComponent))
        .componentInstance as TestCrownSchedulingComponent;
      expect(stub.externalErrors).toBeNull();
    }));

    it('sends the duration with the booking', fakeAsync(() => {
      submitHearingSlotAllocations();
      tick();

      expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
        expect.objectContaining({
          courtScheduleBookings: [expect.objectContaining({ duration: expect.any(Number) })]
        })
      );
    }));
  });
});

@Component({
  selector: 'crown-scheduling',
  template: `
    currentPage: {{ currentPage }}<br />
    filters: {{ filters | json }}<br />
    hearingSlots: {{ hearingSlots | json }}<br />
    hearingTypes: {{ hearingTypes | json }}<br />
    organisationUnits: {{ organisationUnits | json }}<br />
    pageSize: {{ pageSize }}<br />
    rotaBusinessTypes: {{ rotaBusinessTypes | json }}<br />
    hearingData: {{ hearingData | json }}<br />
    totalResults: {{ totalResults }}<br />
    externalErrors: {{ externalErrors | json }}
  `,
  imports: [JsonPipe]
})
class TestCrownSchedulingComponent {
  @Input() currentPage = 0;
  @Input() filters?: Partial<CrownSchedulingFilters>;
  @Input() hearingSlots: HearingSlot[] = [];
  @Input() hearingTypes: HearingType[] = [];
  @Input() organisationUnits: OrganisationUnit[] = [];
  @Input() pageSize = 10;
  @Input() rotaBusinessTypes: RotaBusinessType[] = [];
  @Input() totalResults = -1;
  @Input() hearingData: HearingDetail;
  @Input() externalErrors: ValidationError[] | null = null;
  @Output() cancel = new EventEmitter<unknown>();
  @Output() filtersSubmit = new EventEmitter<CrownSchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<AllocateHearingParams>();
  @Output() pageChange = new EventEmitter<number>();
}
