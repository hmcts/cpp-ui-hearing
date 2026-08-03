import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  getLocalJusticeAreas,
  getHearingTypes,
  getRotaBusinessTypes,
  HearingType,
  LocalJusticeArea,
  OrganisationUnit,
  RotaBusinessType,
  getOrganisationUnits,
  HearingPriority,
  BookingType,
  defaultHearingTypePlaceHolder
} from '@cpp/reference-data';
import { select, Store } from '@ngrx/store';
import moment from 'moment';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { getCurrentHearing, getRouteQueryParams, HearingDetail } from '../../../../core';
import {
  createNameAddressResultPromptForCourtCentre,
  createDraftResultPromptsFromValueMap,
  getDurationValueFromMinutes,
  isNameAddressPromptChoice
} from '../../../core/helpers';
import { DraftResultActions, getDraftResultLineById, ResultsState } from '../../../core/store';
import { ExtendedResolvedDraftResultLine } from '../../../results.interfaces';
import { AllocationQueryParams } from '../guards/allocation.guard';
import { ProvisionalBookingService } from '../services/provisionalBooking.service';
import {
  getSearchMetadata,
  getSearchParams,
  getSearchResults,
  SchedulingFilters,
  SearchHearingSlotsParams,
  HearingSlot,
  HearingSlotAllocation
} from '@cpp/scheduling';
import { MagistratesSchedulingFilters } from '../types/allocation';

export interface AllocateHearingParams {
  hearingSlotAllocations?: HearingSlotAllocation[];
  hearingType?: HearingType;
  priority?: HearingPriority;
  bookingType?: BookingType;
}
import { AsyncPipe } from '@angular/common';
import { MagistratesSchedulingComponent } from '../components/magistrates.component';
@Component({
  selector: 'magistrates-scheduling-container',
  template: `
    <magistrates-scheduling
      [currentPage]="currentPage$ | async"
      [filters]="filters$ | async"
      [hearingSlots]="searchResult$ | async"
      [hearingTypes]="hearingTypes$ | async"
      [organisationUnits]="organisationUnits$ | async"
      [pageSize]="pageSize$ | async"
      [rotaBusinessTypes]="rotaBusinessTypes$ | async"
      [totalResults]="totalResults$ | async"
      (cancel)="handleReturnToResults()"
      (filtersSubmit)="handleFiltersSubmit($event)"
      (hearingSlotAllocationsSubmit)="hearingSubmitAllocations($event)"
      (pageChange)="handlePageChange($event)"
      [hearingData]="hearing$ | async"
    >
    </magistrates-scheduling>
  `,
  imports: [MagistratesSchedulingComponent, AsyncPipe]
})
export class MagistratesSchedulingContainer {
  currentPage$: Observable<number>;
  defaultFilters$: Observable<Partial<MagistratesSchedulingFilters>>;
  filters$: Observable<Partial<SchedulingFilters>>;
  localJusticeAreas$: Observable<LocalJusticeArea[]>;
  organisationUnits$: Observable<OrganisationUnit[]>;
  pageSize$: Observable<number>;
  rotaBusinessTypes$: Observable<RotaBusinessType[]>;
  hearingTypes$: Observable<HearingType[]>;
  searchResult$: Observable<HearingSlot[]>;
  totalResults$: Observable<number>;
  courtId: string;
  hearing$: Observable<HearingDetail>;

  constructor(
    private store: Store<ResultsState>,
    private route: ActivatedRoute,
    private router: Router,
    private provisionalBookingService: ProvisionalBookingService
  ) {
    this.store.pipe(select(getRouteQueryParams)).subscribe(params => {
      this.courtId = params && params.courtId;
    });

    const metadata$ = this.store.pipe(select(getSearchMetadata));

    this.currentPage$ = metadata$.pipe(map(metadata => metadata.currentPage));

    this.defaultFilters$ = combineLatest([this.store.pipe(select(getOrganisationUnits))]).pipe(
      take(1),
      map(([organisationUnits]) => {
        let organisationUnit = undefined;
        if (this.courtId) {
          organisationUnit = organisationUnits.find(ou => ou.id === this.courtId);
        }
        return {
          organisationUnit,
          sessionStartDate: null,
          sessionEndDate: null,
          courtRoomId: null
        } as Partial<SearchHearingSlotsParams>;
      })
    );

    this.filters$ = this.store.pipe(select(getSearchParams)).pipe(
      switchMap(filters => {
        if (filters) {
          return this.store.pipe(
            take(1),
            map(state => {
              const { ...params } = filters as SearchHearingSlotsParams;

              const organisationUnits = getOrganisationUnits(state);
              let hearingType = defaultHearingTypePlaceHolder;

              return {
                ...params,
                hearingType,
                courtRoomId: params.courtRoomId,
                organisationUnit: organisationUnits.find(ou => ou.oucode === params.ouCode)
              };
            })
          );
        }
        return this.defaultFilters$;
      })
    );

    this.hearingTypes$ = this.store.pipe(select(getHearingTypes));
    this.localJusticeAreas$ = this.store.pipe(select(getLocalJusticeAreas));
    this.organisationUnits$ = this.store.pipe(select(getOrganisationUnits));
    this.pageSize$ = metadata$.pipe(map(metadata => metadata.pageSize));
    this.rotaBusinessTypes$ = this.store.pipe(select(getRotaBusinessTypes));
    this.searchResult$ = this.store.pipe(select(getSearchResults));
    this.totalResults$ = metadata$.pipe(map(metadata => metadata.totalResults));

    this.hearing$ = this.store.select(getCurrentHearing);
  }

  handleFiltersSubmit({
    hearingType,
    organisationUnit,
    ...filters
  }: MagistratesSchedulingFilters): void {
    let hearingTypeId;

    if (hearingType && hearingType.id && hearingType.id !== defaultHearingTypePlaceHolder.id) {
      hearingTypeId = hearingType.id;
    }
    this.reloadWithQueryParams({
      ...filters,
      hearingTypeId,
      sessionEndDate:
        filters.sessionEndDate ||
        moment(filters.sessionStartDate).add(6, 'weeks').subtract(1, 'day').format('YYYY-MM-DD'),
      ouCode: organisationUnit ? organisationUnit.oucode : undefined,
      pageNumber: 1
    });
  }

  handlePageChange(pageNumber: number): void {
    this.store
      .pipe(
        select(getSearchParams),
        take(1),
        map(params => ({ ...params, pageNumber }))
      )
      .subscribe(queryParams => {
        this.reloadWithQueryParams(queryParams);
      });
  }

  handleReturnToResults(): void {
    this.router.navigate(['/manage', this.route.snapshot.params.hearingId, 'enter-results']);
  }

  hearingSubmitAllocations({
    hearingSlotAllocations,
    hearingType,
    ...params
  }: AllocateHearingParams) {
    const parentParams = this.route.parent?.snapshot.params || {};
    const currentParams = this.route.snapshot.params;
    const { hearingId, resultLineId } = { ...parentParams, ...currentParams };

    combineLatest([
      this.organisationUnits$,
      this.rotaBusinessTypes$,
      this.store.pipe(select(getDraftResultLineById(resultLineId))),
      this.filters$
    ])
      .pipe(
        take(1),
        switchMap(([organisationUnits, rotaBusinessTypes, resultLine, filters]) => {
          const { promptChoices } = resultLine as ExtendedResolvedDraftResultLine;
          const courtScheduleBookings = hearingSlotAllocations.map(allocation => ({
            courtScheduleId: allocation.hearingSlot.courtScheduleId,
            hearingStartTime: allocation.hearingSlotTime
          }));

          // We need the take the earliest hearing slot from our array of hearing slots.
          // As the hearing slots are already sorted by scheduling slots component, we would always
          // take the first element from the array when we populate the next hearing for mags result.
          const { hearingSlot, hearingSlotTime, duration } = hearingSlotAllocations[0];
          const redirectTo = ['/manage', hearingId, 'enter-results'];
          const rotaBusinessType = rotaBusinessTypes.find(
            ({ typeCode }) => typeCode === hearingSlot.businessType
          );

          const promptRefToValueMap = {
            HDATE: hearingSlot.sessionDate,
            timeOfHearing: moment(hearingSlotTime).format('HH:mm'),
            HCROOM: hearingSlot.courtRoomName,
            HTYPE: hearingType.hearingDescription,
            // When rotaBusinessType is of duration type, then we apply the duration
            // belonging to the original search filters, and otherwise, the full
            // duration of the session. For any other businessType, it does not
            // apply so we default to the default for the hearing type.
            HEST: getDurationValueFromMinutes(
              rotaBusinessType && rotaBusinessType.duration
                ? // AD = ALL DAY -> 6 hours; else if PM & AM --> 3 hours
                  duration || (hearingSlot.courtSession === 'AD' ? 360 : 180)
                : // default to 20 minutes if there is no default duration available
                  hearingType.defaultDurationMin || 20
            )
          };

          return this.provisionalBookingService
            .bookProvisionalHearingSlots({ hearingId, courtScheduleBookings })
            .pipe(
              map(({ bookingId }) => {
                return DraftResultActions.updateResultPromptsForDraftResultLine({
                  resultLineId,
                  redirectTo,
                  resultPrompts: [
                    ...createDraftResultPromptsFromValueMap(promptChoices, {
                      ...promptRefToValueMap,
                      bookingReference: bookingId
                    }),
                    createNameAddressResultPromptForCourtCentre(
                      promptChoices.find(isNameAddressPromptChoice),
                      organisationUnits.find(ou => ou.oucode === hearingSlot.ouCode)
                    )
                  ]
                });
              })
            );
        })
      )
      .subscribe(this.store);
  }

  private reloadWithQueryParams(params: SearchHearingSlotsParams): void {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      fragment: '_',
      queryParams: {
        mf: JSON.stringify(params)
      } as AllocationQueryParams,
      queryParamsHandling: 'merge'
    });
  }
}
