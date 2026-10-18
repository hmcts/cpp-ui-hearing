import { Component, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  defaultHearingTypePlaceHolder,
  getHearingTypes,
  getOrganisationUnits,
  getRotaBusinessTypesByJurisdiction,
  HearingType,
  OrganisationUnit,
  RotaBusinessType
} from '@cpp/reference-data';
import { select, Store } from '@ngrx/store';
import moment from 'moment';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { ValidationError } from '@cpp/pdk';
import { TranslateService } from '@ngx-translate/core';
import { getCurrentHearing, getRouteQueryParams, HearingDetail } from '../../../../core';
import { getDurationValueFromMinutes } from '../../../core/helpers';
import {
  getHearingSlotsBookingError,
  HearingSlotsBookingActions,
  ResultsState
} from '../../../core/store';
import { AllocationQueryParams } from '../guards/allocation.guard';
import { HEARING_SLOTS_BOOKING_ERROR_MESSAGE_KEYS } from '../types/allocation';
import {
  CrownSchedulingFilters,
  getSearchMetadata,
  getSearchParams,
  getSearchResults,
  HearingSlot,
  SearchHearingSlotsParams,
  sessionFilterFromParams
} from '@cpp/scheduling';
import { AsyncPipe } from '@angular/common';
import { CrownSchedulingComponent } from '../components/crown-scheduling.component';
import { AllocateHearingParams } from './magistrates.container';

@Component({
  selector: 'crown-scheduling-container',
  template: `
    <crown-scheduling
      [currentPage]="currentPage$ | async"
      [filters]="filters$ | async"
      [hearingSlots]="searchResult$ | async"
      [hearingTypes]="hearingTypes$ | async"
      [organisationUnits]="organisationUnits$ | async"
      [pageSize]="pageSize$ | async"
      [rotaBusinessTypes]="rotaBusinessTypes$ | async"
      [totalResults]="totalResults$ | async"
      [hearingData]="hearing$ | async"
      [bookingErrors]="bookingErrors()"
      (cancel)="handleReturnToResults()"
      (filtersSubmit)="handleFiltersSubmit($event)"
      (hearingSlotAllocationsSubmit)="hearingSubmitAllocations($event)"
      (pageChange)="handlePageChange($event)"
    >
    </crown-scheduling>
  `,
  imports: [CrownSchedulingComponent, AsyncPipe]
})
export class CrownSchedulingContainer {
  currentPage$: Observable<number>;
  defaultFilters$: Observable<Partial<CrownSchedulingFilters>>;
  filters$: Observable<Partial<CrownSchedulingFilters>>;
  organisationUnits$: Observable<OrganisationUnit[]>;
  pageSize$: Observable<number>;
  rotaBusinessTypes$: Observable<RotaBusinessType[]>;
  hearingTypes$: Observable<HearingType[]>;
  searchResult$: Observable<HearingSlot[]>;
  totalResults$: Observable<number>;
  hearing$: Observable<HearingDetail>;
  private readonly hearingSlotsBookingError = this.store.selectSignal(getHearingSlotsBookingError);
  readonly bookingErrors = computed<ValidationError[]>(() => {
    const code = this.hearingSlotsBookingError()?.error?.code;
    return code
      ? [
          {
            id: 'backendError',
            message: this.translateService.instant(HEARING_SLOTS_BOOKING_ERROR_MESSAGE_KEYS[code]),
            shouldFocus: true
          }
        ]
      : [];
  });

  constructor(
    private store: Store<ResultsState>,
    private route: ActivatedRoute,
    private router: Router,
    private translateService: TranslateService
  ) {
    const metadata$ = this.store.pipe(select(getSearchMetadata));

    this.currentPage$ = metadata$.pipe(map(metadata => metadata.currentPage));

    this.defaultFilters$ = combineLatest([
      this.store.pipe(select(getOrganisationUnits)),
      this.store.pipe(select(getRouteQueryParams))
    ]).pipe(
      map(([organisationUnits, queryParams]) => {
        const courtCentreId = queryParams?.courtId;
        let organisationUnit = undefined;
        if (courtCentreId) {
          organisationUnit = organisationUnits.find(ou => ou.id === courtCentreId);
        }

        return {
          organisationUnit,
          courtRoomId: null,
          panel: 'ADULT,YOUTH',
          hearingType: defaultHearingTypePlaceHolder
        } as Partial<CrownSchedulingFilters>;
      })
    );

    this.filters$ = combineLatest([
      this.store.pipe(select(getSearchParams)),
      this.store.pipe(select(getHearingTypes)),
      this.store.pipe(select(getOrganisationUnits))
    ]).pipe(
      switchMap(([filters, hearingTypes, organisationUnits]) => {
        if (!filters) {
          return this.defaultFilters$;
        }
        const { oucodeL3Code: _oucodeL3Code, ...params } = filters as SearchHearingSlotsParams;
        const fromParams = params.hearingTypeId
          ? hearingTypes.find(t => t.id === params.hearingTypeId)
          : undefined;
        const hearingType = fromParams || defaultHearingTypePlaceHolder;

        return of({
          ...params,
          courtRoomId: params.courtRoomId,
          organisationUnit: organisationUnits.find(ou => ou.oucode === params.ouCode),
          hearingType,
          sessionStatusFilter: sessionFilterFromParams({
            courtRoomId: params.courtRoomId,
            status: params.status
          })
        } as Partial<CrownSchedulingFilters>);
      })
    );

    this.hearingTypes$ = this.store.pipe(select(getHearingTypes));
    this.organisationUnits$ = this.store.pipe(select(getOrganisationUnits));
    this.pageSize$ = metadata$.pipe(map(metadata => metadata.pageSize));
    this.rotaBusinessTypes$ = this.store.pipe(select(getRotaBusinessTypesByJurisdiction('CROWN')));
    this.searchResult$ = this.store.pipe(select(getSearchResults));
    this.totalResults$ = metadata$.pipe(map(metadata => metadata.totalResults));

    this.hearing$ = this.store.select(getCurrentHearing);
  }

  handleFiltersSubmit({
    organisationUnit,
    sessionStatusFilter: _sessionStatusFilter,
    hearingType,
    ...filters
  }: CrownSchedulingFilters): void {
    let hearingTypeId: string;

    if (hearingType && hearingType.id && hearingType.id !== defaultHearingTypePlaceHolder.id) {
      hearingTypeId = hearingType.id;
    }
    this.reloadWithQueryParams({
      ...filters,
      hearingTypeId,
      sessionEndDate:
        filters.sessionEndDate ||
        moment(filters.sessionStartDate).add(3, 'months').subtract(1, 'day').format('YYYY-MM-DD'),
      ouCode: organisationUnit ? organisationUnit.oucode : undefined,
      pageNumber: 1,
      panel: 'ADULT,YOUTH',
      jurisdiction: 'CROWN'
    } as SearchHearingSlotsParams);
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

  hearingSubmitAllocations({ hearingSlotAllocations, hearingType }: AllocateHearingParams): void {
    if (!hearingType || !hearingSlotAllocations?.length) {
      return;
    }

    const parentParams = this.route.parent?.snapshot.params || {};
    const currentParams = this.route.snapshot.params;
    const { hearingId, resultLineId } = { ...parentParams, ...currentParams };

    combineLatest([this.organisationUnits$, this.rotaBusinessTypes$])
      .pipe(
        take(1),
        map(([organisationUnits, rotaBusinessTypes]) => {
          const courtScheduleBookings = hearingSlotAllocations.map(allocation => ({
            courtScheduleId: allocation.hearingSlot.courtScheduleId,
            hearingStartTime: allocation.hearingSlotTime,
            duration: allocation.duration
          }));
          const { hearingSlot, hearingSlotTime, duration } = hearingSlotAllocations[0];
          const redirectTo = ['/manage', hearingId, 'enter-results'];
          const rotaBusinessType = rotaBusinessTypes.find(
            ({ typeCode }) => typeCode === hearingSlot.businessType
          );

          const promptRefToValueMap: Record<string, unknown> = {
            fixedDate: hearingSlot.sessionDate,
            HDATE: hearingSlot.sessionDate,
            timeOfHearing: moment(hearingSlotTime).format('HH:mm'),
            HCROOM: hearingSlot.courtRoomName,
            HTYPE: hearingType.hearingDescription,
            HEST: getDurationValueFromMinutes(
              rotaBusinessType && rotaBusinessType.duration
                ? duration || (hearingSlot.courtSession === 'AD' ? 360 : 180)
                : hearingType.defaultDurationMin || 20
            )
          };

          return HearingSlotsBookingActions.bookHearingSlots({
            hearingId,
            resultLineId,
            courtScheduleBookings,
            promptRefToValueMap,
            courtCentre: organisationUnits.find(ou => ou.oucode === hearingSlot.ouCode),
            redirectTo
          });
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
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
