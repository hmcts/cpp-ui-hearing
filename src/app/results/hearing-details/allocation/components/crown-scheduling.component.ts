import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  Inject,
  input,
  Input,
  Output,
  signal,
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
  CrownSchedulingFilters,
  CrownSchedulingFiltersComponent,
  CrownSchedulingSlotsComponent,
  HearingSlot,
  SchedulingSlotAllocationSubmit
} from '@cpp/scheduling';

@Component({
  selector: 'crown-scheduling',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div pdk-padding="6" pdk-margin-bottom="6" class="crown-scheduling-filters--bordered">
      @if (displayErrors()) {
      <pdk-error-summary [errors]="displayErrors()"></pdk-error-summary>
      }
      <crown-scheduling-filters
        [organisationUnits]="organisationUnits"
        [rotaBusinessTypes]="rotaBusinessTypes"
        [defaultValues]="filters"
        (filtersSubmit)="handleSubmitFilters($event)"
        (errors)="errors.set($event)"
      >
      </crown-scheduling-filters>
      @if (totalResults > -1) {
      <pdk-inset-text>
        <b
          >{{ totalResults }} session{{ totalResults === 1 ? '' : 's' }} found. Only sessions with
          available time or slots are returned</b
        >
      </pdk-inset-text>
      } @if (totalResults > 0) {
      <div id="crown-scheduling-slots">
        <crown-scheduling-slots
          #slotsRef
          [selectionMode]="'single'"
          [formConfig]="allocationFormConfig"
          [currentPage]="currentPage"
          [hearingSlotMinutes]="filters?.availableDurationMins"
          [hearingSlots]="hearingSlots"
          [hearingType]="filters?.hearingType"
          [hearingTypes]="hearingTypes"
          [pageSize]="pageSize"
          [rotaBusinessTypes]="rotaBusinessTypes"
          [totalResults]="totalResults"
          (errors)="errors.set($event)"
          (hearingSlotAllocations)="hearingSlotAllocationsSubmit.emit($event)"
          (pageChange)="pageChange.emit($event)"
        >
        </crown-scheduling-slots>
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
      .crown-scheduling-filters--bordered {
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
    CrownSchedulingFiltersComponent,
    PdkInsetTextComponent,
    CrownSchedulingSlotsComponent,
    PdkLinkDirective
  ]
})
export class CrownSchedulingComponent {
  @Input() currentPage = 0;
  @Input() filters?: Partial<CrownSchedulingFilters>;
  @Input() hearingSlots: HearingSlot[] = [];
  @Input() hearingTypes: HearingType[] = [];
  @Input() organisationUnits: OrganisationUnit[] = [];
  @Input() pageSize = 10;
  @Input() rotaBusinessTypes: RotaBusinessType[] = [];
  @Input() totalResults = -1;
  @Input() hearingData: HearingDetail;
  @Output() cancel = new EventEmitter<unknown>();
  @Output() filtersSubmit = new EventEmitter<CrownSchedulingFilters>();
  @Output() hearingSlotAllocationsSubmit = new EventEmitter<SchedulingSlotAllocationSubmit>();
  @Output() pageChange = new EventEmitter<number>();
  readonly bookingErrors = input<ValidationError[]>([]);
  @ViewChild('slotsRef') slotsRef: CrownSchedulingSlotsComponent;

  readonly errors = signal<ValidationError[] | null>(null);
  readonly displayErrors = computed(() => {
    const bookingErrors = this.bookingErrors();
    const errors = this.errors();
    return bookingErrors.length ? [...bookingErrors, ...(errors || [])] : errors;
  });

  constructor(
    @Inject(ALLOCATION_FORM_CONFIGS)
    private allocationFormConfigs: Record<string, AllocationsFormConfig>
  ) {
    effect(() => {
      if (this.bookingErrors().length) {
        this.slotsRef?.reset();
      }
    });
  }

  get allocationFormConfig(): AllocationsFormConfig {
    return this.allocationFormConfigs['showHearingType'];
  }

  handleSubmitFilters(filters: CrownSchedulingFilters) {
    if (this.slotsRef) {
      this.slotsRef.reset();
    }
    this.filtersSubmit.emit(filters);
  }
}
