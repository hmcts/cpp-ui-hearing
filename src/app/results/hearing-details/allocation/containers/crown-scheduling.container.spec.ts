import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonPipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, Params, Router } from '@angular/router';
import { ValidationError } from '@cpp/pdk';
import { HearingType, OrganisationUnit, RotaBusinessType } from '@cpp/reference-data';
import {
  CrownSchedulingFilters,
  HearingSlot,
  HearingSlotAllocation,
  SearchHearingSlotsParams
} from '@cpp/scheduling';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AppState, HearingDetail, HearingLockState } from '../../../../core';
import { createDraftResult, extendDraftResult } from '../../../core/testing';
import { CrownSchedulingComponent } from '../components/crown-scheduling.component';
import { CrownSchedulingContainer } from './crown-scheduling.container';
import { AllocateHearingParams } from './magistrates.container';

describe('CrownSchedulingContainer', () => {
  let activatedRoute: ActivatedRoute;
  let fixture: ComponentFixture<CrownSchedulingContainer>;
  let store: MockStore<AppState>;
  let storeNextSpy: jest.SpyInstance;

  const searchParams: SearchHearingSlotsParams = {
    oucodeL2Code: '1',
    oucodeL3Code: 'OUCODEL32',
    ouCode: 'OUCODEL32',
    sessionStartDate: '2019-01-01',
    sessionEndDate: '2019-03-31',
    panel: 'ADULT,YOUTH',
    jurisdiction: 'CROWN'
  };
  const hearingId = 'HEARINGID1';
  const draftResult = extendDraftResult(createDraftResult({ results: ['NHMC'] }));
  const resultLineId = Object.keys(draftResult.resultLines)[0];

  const hearingDetail = {
    id: hearingId,
    hearingDays: [{ sittingDay: '2019-01-01T09:00:00.000Z' }],
    prosecutionCases: []
  } as unknown as HearingDetail;

  const hearingTypes = [
    { id: 'HEARINGTYPEA', hearingDescription: 'Hearing Type A', defaultDurationMin: 20 }
  ] as HearingType[];

  const organisationUnits = [
    {
      id: 'COURT002',
      oucode: 'OUCODEL32',
      oucodeL2Code: '1',
      oucodeL2Name: 'OUL2 X',
      oucodeL3Code: 'OUCODEL32',
      oucodeL3Name: 'Crown Court B'
    }
  ] as OrganisationUnit[];

  const rotaBusinessTypes = [
    {
      id: 'RBT001',
      typeCode: 'DVLA',
      typeDescription: 'DVLA',
      duration: false,
      jurisdiction: 'CROWN'
    },
    { id: 'RBT002', typeCode: 'TRL', typeDescription: 'TRL', duration: true, jurisdiction: 'CROWN' }
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
          pageNumber: 1
        },
        totalResults: 1
      }
    },
    referenceData: {
      hearingTypes,
      organisationUnits,
      rotaBusinessTypes
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
        provideMockStore({ initialState }),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: activatedRoute
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        }
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

    fixture = TestBed.createComponent(CrownSchedulingContainer);
    fixture.detectChanges();
  });

  it('should compile correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('submitting a hearing slot', () => {
    beforeEach(() => {
      storeNextSpy.mockClear();
    });

    const createHearingSlot = (data: Partial<HearingSlot> = {}) => {
      return {
        courtScheduleId: '1',
        sessionDate: '2020-01-01',
        courtSession: 'AM',
        courtHouseName: 'Crown Court B',
        courtRoomName: 'Courtroom 01',
        ouCode: 'OUCODEL32',
        ...data
      } as HearingSlot;
    };

    const submitHearingSlotAllocations = (
      hearingSlotAllocations: HearingSlotAllocation[],
      hearingType: HearingType = hearingTypes[0]
    ) => {
      fixture.debugElement
        .query(By.directive(TestCrownSchedulingComponent))
        .componentInstance.hearingSlotAllocationsSubmit.emit({
          hearingSlotAllocations,
          hearingType
        });
    };

    it('should handle submitting a non-duration based slot', () => {
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z'
        }
      ]);

      expect(storeNextSpy.mock.calls.pop()[0]).toMatchSnapshot();
    });

    it('should handle submitting a duration-based slot with a known duration', () => {
      submitHearingSlotAllocations([
        {
          hearingSlot: createHearingSlot({ businessType: 'TRL' }),
          hearingSlotTime: '2020-01-01T10:00:00.000Z',
          duration: 120
        }
      ]);

      expect(storeNextSpy.mock.calls.pop()[0]).toMatchSnapshot();
    });

    it('should not book when no hearing type is selected', () => {
      submitHearingSlotAllocations(
        [
          {
            hearingSlot: createHearingSlot({ businessType: 'DVLA' }),
            hearingSlotTime: '2020-01-01T10:00:00.000Z'
          }
        ],
        null
      );

      expect(storeNextSpy).not.toHaveBeenCalled();
    });
  });

  describe('when the booking is refused', () => {
    it('should pass the session not available message to the component', () => {
      store.setState({
        ...initialState,
        results: { ...initialState.results, hasHearingSlotsBookingError: true }
      });
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.directive(TestCrownSchedulingComponent)).componentInstance
          .bookingErrors
      ).toEqual([
        { id: 'backendError', message: 'MANAGE_HEARING.SESSION_NOT_AVAILABLE', shouldFocus: true }
      ]);
    });
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
    totalResults: {{ totalResults }}
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
  @Input() bookingErrors: ValidationError[] = [];
  @Output() cancel = new EventEmitter<void>();
  @Output() filtersSubmit = new EventEmitter<CrownSchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<AllocateHearingParams>();
  @Output() pageChange = new EventEmitter<number>();
}
