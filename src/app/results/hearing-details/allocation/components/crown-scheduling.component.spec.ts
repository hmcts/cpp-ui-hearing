import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@cpp/pdk';
import { HearingType, OrganisationUnit, RotaBusinessType } from '@cpp/reference-data';
import { HearingDetail } from '../../../../core';
import { CrownSchedulingComponent } from './crown-scheduling.component';
import {
  ALLOCATION_FORM_CONFIGS,
  allocationFormConfigs,
  AllocationsFormConfig,
  CrownSchedulingFilters,
  CrownSchedulingFiltersComponent,
  CrownSchedulingSlotsComponent,
  HearingSlot,
  SchedulingSlotAllocationSubmit
} from '@cpp/scheduling';
import { JsonPipe } from '@angular/common';

const hearingDetailsMock = {
  id: 'x',
  judiciary: [],
  hearingDays: [{ sittingDay: '2018-02-20' }]
} as HearingDetail;

describe('CrownSchedulingComponent', () => {
  let fixture: ComponentFixture<CrownSchedulingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CrownSchedulingComponent],
      providers: [
        {
          provide: ALLOCATION_FORM_CONFIGS,
          useValue: allocationFormConfigs
        }
      ],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(CrownSchedulingComponent, {
      remove: {
        imports: [CrownSchedulingFiltersComponent, CrownSchedulingSlotsComponent]
      },
      add: {
        imports: [MockCrownSchedulingFiltersComponent, MockCrownSchedulingSlotsComponent]
      }
    });

    fixture = TestBed.createComponent(CrownSchedulingComponent);
    fixture.componentInstance.hearingData = hearingDetailsMock;
  });

  it('should compile correctly', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  describe('when hearing slots exist', () => {
    beforeEach(() => {
      fixture.componentInstance.currentPage = 1;
      fixture.componentInstance.totalResults = 1;
      fixture.componentInstance.hearingSlots = [{ courtScheduleId: 'A' } as HearingSlot];
      fixture.detectChanges();
    });

    it('should clear the selected slots when the booking is refused', () => {
      const reset = jest.spyOn(fixture.componentInstance.slotsRef, 'reset');

      fixture.componentRef.setInput('bookingErrors', [
        { id: 'backendError', message: 'The session is fully booked' }
      ]);
      fixture.detectChanges();

      expect(reset).toHaveBeenCalled();
    });
  });

  describe('when the booking is refused', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('bookingErrors', [
        { id: 'backendError', message: 'The session is fully booked' }
      ]);
    });

    it('should raise an error summary for the refused booking', () => {
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should raise an error summary for the refused booking and invalid filters', () => {
      fixture.componentInstance.errors = [
        { id: 'id', message: 'Error message' }
      ] as ValidationError[];
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });
  });
});

@Component({
  selector: 'crown-scheduling-filters',
  template: `
    <div>
      <p>Mock Scheduling Filters</p>
      <p>organisationUnits: {{ organisationUnits | json }}</p>
      <p>rotaBusinessTypes: {{ rotaBusinessTypes | json }}</p>
      <p>defaultValues: {{ defaultValues | json }}</p>
    </div>
  `,
  imports: [JsonPipe]
})
class MockCrownSchedulingFiltersComponent {
  @Input() organisationUnits: OrganisationUnit[];
  @Input() rotaBusinessTypes: RotaBusinessType[];
  @Input() defaultValues: Partial<CrownSchedulingFilters>;
  @Output() filtersSubmit = new EventEmitter<CrownSchedulingFilters>();
  @Output() errors = new EventEmitter<ValidationError[]>();
}

@Component({
  selector: 'crown-scheduling-slots',
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
class MockCrownSchedulingSlotsComponent {
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
  @Output() hearingSlotAllocations = new EventEmitter<SchedulingSlotAllocationSubmit>();
  @Output() pageChange = new EventEmitter<number>();

  reset() {}
}
