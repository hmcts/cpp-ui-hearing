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
  CourtType,
  JudicialMember,
  SessionTimesCourt
} from '../model';
import {
  SchedulingService,
  SearchHearingSlotsParams,
  HearingSlot,
  HearingSlotJudiciary
} from '@cpp/scheduling';

@Injectable()
export class SessionTimesEffects {
  getSessionTimes$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionTimesActions.GET_SESSION_TIMES),
      switchMap((action: GetSessionTimesAction) => {
        const { courtHouseId, ouCode, courtRoomId, courtType, sessionDate } = action;
        return this.sessionTimesService
          .getSessionTimes(courtHouseId, courtRoomId, sessionDate)
          .pipe(
            switchMap(existingSession => {
              if (existingSession) {
                return this.extendSessionTimesCourtJudiciaries(existingSession).pipe(
                  map(extended => new GetSessionTimesSuccessAction(extended))
                );
              }

              if (this.isCrownCourt(courtType)) {
                return [
                  new GetSessionTimesSuccessAction({
                    courtHouseId,
                    courtRoomId,
                    courtSessionDate: sessionDate
                  })
                ];
              }

              return this.extendSessionTimesCourtWithRotaMagistrates(
                courtHouseId,
                ouCode,
                courtRoomId,
                sessionDate
              ).pipe(map(extended => new GetSessionTimesSuccessAction(extended)));
            }),
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
   * Extend the local representation of the `SessionTimesCourt` model
   * such that its `judiciary` entries are populated with pre-allocated
   * magistrates retrieved from calling Rota S&L.
   */
  private extendSessionTimesCourtWithRotaMagistrates(
    courtHouseId: string,
    ouCode: string,
    courtRoomId: string,
    sessionDate: string
  ): Observable<SessionTimesCourt> {
    const options = this.searchHearingSlotsParams(ouCode, courtRoomId, sessionDate);
    return this.schedulingService.searchHearingSlots(options).pipe(
      switchMap(({ hearingSlots }) => {
        return of(
          hearingSlots.reduce(
            (judiciaryIds, slot) => [
              ...judiciaryIds,
              ...this.addHearingSlotJudiciaryIds(slot.judiciaries)
            ],
            [] as string[]
          )
        ).pipe(
          map(uniq),
          switchMap(ids =>
            ids.length === 0 ? of([]) : this.referenceDataService.getJudicialMembersByIds(ids)
          ),
          map((judicialMembers: JudicialMember[]) => {
            return hearingSlots.reduce(
              (newSession, hearingSlot) => {
                const sessionJudiciaries = this.getHearingSlotJudiciaries(
                  hearingSlot,
                  judicialMembers
                );
                return this.addJudiciaryToCourtSession(
                  newSession,
                  sessionJudiciaries,
                  hearingSlot.courtSession
                );
              },
              { courtHouseId, courtRoomId, courtSessionDate: sessionDate }
            );
          })
        );
      })
    );
  }

  private addJudiciaryIds(judiciaries: CourtSessionJudiciary[]): string[] {
    return judiciaries
      ? judiciaries
          .filter(judiciary => !!judiciary.judiciaryId)
          .map(judiciary => judiciary.judiciaryId)
      : [];
  }

  private addHearingSlotJudiciaryIds(judiciaries: HearingSlotJudiciary[]): string[] {
    return judiciaries ? judiciaries.map(judiciary => judiciary.judiciaryId) : [];
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

  private searchHearingSlotsParams(
    ouCode: string,
    courtRoomId: string,
    sessionDate: string
  ): SearchHearingSlotsParams {
    return {
      sessionStartDate: sessionDate,
      sessionEndDate: sessionDate,
      ouCode,
      courtRoomId,
      panel: 'ADULT,YOUTH',
      pageNumber: 1,
      pageSize: 10,
      showOverbookedSlots: true
    };
  }

  private getHearingSlotJudiciaries(
    hearingSlot: HearingSlot,
    judicialMembers: JudicialMember[]
  ): CourtSessionJudiciary[] {
    return hearingSlot.judiciaries.map(judiciary => {
      const { judiciaryId, benchChairman } = judiciary;
      const judicialMember = this.findJudicialMemberById(judiciaryId, judicialMembers);
      return {
        judiciaryId,
        benchChairman,
        judicialMember
      };
    });
  }

  private addJudiciaryToCourtSession(
    session: SessionTimesCourt,
    sessionJudiciaries: CourtSessionJudiciary[],
    sessionSlot: 'AM' | 'PM' | 'AD'
  ): SessionTimesCourt {
    switch (sessionSlot) {
      case 'AD':
        return {
          ...session,
          amCourtSession: { judiciaries: sessionJudiciaries },
          pmCourtSession: { judiciaries: sessionJudiciaries }
        };
      case 'AM':
        return {
          ...session,
          amCourtSession: { judiciaries: sessionJudiciaries }
        };
      case 'PM':
        return {
          ...session,
          pmCourtSession: { judiciaries: sessionJudiciaries }
        };
      default:
        return session;
    }
  }

  private findJudicialMemberById(
    judiciaryId: string,
    judicialMembers: JudicialMember[]
  ): JudicialMember {
    return judicialMembers.find(({ id }) => id === judiciaryId);
  }

  private isCrownCourt(courtType: CourtType): boolean {
    return courtType === 'C';
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
    private schedulingService: SchedulingService,
    private userGroupsService: UserGroupsService
  ) {}
}
