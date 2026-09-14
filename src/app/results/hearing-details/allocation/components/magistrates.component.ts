import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
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
import { HearingDetail } from '../../../../core';
import {
  ALLOCATION_FORM_CONFIGS,
  AllocationsFormConfig,
  HearingSlotAllocation,
  MagistratesSchedulingFiltersComponent,
  MagistratesSchedulingSlotsComponent,
  SchedulingFilters,
  HearingSlot
} from '@cpp/scheduling';

@Component({
  selector: 'magistrates-scheduling',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div pdk-padding="6" pdk-margin-bottom="6" class="magistrates-scheduling-filters--bordered">
      @if (displayErrors) {
      <pdk-error-summary [errors]="displayErrors"></pdk-error-summary>
      }
      <magistrates-scheduling-filters
        [organisationUnits]="organisationUnits"
        [rotaBusinessTypes]="rotaBusinessTypes"
        [defaultValues]="filters"
        (filtersSubmit)="handleSubmitFilters($event)"
        (errors)="errors = $event"
      >
      </magistrates-scheduling-filters>
      @if (totalResults > -1) {
      <pdk-inset-text>
        <b
          >{{ totalResults }} session{{ totalResults === 1 ? '' : 's' }} found. Only sessions with
          available time or slots are returned</b
        >
      </pdk-inset-text>
      } @if (totalResults > 0) {
      <div id="magistrates-scheduling-slots">
        <magistrates-scheduling-slots
          #slotsRef
          [selectionMode]="filters?.isMultiday ? 'multi' : 'single'"
          [formConfig]="allocationFormConfig"
          [currentPage]="currentPage"
          [hearingSlotMinutes]="filters?.availableDurationMins"
          [hearingSlots]="hearingSlots"
          [hearingType]="filters?.hearingType"
          [hearingTypes]="hearingTypes"
          [pageSize]="pageSize"
          [rotaBusinessTypes]="rotaBusinessTypes"
          [totalResults]="totalResults"
          (errors)="errors = $event"
          (hearingSlotAllocations)="hearingSlotAllocationsSubmit.emit($event)"
          (pageChange)="pageChange.emit($event)"
        >
        </magistrates-scheduling-slots>
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
    MagistratesSchedulingFiltersComponent,
    PdkInsetTextComponent,
    MagistratesSchedulingSlotsComponent,
    PdkLinkDirective
  ]
})
export class MagistratesSchedulingComponent {
  @Input() currentPage = 0;
  @Input() filters?: Partial<SchedulingFilters>;
  @Input() hearingSlots: HearingSlot[] = [];
  @Input() hearingTypes: HearingType[] = [];
  @Input() organisationUnits: OrganisationUnit[] = [];
  @Input() pageSize = 10;
  @Input() rotaBusinessTypes: RotaBusinessType[] = [];
  @Input() totalResults = -1;
  @Input() hearingData: HearingDetail;
  /** Errors supplied by the container (e.g. a refused reservation), merged with errors from the child form/slots components rather than replacing them. */
  @Input() externalErrors: ValidationError[] | null;
  @Output() cancel = new EventEmitter<unknown>();
  @Output() filtersSubmit = new EventEmitter<SchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<{
    hearingSlotAllocations: HearingSlotAllocation[];
    hearingType: HearingType;
  }>();
  @Output() pageChange = new EventEmitter<number>();
  @ViewChild('slotsRef') slotsRef: MagistratesSchedulingSlotsComponent;

  errors: ValidationError[] | null;

  constructor(
    @Inject(ALLOCATION_FORM_CONFIGS)
    private allocationFormConfigs: Record<string, AllocationsFormConfig>
  ) {}

  get allocationFormConfig(): AllocationsFormConfig {
    return this.allocationFormConfigs['showHearingType'];
  }

  get displayErrors(): ValidationError[] | null {
    if (!this.externalErrors && !this.errors) {
      return null;
    }
    return [...(this.externalErrors || []), ...(this.errors || [])];
  }

  handleSubmitFilters(filters: SchedulingFilters) {
    if (this.slotsRef) {
      this.slotsRef.reset();
    }
    this.filtersSubmit.emit(filters);
  }
}
