import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ValidationError } from '@cpp/pdk';
import { HearingType, OrganisationUnit, RotaBusinessType } from '@cpp/reference-data';
import { HearingDetail } from '../../../../core';
import { MagistratesSchedulingComponent } from './magistrates.component';
import {
  ALLOCATION_FORM_CONFIGS,
  allocationFormConfigs,
  SchedulingFilters,
  HearingSlot,
  MagistratesSchedulingFiltersComponent,
  MagistratesSchedulingSlotsComponent,
  AllocationsFormConfig,
  HearingSlotAllocation
} from '@cpp/scheduling';
import { JsonPipe } from '@angular/common';

jest.mock('../../../../core/utils/cpp-date', () => {
  const actual = jest.requireActual('../../../../core/utils/cpp-date');

  class MockCPPDate extends actual.CPPDate {
    getCurrentDate(): Date {
      return new Date('2018-02-20T00:00:00.000Z');
    }
  }

  return {
    ...actual,
    CPPDate: MockCPPDate,
    getCPPDate: () => new MockCPPDate()
  };
});

const hearingDetailsMock = {
  id: 'x',
  judiciary: [],
  hearingDays: [{ sittingDay: '2018-02-20' }]
} as HearingDetail;

describe('MagistratesSchedulingComponent', () => {
  let fixture: ComponentFixture<MagistratesSchedulingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MagistratesSchedulingComponent],
      providers: [
        {
          provide: ALLOCATION_FORM_CONFIGS,
          useValue: allocationFormConfigs
        }
      ],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(MagistratesSchedulingComponent, {
      remove: {
        imports: [MagistratesSchedulingFiltersComponent, MagistratesSchedulingSlotsComponent]
      },
      add: {
        imports: [
          MockMagistratesSchedulingFiltersComponent,
          MockMagistratesSchedulingSlotsComponent
        ]
      }
    });

    fixture = TestBed.createComponent(MagistratesSchedulingComponent);
    fixture.componentInstance.filters = {
      isSlotBased: true
    };
    fixture.componentInstance.hearingData = hearingDetailsMock;
  });

  it('should compile correctly', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should raise an error summary when submitting invalid filters', fakeAsync(() => {
    fixture.componentInstance.errors = [
      { id: 'id', message: 'Error message' }
    ] as ValidationError[];
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  }));

  it('should handle submitting valid filters', () => {
    jest.spyOn(fixture.componentInstance.filtersSubmit, 'emit');

    const filters = {
      courtRoomId: '*',
      courtSession: 'AM',
      sessionStartDate: '2019-01-01',
      panel: 'ADULT',
      businessType: '*',
      organisationUnit: {
        oucodeL3Code: 'WESTMINSTER',
        oucodeL3Name: `Westminster Magistrates' Court`
      } as OrganisationUnit
    } as SchedulingFilters;

    fixture.componentInstance.filters = filters;
    fixture.componentInstance.filtersSubmit.emit(filters);

    expect(fixture.componentInstance.filtersSubmit.emit).toHaveBeenCalledWith(filters);
  });

  it('should remove falsy values when submitting filters', () => {
    jest.spyOn(fixture.componentInstance.filtersSubmit, 'emit');

    const filters = {
      courtRoomId: '*',
      courtSession: 'AD',
      sessionStartDate: '2019-01-01',
      panel: 'ADULT',
      businessType: undefined,
      organisationUnit: {
        oucodeL3Code: 'WESTMINSTER',
        oucodeL3Name: `Westminster Magistrates' Court`
      } as OrganisationUnit
    } as SchedulingFilters;

    fixture.componentInstance.filters = filters;
    fixture.componentInstance.filtersSubmit.emit(filters);

    expect(fixture.componentInstance.filtersSubmit.emit).toHaveBeenCalledWith(filters);
  });

  it('should apply existing filters to the form', () => {
    jest.spyOn(fixture.componentInstance.filtersSubmit, 'emit');

    const filters = {
      oucodeL2Code: '1',
      courtSession: 'AM',
      sessionStartDate: '2019-01-01',
      sessionEndDate: '2019-01-31',
      panel: 'ADULT',
      businessType: 'HEARING_TYPE'
    } as SchedulingFilters;

    fixture.componentInstance.filters = filters;
    fixture.componentInstance.filtersSubmit.emit(filters);

    expect(fixture.componentInstance.filtersSubmit.emit).toHaveBeenCalledWith(filters);
  });

  it('should display the courtrooms for the selected organisation unit', fakeAsync(() => {
    fixture.componentInstance.filters = {
      organisationUnit: {
        id: '*',
        courtrooms: [
          {
            id: 'COURTROOM_1',
            courtroomId: 1,
            courtroomName: 'Court room 1'
          }
        ]
      } as OrganisationUnit
    };
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  }));

  it('should render a search containing no results', () => {
    fixture.componentInstance.totalResults = 0;
    fixture.componentInstance.hearingSlots = [];
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  describe('when hearing slots exist', () => {
    const mockHearingSlots = [
      {
        courtScheduleId: 'A',
        sessionDate: '2019-10-31',
        courtHouseName: `Lavender Hill Magistrates' Court`,
        courtRoomName: 'Courtroom 2',
        courtSession: 'AM',
        businessType: 'AT',
        availableDuration: 0,
        maxDuration: 0,
        availableSlots: 10,
        maxSlots: 20
      },
      {
        courtScheduleId: 'B',
        sessionDate: '2019-10-31',
        courtHouseName: `Lavender Hill Magistrates' Court`,
        courtRoomName: 'Courtroom 2',
        courtSession: 'AM',
        businessType: 'TRL',
        availableSlots: 0,
        maxSlots: 0,
        availableDuration: 90,
        maxDuration: 195
      },
      {
        courtScheduleId: 'C',
        sessionDate: '2019-11-01',
        courtHouseName: `Lavender Hill Magistrates' Court`,
        courtRoomName: 'Courtroom 2',
        courtSession: 'AD',
        businessType: 'AT',
        availableDuration: 0,
        maxDuration: 0,
        availableSlots: 10,
        maxSlots: 20
      },
      {
        courtScheduleId: 'D',
        sessionDate: '2019-11-01',
        courtHouseName: `Lavender Hill Magistrates' Court`,
        courtRoomName: 'Courtroom 1',
        courtSession: 'AD',
        businessType: 'AT',
        availableDuration: 0,
        maxDuration: 0,
        availableSlots: 10,
        maxSlots: 20
      },
      {
        courtScheduleId: 'E',
        sessionDate: '2019-11-01',
        courtHouseName: `Westminster Magistrates' Court`,
        courtRoomName: 'Courtroom 2',
        courtSession: 'AD',
        businessType: 'AT',
        availableDuration: 0,
        maxDuration: 0,
        availableSlots: 10,
        maxSlots: 20
      },
      {
        courtScheduleId: 'F',
        sessionDate: '2025-01-24',
        courtHouseName: `Lavender Hill Magistrates' Court`,
        courtRoomName: 'Courtroom 1',
        courtSession: 'AD',
        businessType: 'TRL',
        allDaySplit: true,
        availableDuration: 0,
        availableDurationForMorning: 90,
        availableDurationForAfternoon: 120,
        availableSlots: 0,
        maxDuration: 0,
        maxDurationForMorning: 90,
        maxDurationForAfternoon: 120,
        maxSlots: 0
      }
    ] as HearingSlot[];

    beforeEach(() => {
      fixture.componentInstance.filters = { availableDurationMins: 99 };
      fixture.componentInstance.currentPage = 1;
      fixture.componentInstance.totalResults = 3;
      fixture.componentInstance.hearingSlots = [mockHearingSlots[0], mockHearingSlots[1]];
      fixture.detectChanges();
    });

    it('should render the slots', () => {
      expect(fixture).toMatchSnapshot();
    });
  });
});

@Component({
  selector: 'magistrates-scheduling-filters',
  template: `
    <div>
      <p>Mock Scheduling Filters</p>
      <p>organisationUnits: {{ organisationUnits | json }}</p>
      <p>rotaBusinessTypes: {{ rotaBusinessTypes | json }}</p>
      <p>defaultValues: {{ defaultValues | json }}</p>
      <p>minimumDate: {{ minimumDate | json }}</p>
    </div>
  `,
  imports: [JsonPipe]
})
class MockMagistratesSchedulingFiltersComponent {
  @Input() organisationUnits: OrganisationUnit[];
  @Input() rotaBusinessTypes: RotaBusinessType[];
  @Input() defaultValues: Partial<SchedulingFilters>;
  @Input() minimumDate: string;
  @Output() filtersSubmit = new EventEmitter<SchedulingFilters>();
  @Output() errors = new EventEmitter<ValidationError[]>();
}

@Component({
  selector: 'magistrates-scheduling-slots',
  template: `
    <div>
      <p>Mock Scheduling Slots</p>
      <p>selectionMode: {{ selectionMode }}</p>
      <p>formConfig: {{ formConfig | json }}</p>
      <p>currentPage: {{ currentPage }}</p>
      <p>hearingSlotMinutes: {{ hearingSlotMinutes }}</p>
      <p>hearingSlots: {{ hearingSlots | json }}</p>
      <p>hearingTypes: {{ hearingTypes | json }}</p>
      <p>pageSize: {{ pageSize }}</p>
      <p>rotaBusinessTypes: {{ rotaBusinessTypes | json }}</p>
      <p>totalResults: {{ totalResults }}</p>
    </div>
  `,
  imports: [JsonPipe]
})
class MockMagistratesSchedulingSlotsComponent {
  @Input() selectionMode: string;
  @Input() formConfig: AllocationsFormConfig;
  @Input() currentPage: number;
  @Input() hearingSlotMinutes: number;
  @Input() hearingSlots: HearingSlot[];
  @Input() hearingTypes: HearingType[];
  @Input() pageSize: number;
  @Input() rotaBusinessTypes: RotaBusinessType[];
  @Input() totalResults: number;
  @Output() errors = new EventEmitter<ValidationError[]>();
  @Output() hearingSlotAllocations = new EventEmitter<{
    hearingSlotAllocations: HearingSlotAllocation[];
    hearingType: HearingType;
  }>();
  @Output() pageChange = new EventEmitter<number>();

  reset() {}
}
