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
import { TranslateService } from '@ngx-translate/core';
import { ValidationError } from '@cpp/pdk';
import moment from 'moment';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
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
import {
  BookingRefusedError,
  ProvisionalBookingService
} from '../services/provisionalBooking.service';
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
      [externalErrors]="bookingErrors$ | async"
    >
    </magistrates-scheduling>
  `,
  imports: [MagistratesSchedulingComponent, AsyncPipe]
})
export class MagistratesSchedulingContainer {
  private static readonly SESSION_NOT_AVAILABLE_ERROR_ID = 'magistrates-session-not-available';

  private readonly bookingErrorSubject = new BehaviorSubject<ValidationError[] | null>(null);
  readonly bookingErrors$: Observable<ValidationError[] | null> =
    this.bookingErrorSubject.asObservable();

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
  hearing$: Observable<HearingDetail>;

  constructor(
    private store: Store<ResultsState>,
    private route: ActivatedRoute,
    private router: Router,
    private provisionalBookingService: ProvisionalBookingService,
    private translateService: TranslateService
  ) {
    const metadata$ = this.store.pipe(select(getSearchMetadata));

    this.currentPage$ = metadata$.pipe(map(metadata => metadata.currentPage));

    this.defaultFilters$ = combineLatest([
      this.store.pipe(select(getOrganisationUnits)),
      this.store.pipe(select(getCurrentHearing)),
      this.store.pipe(select(getRouteQueryParams)),
      this.store.pipe(select(getHearingTypes))
    ]).pipe(
      map(([organisationUnits, hearing, queryParams, hearingTypes]) => {
        const courtCentreId = queryParams?.courtId;
        let organisationUnit = undefined;
        if (courtCentreId) {
          organisationUnit = organisationUnits.find(ou => ou.id === courtCentreId);
        }

        const today = moment().format('YYYY-MM-DD');
        const hearingStartDate = hearing?.hearingDays?.[0]?.sittingDay
          ? moment(hearing.hearingDays[0].sittingDay).format('YYYY-MM-DD')
          : today;
        const sessionStartDate = moment(hearingStartDate).isSameOrAfter(moment(), 'day')
          ? hearingStartDate
          : today;

        const hearingType =
          hearingTypes.find(t => t.id === hearing?.type?.id) ?? defaultHearingTypePlaceHolder;

        return {
          organisationUnit,
          sessionStartDate,
          sessionEndDate: moment(sessionStartDate)
            .add(6, 'weeks')
            .subtract(1, 'day')
            .format('YYYY-MM-DD'),
          courtRoomId: null,
          hearingType
        } as Partial<MagistratesSchedulingFilters>;
      })
    );

    this.filters$ = combineLatest([
      this.store.pipe(select(getSearchParams)),
      this.store.pipe(select(getCurrentHearing)),
      this.store.pipe(select(getHearingTypes)),
      this.store.pipe(select(getOrganisationUnits))
    ]).pipe(
      switchMap(([filters, hearing, hearingTypes, organisationUnits]) => {
        if (!filters) {
          return this.defaultFilters$;
        }
        const { oucodeL3Code: _oucodeL3Code, ...params } = filters as SearchHearingSlotsParams;
        const fromHearing = hearingTypes.find(t => t.id === hearing?.type?.id);
        const fromParams = params.hearingTypeId
          ? hearingTypes.find(t => t.id === params.hearingTypeId)
          : undefined;
        const hearingType = fromHearing || fromParams || defaultHearingTypePlaceHolder;

        return of({
          ...params,
          courtRoomId: params.courtRoomId,
          organisationUnit: organisationUnits.find(ou => ou.oucode === params.ouCode),
          hearingType
        } as Partial<SchedulingFilters>);
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
      pageNumber: 1,
      jurisdiction: 'MAGISTRATES'
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
          const existingBookingReference = (
            resultLine as ExtendedResolvedDraftResultLine
          ).resultPrompts?.find(prompt => prompt.promptRef === 'bookingReference')?.value as
            | string
            | undefined;
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
            .bookProvisionalHearingSlots({
              hearingId,
              courtScheduleBookings,
              bookingId: existingBookingReference
            })
            .pipe(
              tap(() => this.bookingErrorSubject.next(null)),
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
              }),
              // A failure must not propagate to `.subscribe(this.store)`: NgRx's
              // Store.error() forwards to the shared ActionsSubject, which would
              // end dispatching for the whole application, not just this picker.
              // Catch it here, surface it to the picker, and complete with no
              // value so nothing reaches the store subscription - no prompt is
              // written and no redirect happens.
              //
              // Only a deliberate refusal means the session is unavailable. A
              // technical failure of the same call must not claim that, or the
              // clerk is sent to re-pick a session that was never the problem.
              catchError(error => {
                this.bookingErrorSubject.next([
                  {
                    id: MagistratesSchedulingContainer.SESSION_NOT_AVAILABLE_ERROR_ID,
                    message: this.translateService.instant(
                      error instanceof BookingRefusedError
                        ? 'MANAGE_HEARING.SESSION_NOT_AVAILABLE'
                        : 'MANAGE_HEARING.SESSION_BOOKING_FAILED'
                    ),
                    shouldFocus: true
                  }
                ]);
                return EMPTY;
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
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
