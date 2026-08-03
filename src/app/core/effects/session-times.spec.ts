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
  mockHearingSlots,
  mockJudicialMembers
} from '../../mock-data/test-mock-data';
import { SessionTimesEffects } from './session-times';
import { JudicialMember, CourtSession } from '../model';
import { SchedulingService } from '@cpp/scheduling';

describe('Session Times effects', () => {
  let actions$: TestActions;

  let effects: SessionTimesEffects;

  let getJudicialMembersByIds: jest.Mock;
  let getSessionTimes: jest.Mock;
  let recordSessionTimes: jest.Mock;
  let searchHearingSlots: jest.Mock;
  let getUsersForGroupByGroupName: jest.Mock;

  beforeEach(() => {
    getJudicialMembersByIds = jest.fn();
    getSessionTimes = jest.fn();
    recordSessionTimes = jest.fn();
    searchHearingSlots = jest.fn();
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
            recordSessionTimes
          }
        },
        {
          provide: SchedulingService,
          useValue: {
            searchHearingSlots
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
    const ouCode = 'B01LY00';
    const courtType = 'B';
    const sessionDate = '2020-10-02';
    const inputAction = new GetSessionTimesAction(
      courtHouseId,
      ouCode,
      courtRoomId,
      courtType,
      sessionDate
    );

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
    });

    it('should emit ApiError if bad request', () => {
      const badRequestError = { status: 400 };

      actions$.stream = hot('-a', { a: inputAction });
      const apiError$ = cold('-#', {}, badRequestError);
      const expected$ = cold('--b', { b: new ApiError(badRequestError) });

      getSessionTimes.mockReturnValue(apiError$);

      expect(effects.getSessionTimes$).toBeObservable(expected$);
    });

    it('should return if no existing session for Crown Court', () => {
      getSessionTimes.mockReturnValue(cold('-a|', { a: null }));
      const action = {
        ...inputAction,
        courtType: 'C'
      };

      actions$.stream = hot('-a', { a: action });
      const expected$ = cold('--b', {
        b: new GetSessionTimesSuccessAction({
          courtHouseId,
          courtRoomId,
          courtSessionDate: sessionDate
        })
      });

      expect(effects.getSessionTimes$).toBeObservable(expected$);
    });

    it('should call ROTA if no existing session for Magistrates Court', () => {
      const expectedRotaJudiciary = [
        {
          judiciaryId: mockJudicialMembers[0].id,
          benchChairman: false,
          judicialMember: mockJudicialMembers[0]
        },
        {
          judiciaryId: mockJudicialMembers[1].id,
          benchChairman: true,
          judicialMember: mockJudicialMembers[1]
        }
      ];

      actions$.stream = hot('-a', { a: inputAction });
      const noExistingSession$ = cold('-(b|)', { b: null });
      const hearingSlots$ = cold('-(c|)', { c: { hearingSlots: mockHearingSlots } });
      const judicialMembers$ = cold('-(d|)', { d: mockJudicialMembers });
      const expected$ = cold('----e', {
        e: new GetSessionTimesSuccessAction({
          courtHouseId,
          courtRoomId,
          courtSessionDate: sessionDate,
          amCourtSession: {
            judiciaries: expectedRotaJudiciary
          },
          pmCourtSession: {
            judiciaries: expectedRotaJudiciary
          }
        })
      });

      getSessionTimes.mockReturnValue(noExistingSession$);
      searchHearingSlots.mockReturnValue(hearingSlots$);
      getJudicialMembersByIds.mockReturnValue(judicialMembers$);

      expect(effects.getSessionTimes$).toBeObservable(expected$);
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
