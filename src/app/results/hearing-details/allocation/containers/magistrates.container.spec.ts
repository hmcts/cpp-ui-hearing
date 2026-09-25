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
import { MagistratesSchedulingContainer } from './magistrates.container';
import { MagistratesSchedulingComponent } from '../components/magistrates.component';
import { createDraftResult, extendDraftResult } from '../../../core/testing';
import {
  BookingRefusedError,
  ProvisionalBookingService
} from '../services/provisionalBooking.service';
import {
  HearingSlot,
  SchedulingFilters,
  SearchHearingSlotsParams,
  HearingSlotAllocation
} from '@cpp/scheduling';
import { AllocateHearingParams } from './magistrates.container';
import { MagistratesSchedulingFilters } from '../types/allocation';

describe('MagistratesSchedulingContainer', () => {
  let activatedRoute: ActivatedRoute;
  let fixture: ComponentFixture<MagistratesSchedulingContainer>;
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
    panel: 'ADULT',
    businessType: 'HEARINGTYPE002',
    hearingTypeId: 'All',
    jurisdiction: 'MAGISTRATES'
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
      id: 'COURT001',
      oucode: 'OUCODEL31',
      oucodeL2Code: '3',
      oucodeL2Name: 'OUL2 Z',
      oucodeL3Code: 'OUCODEL31',
      oucodeL3Name: 'Courthouse A'
    },
    {
      id: 'COURT002',
      oucode: 'OUCODEL32',
      oucodeL2Code: '1',
      oucodeL2Name: 'OUL2 X',
      oucodeL3Code: 'OUCODEL32',
      oucodeL3Name: 'Courthouse B'
    },
    {
      id: 'COURT003',
      oucode: 'OUCODEL33',
      oucodeL2Code: '1',
      oucodeL2Name: 'OUL2 X',
      oucodeL3Code: 'OUCODEL33',
      oucodeL3Name: 'CourthouseC'
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
      imports: [MagistratesSchedulingContainer],
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
    }).overrideComponent(MagistratesSchedulingContainer, {
      remove: { imports: [MagistratesSchedulingComponent] },
      add: { imports: [TestMagistratesSchedulingComponent] }
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

    fixture = TestBed.createComponent(MagistratesSchedulingContainer);

    router.navigate = jest.fn();
    (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
      of({
        bookingId: 'test-booking-reference-id'
      })
    );
    fixture.detectChanges();
  });

  it('should compile correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should handle submitting the form filters', () => {
    const filters = {
      courtRoomId: '*',
      sessionStartDate: '2019-01-01'
    } as SchedulingFilters;
    fixture.debugElement
      .query(By.directive(TestMagistratesSchedulingComponent))
      .componentInstance.filtersSubmit.emit(filters);

    expect(router.navigate).toHaveBeenCalledWith(['.'], {
      relativeTo: activatedRoute,
      fragment: '_',
      queryParamsHandling: 'merge',
      replaceUrl: true,
      queryParams: {
        mf: JSON.stringify({
          ...filters,
          sessionEndDate: '2019-02-11',
          pageNumber: 1,
          jurisdiction: 'MAGISTRATES'
        })
      }
    });
  });

  it('should handle paginating the form filters', () => {
    fixture.debugElement
      .query(By.directive(TestMagistratesSchedulingComponent))
      .componentInstance.pageChange.emit(2);

    expect(router.navigate).toHaveBeenCalledWith(['.'], {
      relativeTo: activatedRoute,
      fragment: '_',
      queryParamsHandling: 'merge',
      replaceUrl: true,
      queryParams: {
        mf: JSON.stringify({
          ...searchParams,
          pageNumber: 2
        })
      }
    });
  });

  it('should handle returning to the Enter Results page', () => {
    fixture.debugElement
      .query(By.directive(TestMagistratesSchedulingComponent))
      .componentInstance.cancel.emit();

    expect(router.navigate).toHaveBeenCalledWith(['/manage', hearingId, 'enter-results']);
  });

  describe('submitting a hearing slot', () => {
    beforeEach(() => {
      storeNextSpy.mockClear();
    });

    const createHearingSlot = (data: Partial<HearingSlot> = {}) => {
      return {
        courtScheduleId: '1',
        sessionDate: '2020-01-01',
        courtSession: 'AD',
        courtHouseName: `Lavendar Hill Magistrates' Court`,
        courtRoomName: 'Courtroom 01',
        ouCode: 'OUCODEL32',
        judiciaries: [
          { judiciaryId: 'A', judiciaryType: 'MAGISTRATE', deputy: true, benchChairman: false },
          { judiciaryId: 'B', judiciaryType: 'MAGISTRATE', deputy: false, benchChairman: true }
        ],
        ...data
      } as HearingSlot;
    };

    const submitHearingSlotAllocations = (hearingSlotAllocations: HearingSlotAllocation[]) => {
      fixture.debugElement
        .query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance.hearingSlotAllocationsSubmit.emit({
          hearingSlotAllocations,
          hearingType: {
            id: 'HEARINGTYPEA',
            hearingDescription: 'Hearing Type A',
            defaultDurationMin: 20
          }
        });
    };

    it('sends no bookingId on a first pick (no prior booking reference)', fakeAsync(() => {
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
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

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();

      expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
        expect.objectContaining({ bookingId: existingBookingId })
      );
    }));

    // courtscheduler decrements available_duration by this value when reserving a duration-based
    // session. Without it the reservation cannot take the capacity it claims - observed on STE02,
    // where a duration-based mags pick reached courtscheduler carrying only courtScheduleId and
    // hearingStartTime.
    it('sends the picked duration so a duration-based session can take its capacity', fakeAsync(() => {
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'TRL' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z',
          duration: 10
        }
      ]);
      tick();

      expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith(
        expect.objectContaining({
          courtScheduleBookings: [
            expect.objectContaining({
              courtScheduleId: '1',
              hearingStartTime: '2020-01-01T10:00:00.000Z',
              duration: 10
            })
          ]
        })
      );
    }));

    // A slot-based session carries no duration; courtscheduler counts slots there. Passing
    // undefined keeps the key out of the JSON entirely, which is what it expects.
    it('leaves duration undefined for a slot-based pick', fakeAsync(() => {
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();

      const { courtScheduleBookings } = (
        provisionalBookingService.bookProvisionalHearingSlots as jest.Mock
      ).mock.calls[0][0];
      expect(courtScheduleBookings[0].duration).toBeUndefined();
    }));

    // The banner used to be cleared ONLY on a successful booking, so a failed pick left it on
    // screen indefinitely. Because the error carries shouldFocus, the summary reclaimed focus on
    // every change detection and the filters became unusable - the clerk could not search again.
    it('clears the error banner when the clerk searches again', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new Error('boom'))
      );
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      fixture.detectChanges();

      const stub = fixture.debugElement.query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance as TestMagistratesSchedulingComponent;
      expect(stub.externalErrors).not.toBeNull();

      stub.filtersSubmit.emit({
        courtRoomId: '*',
        sessionStartDate: '2019-01-01'
      } as MagistratesSchedulingFilters);
      tick();
      fixture.detectChanges();

      expect(stub.externalErrors).toBeNull();
    }));

    it('clears the error banner when the clerk pages through results', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new Error('boom'))
      );
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      fixture.detectChanges();

      const stub = fixture.debugElement.query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance as TestMagistratesSchedulingComponent;
      expect(stub.externalErrors).not.toBeNull();

      stub.pageChange.emit(2);
      tick();
      fixture.detectChanges();

      expect(stub.externalErrors).toBeNull();
    }));

    it('does not write any prompt or navigate away when the reservation is refused', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new Error('no capacity'))
      );

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();

      expect(storeNextSpy).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('surfaces an error to the component when the reservation is refused', fakeAsync(() => {
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        throwError(() => new BookingRefusedError('no capacity'))
      );

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      fixture.detectChanges();

      const stub = fixture.debugElement.query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance as TestMagistratesSchedulingComponent;

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

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      fixture.detectChanges();

      const stub = fixture.debugElement.query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance as TestMagistratesSchedulingComponent;

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

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();

      expect(storeNextSpy).not.toHaveBeenCalled();

      const bookingId = 'bk-after-refusal';
      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        of({ bookingId })
      );

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
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

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      fixture.detectChanges();

      let stub = fixture.debugElement.query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance as TestMagistratesSchedulingComponent;
      expect(stub.externalErrors).not.toBeNull();

      (provisionalBookingService.bookProvisionalHearingSlots as jest.Mock).mockReturnValue(
        of({ bookingId: 'bk-clears-error' })
      );

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      fixture.detectChanges();

      stub = fixture.debugElement.query(By.directive(TestMagistratesSchedulingComponent))
        .componentInstance as TestMagistratesSchedulingComponent;
      expect(stub.externalErrors).toBeNull();
    }));

    it('should handle submitting a non-duration based slot', fakeAsync(() => {
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();

      expect(storeNextSpy.mock.calls.pop()[0]).toMatchSnapshot(`
         {
            "redirectTo": [
              "/manage",
              "HEARINGID1",
              "enter-results",
            ],
            "resultLineId": "UUID:1",
            "resultPrompts": [
              {
                "label": "Date of hearing",
                "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
                "promptRef": "HDATE",
                "type": "DATE",
                "value": "2020-01-01"},
              {
                "label": "Time of hearing",
                "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
                "promptRef": "timeOfHearing",
                "type": "TIME",
                "value": "10:00"},
              {
                "label": "Courtroom",
                "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
                "promptRef": "HCROOM",
                "type": "HCROOM",
                "value": "Courtroom 01"},
              {
                "label": "Hearing type",
                "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                "promptRef": "HTYPE",
                "type": "FIXL",
                "value": "Hearing Type A"},
              {
                "label": "Estimated duration",
                "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                "promptRef": "HEST",
                "type": "DURATION",
                "value": [
                  {
                    "label": "MINUTES",
                    "value": 20},
                ]},
              {
                "label": "Booking reference",
                "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
                "promptRef": "bookingReference",
                "type": "TXT",
                "value": "test-booking-reference-id"},
              {
                "label": "Courthouse",
                "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                "promptRef": "hCHOUSE",
                "type": "NAMEADDRESS",
                "value": [
                  {
                    "label": "Courthouse organisation name",
                    "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                    "promptRef": "hCHOUSEOrganisationName",
                    "type": "TXT",
                    "value": "Courthouse A"},
                ]},
            ],
            "type": "UPDATE_RESULT_PROMPTS"}
      `);
    }));

    it('should handle submitting a duration-based slot with a known duration', fakeAsync(() => {
      const hearingSlots = [createHearingSlot({ businessType: 'TRL' })];

      storeNextSpy.mockClear();

      submitHearingSlotAllocations([
        {
          hearingSlot: hearingSlots[0],
          hearingSlotTime: '2020-01-01T10:00:00.000Z',
          duration: 120
        }
      ]);
      tick();
      expect(storeNextSpy.mock.calls.pop()[0]).toMatchInlineSnapshot(`
        {
          "redirectTo": [
            "/manage",
            "HEARINGID1",
            "enter-results",
          ],
          "resultLineId": "UUID:1",
          "resultPrompts": [
            {
              "label": "Date of hearing",
              "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
              "promptRef": "HDATE",
              "type": "DATE",
              "value": "2020-01-01",
            },
            {
              "label": "Time of hearing",
              "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
              "promptRef": "timeOfHearing",
              "type": "TIME",
              "value": "10:00",
            },
            {
              "label": "Courtroom",
              "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
              "promptRef": "HCROOM",
              "type": "HCROOM",
              "value": "Courtroom 01",
            },
            {
              "label": "Hearing type",
              "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
              "promptRef": "HTYPE",
              "type": "FIXL",
              "value": "Hearing Type A",
            },
            {
              "label": "Estimated duration",
              "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
              "promptRef": "HEST",
              "type": "DURATION",
              "value": [
                {
                  "label": "MINUTES",
                  "value": 20,
                },
              ],
            },
            {
              "label": "Booking reference",
              "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
              "promptRef": "bookingReference",
              "type": "TXT",
              "value": "test-booking-reference-id",
            },
            {
              "label": "Courthouse",
              "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
              "promptRef": "hCHOUSE",
              "type": "NAMEADDRESS",
              "value": [
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEOrganisationName",
                  "type": "TXT",
                  "value": "Courthouse B",
                },
              ],
            },
          ],
          "type": "UPDATE_RESULT_PROMPTS",
        }
      `);
    }));

    it('should handle submitting a morning duration-based slot of unknown duration', fakeAsync(() => {
      storeNextSpy.mockClear();

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'TRL', courtSession: 'AM' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      expect(storeNextSpy.mock.calls.pop()[0]).toMatchInlineSnapshot(`
        {
          "redirectTo": [
            "/manage",
            "HEARINGID1",
            "enter-results",
          ],
          "resultLineId": "UUID:1",
          "resultPrompts": [
            {
              "label": "Date of hearing",
              "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
              "promptRef": "HDATE",
              "type": "DATE",
              "value": "2020-01-01",
            },
            {
              "label": "Time of hearing",
              "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
              "promptRef": "timeOfHearing",
              "type": "TIME",
              "value": "10:00",
            },
            {
              "label": "Courtroom",
              "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
              "promptRef": "HCROOM",
              "type": "HCROOM",
              "value": "Courtroom 01",
            },
            {
              "label": "Hearing type",
              "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
              "promptRef": "HTYPE",
              "type": "FIXL",
              "value": "Hearing Type A",
            },
            {
              "label": "Estimated duration",
              "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
              "promptRef": "HEST",
              "type": "DURATION",
              "value": [
                {
                  "label": "MINUTES",
                  "value": 20,
                },
              ],
            },
            {
              "label": "Booking reference",
              "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
              "promptRef": "bookingReference",
              "type": "TXT",
              "value": "test-booking-reference-id",
            },
            {
              "label": "Courthouse",
              "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
              "promptRef": "hCHOUSE",
              "type": "NAMEADDRESS",
              "value": [
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEOrganisationName",
                  "type": "TXT",
                  "value": "Courthouse B",
                },
              ],
            },
          ],
          "type": "UPDATE_RESULT_PROMPTS",
        }
      `);
    }));

    it('should handle submitting an afternoon duration-based slot of unknown duration', fakeAsync(() => {
      storeNextSpy.mockClear();

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'TRL', courtSession: 'PM' }),
          hearingSlotTime: '2020-01-01T14:00:00.000Z'
        }
      ]);
      tick();
      expect(storeNextSpy.mock.calls.pop()[0]).toMatchSnapshot();
    }));

    it('should handle submitting an all day duration-based slot of unknown duration', fakeAsync(() => {
      //
      storeNextSpy.mockClear();

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'TRL', courtSession: 'AD' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      expect(storeNextSpy.mock.calls.pop()[0].payload).toMatchSnapshot();
    }));

    it('should handle submitting an application', fakeAsync(() => {
      //
      storeNextSpy.mockClear();

      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);
      tick();
      expect(storeNextSpy.mock.calls.pop()[0]).toMatchSnapshot();
    }));
  });
});

@Component({
  selector: 'magistrates-scheduling',
  template: `
    currentPage: {{ currentPage }}<br />
    defaultFilters: {{ defaultFilters | json }}<br />
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
class TestMagistratesSchedulingComponent {
  @Input() currentPage = 0;
  @Input() defaultFilters?: Partial<MagistratesSchedulingFilters>;
  @Input() filters?: Partial<MagistratesSchedulingFilters>;
  @Input() hearingSlots: HearingSlot[] = [];
  @Input() hearingTypes: HearingType[] = [];
  @Input() organisationUnits: OrganisationUnit[] = [];
  @Input() pageSize = 10;
  @Input() rotaBusinessTypes: RotaBusinessType[] = [];
  @Input() totalResults = -1;
  @Input() hearingData: HearingDetail;
  @Input() externalErrors: ValidationError[] | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() filtersSubmit = new EventEmitter<MagistratesSchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<AllocateHearingParams>();
  @Output() pageChange = new EventEmitter<number>();
}
