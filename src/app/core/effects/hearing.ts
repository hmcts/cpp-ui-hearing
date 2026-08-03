import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store';
import { EMPTY, forkJoin, Observable, of, zip } from 'rxjs';
import { catchError, map, mapTo, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { v4 as uuid } from 'uuid';
import cleanDeep from 'clean-deep';

import {
  addWitness,
  ApiError,
  DownloadDocumentAction,
  ExtendMagistratesAccess,
  getSelectedHearingIsRestricted,
  getSelectedHearingIsRestrictedSuccess,
  LoadAmendingUserDetailsAction,
  LoadAmendingUserDetailsSuccessAction,
  LoadDefendantsTrackingStatusSuccessAction,
  LoadHearingDetailAction,
  LoadHearingDetailSuccessAction,
  LoadHearingEventsAction,
  LoadHearingListAction,
  LoadHearingListSuccessAction,
  SaveHearingCaseNoteAction,
  SaveHearingCaseNoteActionSuccess,
  SaveProsecutionCounselsAction,
  toggleSittingYouthCourt,
  toggleSittingYouthCourtSuccess,
  UpdatePleaAction,
  UpdateVerdictAction,
  UpdateVerdictSuccessAction
} from '../actions';
import {
  getCurrentCaseIds,
  getCurrentHearing,
  getCurrentHearingDefendants,
  getDefendantIdsFromCurrentHearing,
  getRouteQueryParams,
  getTrialTypes
} from '../selectors';
import * as HearingActions from '../actions/hearing';
import {
  CheckInProsecutorResult,
  HearingDetail,
  HearingLockState,
  IndicatedPleaData,
  SearchCriteriaAvailableHearingsType,
  TrialType,
  TrialTypeSuccessBody,
  UserDetails
} from '../model';
import { AppState } from '../reducers';
import { cloneDeep } from 'lodash-es';
import { isNullOrUndefined } from '../utils/utils';
import {
  getUserDetails,
  getUserRolePermissions,
  UsersGroupsActions,
  UsersGroupsService
} from '@cpp/users-groups';
import { getCPPDate } from '../utils/cpp-date';

import { HearingService, ListingService } from '../services';
import { ReferenceDataService } from '@cpp/reference-data';
import {
  createListingNote,
  createListingNoteSuccess,
  deleteListingNote,
  deleteListingNoteSuccess,
  ListingNotesService,
  loadListingNotes,
  showListingNoteSuccessMessage,
  updateListingNote,
  updateListingNoteSuccess
} from '@cpp/scheduling';
import { canAmendApplication } from '../selectors/user-groups';
import { CrackedIneffectiveSubReasonService } from '../services/cracked-ineffective-sub-reason.service';
import { ValidationError } from '@cpp/pdk';

@Injectable()
export class HearingEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private store: Store<AppState>,
    private hearingService: HearingService,
    private listingService: ListingService,
    private listingNotesService: ListingNotesService,
    private refDataService: ReferenceDataService,
    private usersGroupsService: UsersGroupsService,
    private crackedIneffectiveSubReasonService: CrackedIneffectiveSubReasonService
  ) {}

  getHearingList$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.LOAD_HEARING_LIST),
      switchMap((action: LoadHearingListAction) => {
        return this.hearingService
          .getHearingsByDate(
            action.payload.date,
            action.payload.courtCentreId,
            action.payload.roomId,
            action.payload.startTime,
            action.payload.endTime
          )
          .pipe(
            mergeMap(hearings => {
              const actions = [];
              actions.push(new LoadHearingListSuccessAction(hearings));
              if (action.payload.hearingId) {
                actions.push(new LoadHearingDetailAction(action.payload.hearingId));
              }
              return actions;
            }),
            catchError(error => of(new ApiError(error)))
          );
      })
    )
  );

  getCheckInHearingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.loadCheckInHearingList),
      switchMap(({ date, courtCentreId }) =>
        this.hearingService.getHearingsForCheckIn(date, courtCentreId).pipe(
          map(summaries => HearingActions.loadCheckInHearingListSuccess({ summaries })),
          catchError(error => of(new ApiError(error)))
        )
      )
    )
  );

  getHearingDetails$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.LOAD_HEARING_DETAIL),
      withLatestFrom(this.store.select(getUserDetails)),
      switchMap(([action, userDetails]: [LoadHearingDetailAction, UserDetails]) => {
        return this.hearingService.getHearing(action.hearingId).pipe(
          switchMap(hearing => {
            const requests = [];

            if (
              hearing.hearingState !== HearingLockState.INITIALISED &&
              hearing.hearingState !== HearingLockState.SHARED &&
              userDetails.userId !== hearing.amendedByUserId
            ) {
              requests.push(
                this.hearingService
                  .getUserDetails(hearing.amendedByUserId)
                  .pipe(
                    tap(amendedByUserDetails =>
                      this.store.dispatch(
                        new LoadAmendingUserDetailsSuccessAction(amendedByUserDetails)
                      )
                    )
                  )
              );
            }

            if (!!hearing.hearing.judiciary.length) {
              const ids = hearing.hearing.judiciary
                .map(judiciary => judiciary.judicialId)
                .join(',');

              requests.push(
                this.refDataService.fetchJudicialMembers({ ids }).pipe(
                  map(judiciaries => {
                    hearing.hearing.judiciary.forEach(judiciary => {
                      judiciary.judicialMember = judiciaries.find(
                        incoming => incoming.id === judiciary.judicialId
                      );
                    });

                    return hearing;
                  })
                )
              );
            }

            return !!requests.length ? forkJoin(requests).pipe(mapTo(hearing)) : of(hearing);
          }),
          map(hearing => new LoadHearingDetailSuccessAction(hearing)),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  loadDefendantsTrackingStatus$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.LOAD_DEFENDANTS_TRACKING_STATUS),
      withLatestFrom(this.store.select(getDefendantIdsFromCurrentHearing)),
      switchMap(([action, defendantIds]) => {
        return this.hearingService
          .getDefendantsTrackingStatus(defendantIds)
          .pipe(map(response => new LoadDefendantsTrackingStatusSuccessAction(response)));
      })
    )
  );

  getAmendingUserDetails$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.LOAD_AMENDING_USER_DETAILS),
      switchMap(({ userId }: LoadAmendingUserDetailsAction) => {
        return this.hearingService
          .getUserDetails(userId)
          .pipe(map(userDetails => new LoadAmendingUserDetailsSuccessAction(userDetails)));
      })
    )
  );

  getHearingEventLogs$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.LOAD_HEARING_DETAIL_SUCCESS),
      switchMap((action: LoadHearingDetailSuccessAction) => {
        this.store.dispatch(new LoadHearingEventsAction({ hearingId: action.payload.hearing.id }));
        return [getSelectedHearingIsRestricted()];
      })
    )
  );

  updatePleas$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.UPDATE_PLEA),
      withLatestFrom(this.store.pipe(select(canAmendApplication))),
      switchMap(([action, amendApplicationPermission]: [UpdatePleaAction, boolean]) => {
        const hearingId = action.payload.hearingId;
        return this.hearingService.getLoggedInUserDetails().pipe(
          switchMap((userDetails: UserDetails) => {
            const pleaList: IndicatedPleaData[] = action.payload.body.map(
              (pleaData: IndicatedPleaData) => {
                const { plea } = pleaData;
                const pleaDataCopy = cloneDeep(pleaData);

                if (
                  pleaDataCopy.allocationDecision &&
                  pleaDataCopy.allocationDecision.motReasonId === null
                ) {
                  pleaDataCopy.allocationDecision = {};
                }

                if (plea) {
                  if (plea.applicationId) {
                    pleaDataCopy.applicationId = pleaDataCopy.offenceId;
                    delete pleaDataCopy['offenceId'];
                  }
                  const pleaDetails = cleanDeep({
                    ...pleaDataCopy,
                    plea: {
                      ...plea,
                      isDelegatedPowers: undefined,
                      delegatedPowers: plea.isDelegatedPowers
                        ? {
                            userId: userDetails.userId,
                            firstName: userDetails.firstName,
                            lastName: userDetails.lastName
                          }
                        : undefined
                    },
                    indicatedPlea:
                      !!pleaDataCopy.indicatedPlea &&
                      !!pleaDataCopy.indicatedPlea.indicatedPleaValue
                        ? pleaDataCopy.indicatedPlea
                        : undefined
                  }) as IndicatedPleaData;

                  // If we have a plea whith no plea value, remove the plea object.
                  // The backend will remove the plea if previously set
                  if (pleaDetails.plea && !pleaDetails.plea.pleaValue) {
                    delete pleaDetails.plea;
                  }

                  if (
                    pleaDetails.allocationDecision &&
                    !pleaDetails.allocationDecision.motReasonId
                  ) {
                    delete pleaDetails.allocationDecision;
                  }

                  return pleaDetails;
                }

                return cleanDeep({
                  ...pleaDataCopy,
                  indicatedPlea:
                    !!pleaDataCopy.indicatedPlea && !!pleaDataCopy.indicatedPlea.indicatedPleaValue
                      ? pleaDataCopy.indicatedPlea
                      : undefined
                }) as IndicatedPleaData;
              }
            );

            const payload: any = {
              pleas: pleaList
            };

            return this.hearingService.updatePleas(hearingId, payload);
          }),
          switchMap(() =>
            this.hearingService.getHearing(hearingId).pipe(
              map(hearing => new LoadHearingDetailSuccessAction(hearing)),
              tap(() => this.router.navigate([`/manage/${action.payload.hearingId}`]))
            )
          )
        );
      }),
      catchError(error => of(new ApiError(error)))
    )
  );

  updateVerdicts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.UPDATE_VERDICT),
      switchMap((action: UpdateVerdictAction) => {
        return this.hearingService
          .updateVerdicts(action.payload.hearingId, action.payload.verdict)
          .pipe(
            map(() => new UpdateVerdictSuccessAction(action.payload)),
            tap(() => this.router.navigate([`/manage/${action.payload.hearingId}`])),
            catchError(error => of(new ApiError(error)))
          );
      })
    )
  );

  updatePresence$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.UPDATE_PRESENCE),
      switchMap((action: HearingActions.UpdatePresenceAction) => {
        return this.hearingService.updateDefendantAttendance(action.payload).pipe(
          map(() => new HearingActions.UpdatePresenceSuccessAction(action.payload)),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  saveHearingCaseNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.SAVE_HEARING_CASE_NOTE_ACTION),
      switchMap((action: SaveHearingCaseNoteAction) => {
        return this.hearingService.getLoggedInUserDetails().pipe(
          switchMap((userDetails: UserDetails) => {
            const notePayload = cloneDeep(action.payload);
            notePayload.courtClerk.userId = userDetails.userId;
            notePayload.courtClerk.firstName = userDetails.firstName;
            notePayload.courtClerk.lastName = userDetails.lastName;
            notePayload.noteDateTime = new Date().toISOString().substring(0, 19).concat('Z');

            return this.hearingService
              .saveNewNote(notePayload.originatingHearingId, notePayload)
              .pipe(
                map(() => new SaveHearingCaseNoteActionSuccess(notePayload)),
                catchError(error => of(new ApiError(error)))
              );
          })
        );
      })
    )
  );

  extendMagistrateAccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.EXTEND_MAGISTRATES_ACCESS),
      switchMap((action: ExtendMagistratesAccess) => {
        return this.hearingService.extendMagistratesAccess(action.payload).pipe(
          switchMap(() =>
            this.usersGroupsService.fetchUserPermissions().pipe(
              map(({ groups: userGroups, permissions, switchableRoles }) =>
                UsersGroupsActions.setUserPermissions({ userGroups, permissions, switchableRoles })
              ),
              catchError(error => of(new ApiError(error)))
            )
          ),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  downloadDocument$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(HearingActions.DOWNLOAD_DOCUMENT_ACTION),
        switchMap((action: DownloadDocumentAction) =>
          this.hearingService.downloadPDFCourtDocument(action.materialId).pipe(
            map(document => {
              saveAs(document);
            }),
            catchError(error => of(new ApiError(error)))
          )
        )
      ),
    { dispatch: false }
  );

  saveApplicantCounsels$ = createEffect(() =>
    this.actions$.pipe(
      ofType<HearingActions.SaveApplicantCounselsAction>(HearingActions.SAVE_APPLICANT_COUNSELS),
      mergeMap(({ payload }) => {
        const { hearingId, added, removed, updated } = payload;

        return forkJoin([
          ...added.map(counsel => this.hearingService.addApplicantCounsel(hearingId, counsel)),
          ...updated.map(counsel => this.hearingService.updateApplicantCounsel(hearingId, counsel)),
          ...removed.map(counsel =>
            this.hearingService.removeApplicantCounsel(hearingId, counsel.id)
          )
        ]).pipe(
          map(() => new HearingActions.SaveApplicantCounselsSuccessAction(payload)),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  saveRespondentCounsels$ = createEffect(() =>
    this.actions$.pipe(
      ofType<HearingActions.SaveRespondentCounselsAction>(HearingActions.SAVE_RESPONDENT_COUNSELS),
      switchMap(({ payload }) => {
        const { hearingId, added, removed, updated } = payload;

        return forkJoin([
          ...added.map(counsel => this.hearingService.addRespondentCounsel(hearingId, counsel)),
          ...updated.map(counsel =>
            this.hearingService.updateRespondentCounsel(hearingId, counsel)
          ),
          ...removed.map(counsel =>
            this.hearingService.removeRespondentCounsel(hearingId, counsel.id)
          )
        ]).pipe(
          map(() => new HearingActions.SaveRespondentCounselsSuccessAction(payload)),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  saveProsecutionCounsels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.SAVE_PROSECUTION_COUNSELS),
      switchMap((action: SaveProsecutionCounselsAction) => {
        const observableArray1 = action.payload.prosecutionCounselsToAdd.map(prosecutionCounsel =>
          this.hearingService.addProsecutionCounsel(action.payload.hearingId, prosecutionCounsel)
        );

        const observableArray2 = action.payload.prosecutionCounselsToUpdate.map(
          prosecutionCounsel =>
            this.hearingService.updateProsecutionCounsel(
              action.payload.hearingId,
              prosecutionCounsel
            )
        );

        const observableArray3 = action.payload.prosecutionCounselsToDelete.map(
          prosecutionCounsel =>
            this.hearingService.removeProsecutionCounsel(action.payload.hearingId, {
              id: prosecutionCounsel
            })
        );
        return forkJoin(observableArray1.concat(observableArray2).concat(observableArray3)).pipe(
          map(
            () =>
              new HearingActions.SaveProsecutionCounselsSuccessAction({
                prosecutionCounselsToAdd: action.payload.prosecutionCounselsToAdd,
                prosecutionCounselsToUpdate: action.payload.prosecutionCounselsToUpdate
              })
          ),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  saveDefenceCounsels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.SAVE_DEFENCE_COUNSELS),
      switchMap((action: HearingActions.SaveDefenceCounselsAction) => {
        const observableArray1 = action.payload.defenceCounselsToAdd.map(defenceCounsel =>
          this.hearingService.addDefenceCounsel(action.payload.hearingId, defenceCounsel)
        );

        const observableArray2 = action.payload.defenceCounselsToUpdate.map(defenceCounsel =>
          this.hearingService.updateDefenceCounsel(action.payload.hearingId, defenceCounsel)
        );

        const observableArray3 = action.payload.defenceCounselsToDelete.map(defenceCounsel =>
          this.hearingService.removeDefenceCounsel(action.payload.hearingId, {
            id: defenceCounsel
          })
        );

        const allObservables = observableArray1.concat(observableArray2).concat(observableArray3);

        return forkJoin(allObservables).pipe(
          switchMap(() => [
            new HearingActions.AddDefenceCounselsSuccessAction({
              defenceCounselsToAdd: action.payload.defenceCounselsToAdd
            }),
            new HearingActions.EditDefenceCounselsSuccessAction({
              defenceCounselsToEdit: action.payload.defenceCounselsToUpdate
            }),
            new HearingActions.RemoveDefenceCounselsSuccessAction({
              defenceCounselsToRemove: action.payload.defenceCounselsToDelete
            })
          ]),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  saveIntermediaryCounsels$ = createEffect(() =>
    this.actions$.pipe(
      ofType<HearingActions.SaveIntermediaryCounselsAction>(
        HearingActions.SAVE_INTERMEDIARY_COUNSELS
      ),
      switchMap(({ payload }) => {
        const { hearingId, added, removed, updated } = payload;

        return forkJoin([
          ...added.map(counsel => this.hearingService.addIntermediaryCounsel(hearingId, counsel)),
          ...updated.map(counsel =>
            this.hearingService.updateIntermediaryCounsel(hearingId, counsel)
          ),
          ...removed.map(counselId =>
            this.hearingService.removeIntermediaryCounsel(hearingId, counselId)
          )
        ]).pipe(
          map(() => new HearingActions.SaveIntermediaryCounselsSuccessAction(payload)),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  saveCompanyRepresentatives$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.SAVE_COMPANY_REPRESENTATIVES),
      switchMap((action: HearingActions.SaveCompanyRepresentativesAction) => {
        const observableArray1 = action.payload.companyRepresentativesToAdd.map(
          companyRepresentative =>
            this.hearingService.addCompanyRepresentative(
              action.payload.hearingId,
              companyRepresentative
            )
        );

        const observableArray2 = action.payload.companyRepresentativesToUpdate.map(
          companyRepresentative =>
            this.hearingService.updateCompanyRepresentative(
              action.payload.hearingId,
              companyRepresentative
            )
        );

        const observableArray3 = action.payload.companyRepresentativesToDelete.map(
          companyRepresentative =>
            this.hearingService.removeCompanyRepresentative(action.payload.hearingId, {
              id: companyRepresentative
            })
        );

        const allObservables = observableArray1.concat(observableArray2).concat(observableArray3);

        return forkJoin(allObservables).pipe(
          switchMap(() => [
            new HearingActions.AddCompanyRepresentativesSuccessAction({
              companyRepresentativesToAdd: action.payload.companyRepresentativesToAdd
            }),
            new HearingActions.EditCompanyRepresentativesSuccessAction({
              companyRepresentativesToEdit: action.payload.companyRepresentativesToUpdate
            }),
            new HearingActions.RemoveCompanyRepresentativesSuccessAction({
              companyRepresentativesToRemove: action.payload.companyRepresentativesToDelete
            })
          ]),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  saveApplicationResponse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.UPDATE_APPLICATION_RESPONSE),
      switchMap((action: HearingActions.UpdateApplicationResponseAction) => {
        return this.hearingService.updateApplicationResponse(action.payload.body).pipe(
          map(() => new HearingActions.UpdateApplicationResponseSuccessAction(action.payload)),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  loadAllCrackedIneffectiveSubReasons$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.loadCrackedIneffectiveSubReasons),
      switchMap(() =>
        this.crackedIneffectiveSubReasonService.getSubReasons().pipe(
          map(subReasons => HearingActions.loadCrackedIneffectiveSubReasonsSuccess({ subReasons })),
          catchError((error: ValidationError) =>
            of(HearingActions.loadCrackedIneffectiveSubReasonsFailure({ error }))
          )
        )
      )
    )
  );

  loadCrackedIneffectiveSubReasonById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.loadCrackedIneffectiveSubReasonById),
      switchMap(({ subReasonId }) =>
        this.crackedIneffectiveSubReasonService.getSubReasonById(subReasonId).pipe(
          map(subReason =>
            HearingActions.loadCrackedIneffectiveSubReasonByIdSuccess({ subReason })
          ),
          catchError(error =>
            of(HearingActions.loadCrackedIneffectiveSubReasonByIdFailure({ error }))
          )
        )
      )
    )
  );

  setTrialType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.SET_TRIAL_TYPE),
      withLatestFrom(this.store.select(getTrialTypes)),
      switchMap(([action, trialTypes]: [HearingActions.SetTrialTypeAction, TrialType[]]) => {
        const { hearingId, trialTypeBody } = action.payload;

        let crackedIneffectiveTrial = undefined;

        if (!trialTypeBody.isEffectiveTrial && trialTypeBody.trialTypeId) {
          const trialType = trialTypes.find(t => t.id === trialTypeBody.trialTypeId);
          if (trialType) {
            crackedIneffectiveTrial = {
              ...trialType,
              crackedIneffectiveSubReasonId: trialTypeBody.crackedIneffectiveSubReasonId
            };
          }
        }

        const trialTypeSuccessBody: TrialTypeSuccessBody = {
          crackedIneffectiveTrial,
          isEffectiveTrial:
            trialTypeBody.isEffectiveTrial !== undefined
              ? trialTypeBody.isEffectiveTrial
              : undefined
        };

        return this.hearingService.setTrialType(hearingId, trialTypeBody).pipe(
          map(
            () => new HearingActions.SetTrialTypeActionSuccess({ hearingId, trialTypeSuccessBody })
          ),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  vacateTrial$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.VACATE_TRIAL),
      switchMap((action: HearingActions.VacateTrialAction) =>
        this.hearingService.vacateTrial(action.payload).pipe(
          map(() => new HearingActions.LoadHearingDetailAction(action.payload.hearingId)),
          catchError(err => of(new ApiError(err)))
        )
      )
    )
  );

  checkInAsProsecution$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.CHECK_IN_AS_PROSECUTOR),
      withLatestFrom(this.store.select(getUserDetails)),
      switchMap(
        ([action, loggedInUser]: [HearingActions.CheckInAsProsecutorAction, UserDetails]) => {
          const cppDateUtil = getCPPDate();
          const obsArray = action.payload.checkInAsProsecutor.map(checkInProsecution =>
            this.hearingService
              .checkInAsProsecution(checkInProsecution.hearingId, {
                id: uuid(),
                firstName: loggedInUser.firstName,
                middleName: '',
                lastName: loggedInUser.lastName,
                title: '',
                prosecutionCases: checkInProsecution.prosecutionCases,
                status: 'Prosecution',
                attendanceDays: [cppDateUtil.format(cppDateUtil.getCurrentDate(), 'YYYY-MM-DD')]
              })
              .pipe(
                catchError(err => {
                  return of({ error: err, isError: true } as CheckInProsecutorResult);
                })
              )
          );

          return forkJoin(obsArray).pipe(
            map((results: CheckInProsecutorResult[]) => {
              const failedHearings = results.filter(result => result.isError) || [];
              const numberOfSuccessfulHearings = results.length - failedHearings.length;
              const failedCases = failedHearings
                .map(failedHearing => failedHearing.error.data.caseURN)
                .join(',');
              return {
                numberOfSuccessfulHearings,
                failedCases,
                role: 'prosecution',
                courtHouse: action.payload.courtCentre.oucodeL3Name
              };
            }),
            tap(data =>
              this.router.navigate(['/check-in/outcome'], {
                queryParams: { ...data }
              })
            ),
            map(() => new HearingActions.CheckInAsProsecutorActionSuccess()),
            catchError(error => of(new ApiError(error)))
          );
        }
      )
    )
  );

  defenceCheckIn = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.CHECK_IN_AS_DEFENCE),
      mergeMap((action: HearingActions.CheckInAsDefenceAction) => {
        return forkJoin(
          action.payload.defenceCheckIn.map(defendant => {
            return this.hearingService
              .checkInAsDefence(defendant.hearingId, defendant.defenceCounsel)
              .pipe(
                catchError(err => {
                  return of(err.data.caseURN);
                })
              );
          })
        ).pipe(
          tap(results => {
            const failedCases = results
              .filter(result => typeof result === 'string')
              .reduce((unique, item) => (unique.includes(item) ? unique : [...unique, item]), [])
              .join(',');

            const numberOfSuccessfulHearings = results
              .filter(result => !isNullOrUndefined(result.defenceCounsel))
              .map(result => result.hearingId)
              .reduce(
                (unique, item) => (unique.includes(item) ? unique : [...unique, item]),
                []
              ).length;

            this.router.navigate([`/check-in/outcome`], {
              queryParams: {
                numberOfSuccessfulHearings,
                failedCases,
                role: 'defence',
                courtHouse: action.payload.courtCentreName
              }
            });
          }),
          map(() => new HearingActions.CheckInAsDefenceSuccessAction())
        );
      })
    )
  );

  checkInHearing = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.CHECK_IN_HEARINGS),
      mergeMap((action: HearingActions.CheckInHearings) => {
        const checkInDefence$ =
          action.payload.defence.length > 0
            ? forkJoin(
                (action.payload.defence || []).map(defendant => {
                  return this.hearingService
                    .checkInAsDefence(defendant.hearingId, defendant.defenceCounsel)
                    .pipe(
                      catchError(err => {
                        return of(err.data.caseURN);
                      })
                    );
                })
              ).pipe(
                map(results => {
                  const failedCases = results
                    .filter(result => typeof result === 'string')
                    .reduce(
                      (unique, item) => (unique.includes(item) ? unique : [...unique, item]),
                      []
                    )
                    .join(',');

                  const numberOfSuccessfulHearings = results
                    .filter(result => !isNullOrUndefined(result.defenceCounsel))
                    .map(result => result.hearingId)
                    .reduce(
                      (unique, item) => (unique.includes(item) ? unique : [...unique, item]),
                      []
                    ).length;

                  return {
                    numberOfSuccessfulHearings,
                    failedCases,
                    role: 'defence',
                    courtHouse: action.courtCentre.oucodeL3Name
                  };
                })
              )
            : of({
                numberOfSuccessfulHearings: 0,
                failedCases: '',
                role: 'defence',
                courtHouse: action.courtCentre.oucodeL3Name
              });

        const checkInProsecution$ =
          action.payload.prosecution.length > 0
            ? forkJoin(
                action.payload.prosecution.map(prosecution => {
                  return this.hearingService
                    .checkInAsProsecution(prosecution.hearingId, prosecution.prosecutionCounsel)
                    .pipe(
                      catchError(err => {
                        return of(err.data.caseURN);
                      })
                    );
                })
              ).pipe(
                map((results: CheckInProsecutorResult[]) => {
                  const failedHearings = results.filter(result => result.isError) || [];
                  const numberOfSuccessfulHearings = results.length - failedHearings.length;
                  const failedCases = failedHearings
                    .map(failedHearing => failedHearing.error.data.caseURN)
                    .join(',');
                  return {
                    numberOfSuccessfulHearings,
                    failedCases,
                    role: 'prosecution',
                    courtHouse: action.courtCentre.oucodeL3Name
                  };
                })
              )
            : of({
                numberOfSuccessfulHearings: 0,
                failedCases: '',
                role: 'prosecution',
                courtHouse: action.courtCentre.oucodeL3Name
              });

        return zip(checkInDefence$, checkInProsecution$);
      }),
      map(([defence, prosecution]) => {
        this.router.navigate([`/check-in/outcome`], {
          queryParams: {
            numberOfSuccessfulHearings:
              defence.numberOfSuccessfulHearings + prosecution.numberOfSuccessfulHearings,
            failedCases: defence.failedCases + prosecution.failedCases,
            role: '',
            courtHouse: defence.courtHouse
          }
        });
        return new HearingActions.CheckInAsDefenceSuccessAction();
      })
    )
  );

  searchAvailableHearings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingActions.SEARCH_AVAILABLE_HEARINGS),
      withLatestFrom(this.store.select(getCurrentHearing), this.store.select(getRouteQueryParams)),
      switchMap(
        ([action, hearing, queryParams]: [
          HearingActions.SearchAvailableHearingsAction,
          HearingDetail,
          { [key: string]: string }
        ]) => {
          let matchedDefendantIds = null;
          let caseUrnForLinkedCases = null;
          if (
            hearing.isBoxHearing &&
            !!queryParams.applicationId &&
            action.payload.searchCriterias.includes(
              SearchCriteriaAvailableHearingsType.MATCHED_DEFENDANTS
            )
          ) {
            caseUrnForLinkedCases = action.payload.caseUrnForLinkedCases.join(',');
            const { linkedCaseId } = hearing.courtApplications.find(
              courtApplication => courtApplication.id === queryParams.applicationId
            );
            const currentProsecutionCase = (hearing.prosecutionCases || []).find(
              prosecutionCase => prosecutionCase.id === linkedCaseId
            );
            if (!!currentProsecutionCase) {
              matchedDefendantIds = currentProsecutionCase.defendants.map(
                defendant => defendant.masterDefendantId
              );
            }
          }

          return this.listingService
            .searchAvailableHearings(
              action.payload,
              hearing.isBoxHearing,
              matchedDefendantIds,
              caseUrnForLinkedCases
            )
            .pipe(
              switchMap(({ hearings, notes }) => {
                const splitHearings = this.listingService.splitFutureHearingDays(hearings);
                const sortedHearings = this.listingService.sortByHearingDay(splitHearings);
                return of({ hearings: sortedHearings, notes });
              }),
              switchMap(({ hearings, notes }) => [
                new HearingActions.SearchAvailableHearingsSuccessAction(hearings),
                loadListingNotes({ notes })
              ]),
              catchError(err => of(new ApiError(err)))
            );
        }
      )
    )
  );

  createListingNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createListingNote),
      switchMap(({ note }) =>
        this.listingNotesService.createListingNotes(note).pipe(
          map(createdNote => createListingNoteSuccess({ note: createdNote })),
          catchError(err => of(new ApiError(err)))
        )
      )
    )
  );

  updateListingNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateListingNote),
      switchMap(noteData =>
        this.listingNotesService.updateListingNote(noteData).pipe(
          map(({ noteId, noteDescription }) => {
            this.store.dispatch(
              showListingNoteSuccessMessage({ successMessage: 'Listing note saved' })
            );
            return updateListingNoteSuccess({ noteId, noteDescription });
          }),
          catchError(err => of(new ApiError(err)))
        )
      )
    )
  );

  deleteListingNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteListingNote),
      switchMap(({ noteId: id }) =>
        this.listingNotesService.deleteListingNote(id).pipe(
          map(({ noteId }) => {
            this.store.dispatch(
              showListingNoteSuccessMessage({ successMessage: 'Listing note deleted' })
            );
            return deleteListingNoteSuccess({ noteId });
          }),
          catchError(err => of(new ApiError(err)))
        )
      )
    )
  );

  toggleSittingYouthCourt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(toggleSittingYouthCourt),
      withLatestFrom(
        this.store.select(getCurrentHearing),
        this.store.select(getCurrentHearingDefendants)
      ),
      switchMap(([{ defendantId, isToggleAll }, hearingDetail, defendants]) => {
        const bulkCasesDefendantIds = (hearingDetail.prosecutionCases || [])
          .filter(kase => !!kase.isGroupMaster)
          .map(kase => kase.defendants.map(defendant => defendant.id))
          .reduce((acc, ids) => [...acc, ...ids], []);

        const existingYouthCourtDefendantIds = [...hearingDetail.youthCourtDefendantIds].sort();
        const allDefendantIds = [...defendants.map(defendant => defendant.defendantId)]
          .filter(id => !bulkCasesDefendantIds.some(bulkDefendantId => bulkDefendantId === id))
          .sort();

        let newYouthCourtDefendantIds: string[];

        if (!isToggleAll) {
          const defendantIdIndex = existingYouthCourtDefendantIds.indexOf(defendantId);

          newYouthCourtDefendantIds =
            defendantIdIndex > -1
              ? [...existingYouthCourtDefendantIds.filter(id => id !== defendantId)]
              : [...existingYouthCourtDefendantIds, defendantId];
        } else {
          newYouthCourtDefendantIds =
            allDefendantIds.join(',') === existingYouthCourtDefendantIds.join(',')
              ? []
              : allDefendantIds;
        }

        return this.hearingService
          .setYouthCourtDefendants(hearingDetail.id, newYouthCourtDefendantIds)
          .pipe(
            map(() => toggleSittingYouthCourtSuccess({ newYouthCourtDefendantIds })),
            catchError(err => of(new ApiError(err)))
          );
      })
    )
  );

  getSelectedHearingIsRestricted$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getSelectedHearingIsRestricted),
      withLatestFrom(
        this.store.select(getUserRolePermissions),
        this.store.select(getCurrentCaseIds)
      ),
      switchMap(([, userRolePermissions, caseIds]) => {
        // The restrict access functionality has not been implemented for applications. This is currently a workaround
        if (caseIds.length === 0) {
          // It means that the current hearing is a standalone application
          this.store.dispatch(getSelectedHearingIsRestrictedSuccess({ isRestricted: true }));
          return EMPTY;
        }

        const observableArray = caseIds.map(caseId =>
          this.usersGroupsService.getPermissionsBy({
            action: 'View',
            object: 'RestrictedCase',
            target: caseId
          })
        );
        return forkJoin([...observableArray]).pipe(
          map(permissions => {
            const allRestrictedCasesPermissions = permissions.reduce((acc, element) => [
              ...acc,
              ...element
            ]);
            const isRestricted =
              allRestrictedCasesPermissions.length === 0
                ? true
                : !!userRolePermissions.find(
                    permission =>
                      permission.object === 'RestrictedCase' &&
                      caseIds.every(caseId => permission.targets.includes(caseId))
                  );

            return getSelectedHearingIsRestrictedSuccess({ isRestricted });
          }),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  addWitness$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addWitness),
      switchMap(({ hearingId, witnessName }) =>
        this.hearingService.addWitness(hearingId, witnessName).pipe(
          map(() => new HearingActions.LoadHearingDetailAction(hearingId)),
          catchError(error => of(new ApiError(error)))
        )
      )
    )
  );
}
