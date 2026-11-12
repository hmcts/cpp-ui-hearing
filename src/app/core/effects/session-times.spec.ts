import { TestBed } from '@angular/core/testing';
import { cold, hot } from 'jasmine-marbles';
import { Actions } from '@ngrx/effects';

import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { ReferenceDataService, UserGroupsService, SessionTimesService } from '../services';
import {
  ApiError,
  GetSessionTimesAction,
  GetSessionTimesSuccessAction,
  RecordSessionTimesAction,
  RecordSessionTimesSuccessAction
} from '../actions';
import {
  getActions,
  TestActions,
  mockSessionTimesCourt,
  mockJudicialMembers
} from '../../mock-data/test-mock-data';
import { SessionTimesEffects } from './session-times';
import { JudicialMember, CourtSession, SessionTimesCourt } from '../model';

describe('Session Times effects', () => {
  let actions$: TestActions;

  let effects: SessionTimesEffects;

  let getJudicialMembersByIds: jest.Mock;
  let getSessionTimes: jest.Mock;
  let recordSessionTimes: jest.Mock;
  let getAllocatedJudiciaries: jest.Mock;
  let getUsersForGroupByGroupName: jest.Mock;

  beforeEach(() => {
    getJudicialMembersByIds = jest.fn();
    getSessionTimes = jest.fn();
    recordSessionTimes = jest.fn();
    getAllocatedJudiciaries = jest.fn();
    getUsersForGroupByGroupName = jest.fn();

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideCppCoreHttpServices(),
        SessionTimesEffects,
        {
          provide: ReferenceDataService,
          useValue: {
            getJudicialMembersByIds
          }
        },
        {
          provide: SessionTimesService,
          useValue: {
            getSessionTimes,
            getAllocatedJudiciaries,
            recordSessionTimes
          }
        },
        {
          provide: UserGroupsService,
          useValue: {
            getUsersForGroupByGroupName
          }
        },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn()
          }
        },
        { provide: Actions, useFactory: getActions }
      ],
      teardown: { destroyAfterEach: false }
    });
    actions$ = TestBed.inject(Actions) as TestActions;

    effects = TestBed.inject(SessionTimesEffects);
  });

  describe('getSessionTimes$', () => {
    const { courtHouseId, courtRoomId } = mockSessionTimesCourt;
    const sessionDate = '2020-10-02';
    const inputAction = new GetSessionTimesAction(courtHouseId, courtRoomId, sessionDate);

    it('should return current session if session has previously been saved', () => {
      actions$.stream = hot('-a', { a: inputAction });
      const existingSession$ = cold('-(b|)', { b: mockSessionTimesCourt });
      const judicialMembers$ = cold('-(c|)', { c: mockJudicialMembers });
      const expected$ = cold('---d', {
        d: new GetSessionTimesSuccessAction({
          ...mockSessionTimesCourt,
          amCourtSession: extendSessionWithJudicialMembers(
            mockSessionTimesCourt.amCourtSession,
            mockJudicialMembers
          ),
          pmCourtSession: extendSessionWithJudicialMembers(
            mockSessionTimesCourt.pmCourtSession,
            mockJudicialMembers
          )
        })
      });

      getSessionTimes.mockReturnValue(existingSession$);
      getJudicialMembersByIds.mockReturnValue(judicialMembers$);

      expect(effects.getSessionTimes$).toBeObservable(expected$);
      expect(getAllocatedJudiciaries).not.toHaveBeenCalled();
    });

    it('should emit ApiError if bad request', () => {
      const badRequestError = { status: 400 };

      actions$.stream = hot('-a', { a: inputAction });
      const apiError$ = cold('-#', {}, badRequestError);
      const expected$ = cold('--b', { b: new ApiError(badRequestError) });

      getSessionTimes.mockReturnValue(apiError$);

      expect(effects.getSessionTimes$).toBeObservable(expected$);
    });

    describe('when a session has nothing saved', () => {
      const allocatedJudiciaries: SessionTimesCourt = {
        courtHouseId,
        courtRoomId,
        courtSessionDate: sessionDate,
        amCourtSession: {
          judiciaries: [{ judiciaryId: mockJudicialMembers[0].id }]
        },
        pmCourtSession: {
          judiciaries: [{ judiciaryId: mockJudicialMembers[1].id }]
        }
      };
      const prefilledAmSession = extendSessionWithJudicialMembers(
        allocatedJudiciaries.amCourtSession,
        mockJudicialMembers
      );
      const prefilledPmSession = extendSessionWithJudicialMembers(
        allocatedJudiciaries.pmCourtSession,
        mockJudicialMembers
      );

      beforeEach(() => {
        getAllocatedJudiciaries.mockReturnValue(cold('-(c|)', { c: allocatedJudiciaries }));
        getJudicialMembersByIds.mockReturnValue(cold('-(d|)', { d: mockJudicialMembers }));
      });

      it('should fall back to the allocated judiciaries for both sessions if nothing is saved', () => {
        actions$.stream = hot('-a', { a: inputAction });
        getSessionTimes.mockReturnValue(cold('-(b|)', { b: null }));

        const expected$ = cold('----e', {
          e: new GetSessionTimesSuccessAction({
            courtHouseId,
            courtRoomId,
            courtSessionDate: sessionDate,
            amCourtSession: prefilledAmSession,
            pmCourtSession: prefilledPmSession
          })
        });

        expect(effects.getSessionTimes$).toBeObservable(expected$);
        expect(getAllocatedJudiciaries).toHaveBeenCalledWith(
          courtHouseId,
          courtRoomId,
          sessionDate
        );
      });

      it('should keep the saved AM session and fall back to the allocated judiciaries for the PM session', () => {
        const { pmCourtSession, ...amOnlySavedSession } = mockSessionTimesCourt;
        actions$.stream = hot('-a', { a: inputAction });
        getSessionTimes.mockReturnValue(cold('-(b|)', { b: amOnlySavedSession }));

        const expected$ = cold('----e', {
          e: new GetSessionTimesSuccessAction({
            ...amOnlySavedSession,
            amCourtSession: extendSessionWithJudicialMembers(
              mockSessionTimesCourt.amCourtSession,
              mockJudicialMembers
            ),
            pmCourtSession: prefilledPmSession
          })
        });

        expect(effects.getSessionTimes$).toBeObservable(expected$);
      });

      it('should keep the saved PM session and fall back to the allocated judiciaries for the AM session', () => {
        const { amCourtSession, ...pmOnlySavedSession } = mockSessionTimesCourt;
        actions$.stream = hot('-a', { a: inputAction });
        getSessionTimes.mockReturnValue(cold('-(b|)', { b: pmOnlySavedSession }));

        const expected$ = cold('----e', {
          e: new GetSessionTimesSuccessAction({
            ...pmOnlySavedSession,
            amCourtSession: prefilledAmSession,
            pmCourtSession: extendSessionWithJudicialMembers(
              mockSessionTimesCourt.pmCourtSession,
              mockJudicialMembers
            )
          })
        });

        expect(effects.getSessionTimes$).toBeObservable(expected$);
      });

      it('should leave the sessions blank if no judiciaries are allocated', () => {
        actions$.stream = hot('-a', { a: inputAction });
        getSessionTimes.mockReturnValue(cold('-(b|)', { b: null }));
        getAllocatedJudiciaries.mockReturnValue(
          cold('-(c|)', { c: { courtHouseId, courtRoomId, courtSessionDate: sessionDate } })
        );

        const expected$ = cold('---e', {
          e: new GetSessionTimesSuccessAction({
            courtHouseId,
            courtRoomId,
            courtSessionDate: sessionDate
          })
        });

        expect(effects.getSessionTimes$).toBeObservable(expected$);
        expect(getJudicialMembersByIds).not.toHaveBeenCalled();
      });
    });
  });

  describe('recordSessionTimes$', () => {
    const inputAction = new RecordSessionTimesAction(mockSessionTimesCourt);

    it('should record the session times', () => {
      actions$.stream = hot('-a---', { a: inputAction });
      const response$ = cold('-o');
      const expected$ = cold('--b', { b: new RecordSessionTimesSuccessAction() });

      recordSessionTimes.mockReturnValue(response$);

      expect(effects.recordSessionTimes$).toBeObservable(expected$);
    });

    it('should handle an server error when recording the session times', () => {
      const internalServerError = { status: 500 };

      actions$.stream = hot('-a', { a: inputAction });
      const apiError$ = cold('-#', {}, internalServerError);
      const expected$ = cold('--b', { b: new ApiError(internalServerError) });

      recordSessionTimes.mockReturnValue(apiError$);

      expect(effects.recordSessionTimes$).toBeObservable(expected$);
    });
  });

  function extendSessionWithJudicialMembers(
    session: CourtSession,
    judicialMembers: JudicialMember[]
  ): CourtSession {
    return {
      ...session,
      judiciaries: session.judiciaries.map(judiciary => {
        const judicialMember = judicialMembers.find(jm => jm.id === judiciary.judiciaryId);
        if (judicialMember) {
          return {
            ...judiciary,
            judicialMember
          };
        }
        return judiciary;
      })
    };
  }
});
