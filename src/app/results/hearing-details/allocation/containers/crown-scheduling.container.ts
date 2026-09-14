import { Component } from '@angular/core';
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
import { TranslateService } from '@ngx-translate/core';
import { ValidationError } from '@cpp/pdk';
import moment from 'moment';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { getCurrentHearing, getRouteQueryParams, HearingDetail } from '../../../../core';
import {
  createDraftResultPromptsFromValueMap,
  createNameAddressResultPromptForCourtCentre,
  getDurationValueFromMinutes,
  isNameAddressPromptChoice
} from '../../../core/helpers';
import { DraftResultActions, getDraftResultLineById, ResultsState } from '../../../core/store';
import { ExtendedResolvedDraftResultLine } from '../../../results.interfaces';
import { AllocationQueryParams } from '../guards/allocation.guard';
import { ProvisionalBookingService } from '../services/provisionalBooking.service';
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
      [externalErrors]="bookingErrors$ | async"
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
  private static readonly SESSION_NOT_AVAILABLE_ERROR_ID = 'crown-session-not-available';

  private readonly bookingErrorSubject = new BehaviorSubject<ValidationError[] | null>(null);
  readonly bookingErrors$: Observable<ValidationError[] | null> =
    this.bookingErrorSubject.asObservable();

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

    combineLatest([
      this.organisationUnits$,
      this.rotaBusinessTypes$,
      this.store.pipe(select(getDraftResultLineById(resultLineId)))
    ])
      .pipe(
        take(1),
        switchMap(([organisationUnits, rotaBusinessTypes, resultLine]) => {
          const { promptChoices } = resultLine as ExtendedResolvedDraftResultLine;
          const existingBookingReference = (resultLine as ExtendedResolvedDraftResultLine).resultPrompts
            ?.find(prompt => prompt.promptRef === 'bookingReference')?.value as string | undefined;
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

          const courtScheduleBookings = hearingSlotAllocations.map(allocation => ({
            courtScheduleId: allocation.hearingSlot.courtScheduleId,
            hearingStartTime: allocation.hearingSlotTime,
            duration: allocation.duration
          }));

          return this.provisionalBookingService
            .bookProvisionalHearingSlots({
              hearingId,
              courtScheduleBookings,
              bookingId: existingBookingReference
            })
            .pipe(
              tap(() => this.bookingErrorSubject.next(null)),
              map(({ bookingId }) =>
                DraftResultActions.updateResultPromptsForDraftResultLine({
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
                })
              ),
              // A refusal (e.g. the session is now fully booked) must not
              // propagate to `.subscribe(this.store)`: NgRx's Store.error()
              // forwards to the shared ActionsSubject, which would end
              // dispatching for the whole application, not just this picker.
              // Catch it here, surface it to the picker, and complete with
              // no value so nothing reaches the store subscription - no
              // prompt is written and no redirect happens.
              catchError(() => {
                this.bookingErrorSubject.next([
                  {
                    id: CrownSchedulingContainer.SESSION_NOT_AVAILABLE_ERROR_ID,
                    message: this.translateService.instant('MANAGE_HEARING.SESSION_NOT_AVAILABLE'),
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
