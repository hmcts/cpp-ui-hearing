import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { uniq } from 'lodash-es';

import {
  ApiError,
  GetCourtSessionOfficersByRoleAction,
  GetCourtSessionOfficersByRoleSuccessAction,
  GetSessionTimesAction,
  GetSessionTimesSuccessAction,
  RecordSessionTimesAction,
  RecordSessionTimesSuccessAction
} from '../actions';
import * as SessionTimesActions from '../actions/session-times';
import { ReferenceDataService, SessionTimesService, UserGroupsService } from '../services';
import {
  CourtOfficerRole,
  CourtSession,
  CourtSessionJudiciary,
  JudicialMember,
  SessionTimesCourt
} from '../model';

@Injectable()
export class SessionTimesEffects {
  getSessionTimes$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionTimesActions.GET_SESSION_TIMES),
      switchMap((action: GetSessionTimesAction) => {
        const { courtHouseId, courtRoomId, sessionDate } = action;
        return this.sessionTimesService
          .getSessionTimes(courtHouseId, courtRoomId, sessionDate)
          .pipe(
            switchMap(savedSession =>
              this.fallbackToAllocatedJudiciaries(
                savedSession,
                courtHouseId,
                courtRoomId,
                sessionDate
              )
            ),
            switchMap(sessionTimes => this.extendSessionTimesCourtJudiciaries(sessionTimes)),
            map(extended => new GetSessionTimesSuccessAction(extended)),
            catchError(error => of(new ApiError(error)))
          );
      })
    )
  );

  recordSessionTimes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionTimesActions.RECORD_SESSION_TIMES),
      switchMap((action: RecordSessionTimesAction) => {
        return this.sessionTimesService.recordSessionTimes(action.payload).pipe(
          map(() => new RecordSessionTimesSuccessAction()),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  getCourtSessionOfficersByRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionTimesActions.GET_COURT_SESSION_OFFICERS_BY_ROLE),
      switchMap((action: GetCourtSessionOfficersByRoleAction) => {
        return of(action.roleNames).pipe(
          switchMap((roleNames: string[]) =>
            forkJoin(
              roleNames.reduce((allApiCalls, roleName) => {
                const courtOfficerRole = this.getCourtOfficerRoleMapping(roleName);
                return {
                  ...allApiCalls,
                  [courtOfficerRole]: this.userGroupsService.getUsersForGroupByGroupName(roleName)
                };
              }, {})
            ).pipe(
              map(responses => new GetCourtSessionOfficersByRoleSuccessAction(responses)),
              catchError(error => of(new ApiError(error)))
            )
          )
        );
      })
    )
  );

  /*
   * Extend the local representation of the `SessionTimesCourt` model
   * such that its `judiciary` entries have the `judicialMember` to
   * which they belong nested within.
   */
  private extendSessionTimesCourtJudiciaries(
    sessionTimes: SessionTimesCourt
  ): Observable<SessionTimesCourt> {
    const { amCourtSession, pmCourtSession } = sessionTimes;
    return of(
      [amCourtSession, pmCourtSession]
        .filter(session => !!session)
        .reduce(
          (judiciaryIds, session) => [
            ...judiciaryIds,
            ...this.addJudiciaryIds(session.judiciaries)
          ],
          [] as string[]
        )
    ).pipe(
      map(uniq),
      switchMap(ids =>
        ids.length === 0 ? of([]) : this.referenceDataService.getJudicialMembersByIds(ids)
      ),
      map((judicialMembers: JudicialMember[]) => ({
        ...sessionTimes,
        ...(sessionTimes.amCourtSession && {
          amCourtSession: this.extendSessionJudiciariesData(amCourtSession, judicialMembers)
        }),
        ...(sessionTimes.pmCourtSession && {
          pmCourtSession: this.extendSessionJudiciariesData(pmCourtSession, judicialMembers)
        })
      }))
    );
  }

  /*
   * A session (AM or PM) that has been saved is shown exactly as saved.
   * A session with nothing saved falls back to the judiciary allocated
   * to the hearings listed in the court room on that date.
   */
  private fallbackToAllocatedJudiciaries(
    savedSession: SessionTimesCourt,
    courtHouseId: string,
    courtRoomId: string,
    sessionDate: string
  ): Observable<SessionTimesCourt> {
    if (savedSession?.amCourtSession && savedSession?.pmCourtSession) {
      return of(savedSession);
    }

    return this.sessionTimesService
      .getAllocatedJudiciaries(courtHouseId, courtRoomId, sessionDate)
      .pipe(
        map(allocatedJudiciaries => ({
          courtHouseId,
          courtRoomId,
          courtSessionDate: sessionDate,
          ...allocatedJudiciaries,
          ...savedSession
        }))
      );
  }

  private addJudiciaryIds(judiciaries: CourtSessionJudiciary[]): string[] {
    return judiciaries
      ? judiciaries
          .filter(judiciary => !!judiciary.judiciaryId)
          .map(judiciary => judiciary.judiciaryId)
      : [];
  }

  private extendSessionJudiciariesData(
    session: CourtSession,
    judicialMembers: JudicialMember[]
  ): CourtSession {
    if (!session.judiciaries) {
      return session;
    }

    const extendedJudiciaries = session.judiciaries.map(judiciary => {
      return judiciary.judiciaryId
        ? {
            ...judiciary,
            // TODO: This will be undefined if no match found. Make sure code handles this in component
            judicialMember: this.findJudicialMemberById(judiciary.judiciaryId, judicialMembers)
          }
        : judiciary;
    });

    return {
      ...session,
      judiciaries: extendedJudiciaries
    };
  }

  private findJudicialMemberById(
    judiciaryId: string,
    judicialMembers: JudicialMember[]
  ): JudicialMember {
    return judicialMembers.find(({ id }) => id === judiciaryId);
  }

  private getCourtOfficerRoleMapping(roleName: string): CourtOfficerRole {
    switch (roleName) {
      case 'Court Clerks':
        return 'courtClerks';
      case 'Court Associate':
        return 'courtAssociate';
      case 'Legal Advisers':
        return 'legalAdvisers';
    }

    return null;
  }

  constructor(
    private actions$: Actions,
    private referenceDataService: ReferenceDataService,
    private sessionTimesService: SessionTimesService,
    private userGroupsService: UserGroupsService
  ) {}
}
