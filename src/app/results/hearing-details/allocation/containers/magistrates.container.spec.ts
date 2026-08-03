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
import { HearingType, OrganisationUnit, RotaBusinessType } from '@cpp/reference-data';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { AppState, HearingDetail, HearingLockState } from '../../../../core';
import { MagistratesSchedulingContainer } from './magistrates.container';
import { MagistratesSchedulingComponent } from '../components/magistrates.component';
import { createDraftResult, extendDraftResult } from '../../../core/testing';
import { ProvisionalBookingService } from '../services/provisionalBooking.service';
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
    hearingTypeId: 'All'
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
        } as Params
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
        }
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
      queryParams: {
        mf: JSON.stringify({ ...filters, sessionEndDate: '2019-02-11', pageNumber: 1 })
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
    totalResults: {{ totalResults }}
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
  @Output() cancel = new EventEmitter<void>();
  @Output() filtersSubmit = new EventEmitter<MagistratesSchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<AllocateHearingParams>();
  @Output() pageChange = new EventEmitter<number>();
}
