import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  getHearingTypes,
  getOrganisationUnits,
  HearingType,
  OrganisationUnit
} from '@cpp/reference-data';
import { select, Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { FormValues, CourtDetailsComponent } from './components/court-details.component';
import { combineLatest, Observable } from 'rxjs';
import { getCurrentHearing, getRouteQueryParams, HearingDetail } from '../../../core';
import { DraftResultActions, getDraftResultLineById, ResultsState } from '../../core/store';
import { ExtendedResolvedDraftResultLine } from '../../results.interfaces';
import {
  createDraftResultPromptsFromValueMap,
  createNameAddressResultPromptForCourtCentre,
  isNameAddressPromptChoice
} from '../../core/helpers';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'court-details-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <court-details
      [hearingTypes]="hearingTypes"
      [defaultValues]="defaultFilters$ | async"
      [isWeekCommencing]="isWeekCommencing"
      [weekCommencingPeriod]="1"
      [hearingData]="hearing$ | async"
      (submitData)="handleSubmit($event)"
      (cancel)="handleCancel()"
    >
    </court-details>
  `,
  imports: [CourtDetailsComponent, AsyncPipe]
})
export class CourtDetailsContainer {
  defaultHearingType: HearingType;
  isWeekCommencing = false;
  defaultFilters$: Observable<Partial<FormValues>>;
  formValues: Partial<FormValues>;

  hearingTypes: HearingType[];
  organisationUnits: OrganisationUnit[];
  hearing$: Observable<HearingDetail>;

  constructor(
    private store: Store<ResultsState>,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.store
      .pipe(select(getHearingTypes), take(1))
      .subscribe(hearingTypes => (this.hearingTypes = hearingTypes));

    this.hearing$ = this.store.select(getCurrentHearing);

    this.defaultFilters$ = combineLatest([
      this.store.pipe(select(getRouteQueryParams)),
      this.store.pipe(select(getOrganisationUnits))
    ]).pipe(
      map(([queryParams, organisationUnits]) => {
        this.isWeekCommencing = queryParams.weekCommencingType === 'WEEK_COMMENCING';
        this.organisationUnits = organisationUnits;

        const organisationUnit = this.organisationUnits.find(ou => ou.id === queryParams.courtId);

        return {
          courtCentre: organisationUnit
        };
      })
    );
  }

  handleCancel(): void {
    this.router.navigate(['/manage', this.route.snapshot.params.hearingId, 'enter-results']);
  }

  handleSubmit({
    courtCentre,
    courtRoomId,
    hearingType,
    judiciary,
    startDate,
    hearingDuration,
    startTime,
    bookingType,
    priority,
    specialRequirements
  }: FormValues): void {
    const parentParams = this.route.parent?.snapshot.params || {};
    const currentParams = this.route.snapshot.params;
    const { hearingId, resultLineId } = { ...parentParams, ...currentParams };

    this.store
      .pipe(
        select(getDraftResultLineById(resultLineId)),
        take(1),
        map(resultLine => {
          const { promptChoices } = resultLine as ExtendedResolvedDraftResultLine;

          const redirectTo = ['/manage', hearingId, 'enter-results'];

          let courtroomName: string = undefined;
          if (courtRoomId) {
            const courtroom = courtCentre.courtrooms.find(r => r.id === courtRoomId);
            courtroomName = courtroom.courtroomName;
          }
          const promptRefToValueMap = {
            fixedDate: this.isWeekCommencing ? undefined : startDate,
            weekCommencing: this.isWeekCommencing
              ? moment(startDate).startOf('isoWeek').format('YYYY-MM-DD')
              : undefined,
            reservedJudiciary: judiciary
              ? `${judiciary.forenames} ${judiciary.surname}`
              : undefined,
            timeOfHearing: startTime
              ? startTime
              : moment(`${startDate} ${courtCentre.defaultStartTime}`).format('HH:mm'),
            HCROOM: courtroomName,
            HTYPE: hearingType.hearingDescription,
            HEST: hearingDuration,
            bookingType: bookingType ? bookingType.typeCode : undefined,
            priority: priority ? priority.priorityCode : undefined,
            specialRequirements: specialRequirements ? specialRequirements.join(', ') : undefined
          };

          return DraftResultActions.updateResultPromptsForDraftResultLine({
            resultLineId,
            redirectTo,
            resultPrompts: [
              ...createDraftResultPromptsFromValueMap(promptChoices, promptRefToValueMap),
              createNameAddressResultPromptForCourtCentre(
                promptChoices.find(isNameAddressPromptChoice),
                courtCentre
              )
            ]
          });
        })
      )
      .subscribe(this.store);
  }
}
