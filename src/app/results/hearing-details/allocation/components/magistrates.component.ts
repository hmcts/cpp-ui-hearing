import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  ValidationError,
  PdkPaddingDirective,
  PdkMarginDirective,
  PdkErrorSummaryComponent,
  PdkInsetTextComponent,
  PdkLinkDirective
} from '@cpp/pdk';
import { CommonModule } from '@angular/common';
import { HearingType, OrganisationUnit, RotaBusinessType } from '@cpp/reference-data';
import { CPPDate, getCPPDate, HearingDetail } from '../../../../core';
import {
  ALLOCATION_FORM_CONFIGS,
  AllocationsFormConfig,
  HearingSlotAllocation,
  SchedulingFilters,
  SchedulingSlotsComponent,
  SchedulingFiltersComponent
} from '@cpp/scheduling';
import { HearingSlot } from '@cpp/scheduling';

@Component({
  selector: 'magistrates-scheduling',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div pdk-padding="6" pdk-margin-bottom="6" class="magistrates-scheduling-filters--bordered">
      @if (errors) {
      <pdk-error-summary [errors]="errors"></pdk-error-summary>
      }
      <scheduling-filters
        [organisationUnits]="organisationUnits"
        [rotaBusinessTypes]="rotaBusinessTypes"
        [defaultValues]="filters"
        [minimumDate]="minimumDate"
        (filtersSubmit)="handleSubmitFilters($event)"
        (errors)="errors = $event"
      >
      </scheduling-filters>
      @if (totalResults > -1) {
      <pdk-inset-text>
        <b
          >{{ totalResults }} session{{ totalResults === 1 ? '' : 's' }} found. Only sessions with
          available time or slots are returned</b
        >
      </pdk-inset-text>
      } @if (totalResults > 0) {
      <div id="magistrates-scheduling-slots">
        <scheduling-slots
          #slotsRef
          [selectionMode]="filters?.isMultiday ? 'multi' : 'single'"
          [formConfig]="allocationFormConfig"
          [currentPage]="currentPage"
          [hearingSlotMinutes]="filters?.availableDurationMins"
          [hearingSlots]="hearingSlots"
          [hearingTypes]="hearingTypes"
          [pageSize]="pageSize"
          [rotaBusinessTypes]="rotaBusinessTypes"
          [totalResults]="totalResults"
          (errors)="errors = $event"
          (hearingSlotAllocations)="hearingSlotAllocationsSubmit.emit($event)"
          (pageChange)="pageChange.emit($event)"
        >
        </scheduling-slots>
      </div>
      }
    </div>
    <a
      data-test-id="returnToEnterResults"
      href="javascript:void(0)"
      (click)="cancel.emit($event)"
      pdk-link
      >Cancel and return to enter results</a
    >
  `,
  styles: [
    `
      .magistrates-scheduling-filters--bordered {
        border-right: 1px solid #b1b4b6;
        border-bottom: 1px solid #b1b4b6;
        border-left: 1px solid #b1b4b6;
      }
    `
  ],
  imports: [
    CommonModule,
    PdkPaddingDirective,
    PdkMarginDirective,
    PdkErrorSummaryComponent,
    SchedulingFiltersComponent,
    PdkInsetTextComponent,
    SchedulingSlotsComponent,
    PdkLinkDirective
  ]
})
export class MagistratesSchedulingComponent implements OnInit {
  @Input() currentPage = 0;
  @Input() filters?: Partial<SchedulingFilters>;
  @Input() hearingSlots: HearingSlot[] = [];
  @Input() hearingTypes: HearingType[] = [];
  @Input() organisationUnits: OrganisationUnit[] = [];
  @Input() pageSize = 10;
  @Input() rotaBusinessTypes: RotaBusinessType[] = [];
  @Input() totalResults = -1;
  @Input() hearingData: HearingDetail;
  @Output() cancel = new EventEmitter<unknown>();
  @Output() filtersSubmit = new EventEmitter<SchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<{
    hearingSlotAllocations: HearingSlotAllocation[];
    hearingType: HearingType;
  }>();
  @Output() pageChange = new EventEmitter<number>();
  @ViewChild('slotsRef') slotsRef: SchedulingSlotsComponent;

  errors: ValidationError[] | null;
  currentHearingDate?: Date;
  minimumDate?: string;

  constructor(
    @Inject(ALLOCATION_FORM_CONFIGS)
    private allocationFormConfigs: Record<string, AllocationsFormConfig>
  ) {}

  ngOnInit() {
    const dateUtil: CPPDate = getCPPDate();
    this.currentHearingDate = dateUtil.localDate(this.hearingData.hearingDays[0].sittingDay);
    const today = dateUtil.getCurrentDate();
    this.minimumDate = dateUtil.format(today);
  }

  get allocationFormConfig(): AllocationsFormConfig {
    return this.allocationFormConfigs['showHearingType'];
  }

  handleSubmitFilters(filters: SchedulingFilters) {
    if (this.slotsRef) {
      this.slotsRef.reset();
    }
    this.filtersSubmit.emit(filters);
  }
}
