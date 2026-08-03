/**/
import * as fromHearing from './hearing';
import {
  hearingCaseNoteMock,
  mockDefendant,
  mockSelectedOptions
} from '../../mock-data/test-mock-data';
import { HearingSummary, HearingDetail, PleaUpdate } from '..';
import {
  PleaData,
  SearchCriteriaAvailableHearingsType,
  SearchAvailableHearingsFormOptions,
  HearingDetailResponse
} from '../model';
import { TrialType } from '../model/shared';
import { UserDetails } from '@cpp/users-groups';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import { ValidationError } from '@cpp/pdk';

describe('Hearing actions', () => {
  it('Should create an LoadHearingListAction action', () => {
    const payload = {
      date: '01-01-2000',
      courtCentreId: '',
      roomId: ''
    };

    const action = new fromHearing.LoadHearingListAction(payload);
    expect({ ...action }).toEqual({
      type: fromHearing.LOAD_HEARING_LIST,
      payload: { date: '01-01-2000', courtCentreId: '', roomId: '' }
    });
  });
  it('Should create an LoadHearingListSuccessAction action', () => {
    const action = new fromHearing.LoadHearingListSuccessAction([{} as HearingSummary]);
    expect({ ...action }).toEqual({
      type: fromHearing.LOAD_HEARING_LIST_SUCCESS,
      payload: [{} as HearingSummary]
    });
  });
  it('Should create an LoadHearingDetailAction action', () => {
    const action = new fromHearing.LoadHearingDetailAction('test');
    expect({ ...action }).toEqual({
      type: fromHearing.LOAD_HEARING_DETAIL,
      hearingId: 'test'
    });
  });
  it('Should create an LoadHearingDetailSuccessAction action', () => {
    const action = new fromHearing.LoadHearingDetailSuccessAction({} as HearingDetailResponse);
    expect({ ...action }).toEqual({
      type: fromHearing.LOAD_HEARING_DETAIL_SUCCESS,
      payload: {} as HearingDetail
    });
  });

  it('Should create an LoadAmendingUserDetailsAction action', () => {
    const action = new fromHearing.LoadAmendingUserDetailsAction('test');
    expect({ ...action }).toEqual({
      type: fromHearing.LOAD_AMENDING_USER_DETAILS,
      userId: 'test'
    });
  });
  it('Should create an LoadAmendingUserDetailsSuccessAction action', () => {
    const action = new fromHearing.LoadAmendingUserDetailsSuccessAction({} as UserDetails);
    expect({ ...action }).toEqual({
      type: fromHearing.LOAD_AMENDING_USER_DETAILS_SUCCESS,
      userDetails: {} as UserDetails
    });
  });

  it('Should create an toggleSittingYouthCourt action', () => {
    const action = fromHearing.toggleSittingYouthCourt({ defendantId: 'def-id' });
    expect({ ...action }).toEqual({
      type: 'TOGGLE_SITTING_YOUTH_COURT',
      defendantId: 'def-id'
    });
  });
  it('Should create an toggleSittingYouthCourtSuccess action', () => {
    const action = fromHearing.toggleSittingYouthCourtSuccess({
      newYouthCourtDefendantIds: ['def-id1', 'def-id2']
    });
    expect({ ...action }).toEqual({
      type: 'TOGGLE_SITTING_YOUTH_COURT_SUCCESS',
      newYouthCourtDefendantIds: ['def-id1', 'def-id2']
    });
  });

  it('Should create an UpdatePlea action', () => {
    const action = new fromHearing.UpdatePleaAction({
      body: [] as PleaData[],
      hearingId: '123'
    });
    expect({ ...action }).toEqual({
      type: fromHearing.UPDATE_PLEA,
      payload: {
        body: [] as PleaData[],
        hearingId: '123'
      }
    });
  });
  it('Should create an UpdatePleaSuccess action', () => {
    const action = new fromHearing.UpdatePleaSuccessAction();
    expect({ ...action }).toEqual({
      type: fromHearing.UPDATE_PLEA_SUCCESS
    });
  });

  it('Should create an UpdateVerdict action', () => {
    const action = new fromHearing.UpdateVerdictAction({
      verdict: {} as PleaUpdate,
      hearingId: '123'
    });
    expect({ ...action }).toEqual({
      type: fromHearing.UPDATE_VERDICT,
      payload: {
        verdict: {} as PleaUpdate,
        hearingId: '123'
      }
    });
  });
  it('Should create an UpdateVerdictSuccess action', () => {
    const action = new fromHearing.UpdateVerdictSuccessAction({ verdict: {}, hearingId: '' });
    expect({ ...action }).toEqual({
      type: fromHearing.UPDATE_VERDICT_SUCCESS,
      payload: {
        verdict: {},
        hearingId: ''
      }
    });
  });
  it('Should create an DeleteAttendee action', () => {
    const action = new fromHearing.DeleteAttendeeAction({
      hearingId: '123',
      attendeeId: '456',
      hearingDate: '2018-01-01'
    });
    expect({ ...action }).toEqual({
      type: fromHearing.DELETE_ATTENDEE,
      payload: {
        hearingId: '123',
        attendeeId: '456',
        hearingDate: '2018-01-01'
      }
    });
  });
  it('Should create an DeleteAttendeeSuccess action', () => {
    const action = new fromHearing.DeleteAttendeeSuccessAction({
      attendeeId: '456',
      hearingDate: '2018-01-01'
    });
    expect({ ...action }).toEqual({
      type: fromHearing.DELETE_ATTENDEE_SUCCESS,
      payload: {
        attendeeId: '456',
        hearingDate: '2018-01-01'
      }
    });
  });

  it('Should create an SelectedHearingDate action', () => {
    const action = new fromHearing.SetSelectedHearingDateAction('test');
    expect({ ...action }).toEqual({
      type: fromHearing.SET_SELECTED_HEARING_DATE,
      payload: 'test'
    });
  });

  it('Should create an SaveHearingCaseNoteAction action', () => {
    const action = new fromHearing.SaveHearingCaseNoteAction(hearingCaseNoteMock);
    expect({ ...action }).toEqual({
      type: fromHearing.SAVE_HEARING_CASE_NOTE_ACTION,
      payload: hearingCaseNoteMock
    });
  });
  it('Should create an SaveHearingCaseNoteActionSuccess action', () => {
    const action = new fromHearing.SaveHearingCaseNoteActionSuccess(hearingCaseNoteMock);
    expect({ ...action }).toEqual({
      type: fromHearing.SAVE_HEARING_CASE_NOTE_ACTION_SUCCESS,
      payload: hearingCaseNoteMock
    });
  });

  it('Should create an SetTrialTypeAction action', () => {
    const action = new fromHearing.SetTrialTypeAction({
      hearingId: 'test-hearing-id',
      trialTypeBody: { trialTypeId: 'test-trial-type-id' }
    });
    expect({ ...action }).toEqual({
      type: fromHearing.SET_TRIAL_TYPE,
      payload: {
        hearingId: 'test-hearing-id',
        trialTypeBody: { trialTypeId: 'test-trial-type-id' }
      }
    });
  });

  it('Should create an SetTrialTypeActionSuccess action', () => {
    const action = new fromHearing.SetTrialTypeActionSuccess({
      hearingId: 'test-hearing-id',
      trialTypeSuccessBody: { crackedIneffectiveTrial: <TrialType>{ id: 'test-trial-type-id' } }
    });
    expect({ ...action }).toEqual({
      type: fromHearing.SET_TRIAL_TYPE_SUCCESS,
      payload: {
        hearingId: 'test-hearing-id',
        trialTypeSuccessBody: { crackedIneffectiveTrial: <TrialType>{ id: 'test-trial-type-id' } }
      }
    });
  });
  it('Should create an SearchAvailableHearingsAction action', () => {
    const formOptions = {
      hearingId: 'test-hearing-id',
      caseUrns: null,
      searchCriterias: [SearchCriteriaAvailableHearingsType.CASE_IN_HEARING]
    } as SearchAvailableHearingsFormOptions;
    const action = new fromHearing.SearchAvailableHearingsAction(formOptions);
    expect({ ...action }).toEqual({
      type: fromHearing.SEARCH_AVAILABLE_HEARINGS,
      payload: formOptions
    });
  });
  it('Should create an SearchAvailableHearingsSuccessAction action', () => {
    const action = new fromHearing.SearchAvailableHearingsSuccessAction([]);
    expect({ ...action }).toEqual({
      type: fromHearing.SEARCH_AVAILABLE_HEARINGS_SUCCESS,
      payload: []
    });
  });
  it('Should create an ResetAvailableHearingsAction action', () => {
    const action = new fromHearing.ResetAvailableHearingsAction();
    expect({ ...action }).toEqual({
      type: fromHearing.RESET_AVAILABLE_HEARINGS
    });
  });
  it('Should create a setSelectedOptions action', () => {
    const action = fromHearing.setSelectedOptions({ selectedOptions: mockSelectedOptions });
    expect({ ...action }).toEqual({
      type: 'SET_SELECTED_OPTIONS',
      selectedOptions: mockSelectedOptions
    });
  });

  it('Should create a storeDefendantVerdictData action', () => {
    const action = fromHearing.storeDefendantVerdictData({ verdictData: [] });
    expect({ ...action }).toEqual({
      type: 'STORE_DEFENDANT_VERDICT_DATA',
      verdictData: []
    });
  });

  it('Should create a resetVerdictAction action', () => {
    const action = fromHearing.resetVerdictAction();
    expect({ ...action }).toEqual({
      type: 'RESET_VERDICT_ACTION'
    });
  });

  it('Should create a setDefendantOffence action', () => {
    const offenceType = {
      offenceId: '17bd3b5b-de61-46cb-a395-0f46e70774c4',
      cjsOffenceCode: 'GA96101',
      title:
        'Aircraft commander / tug driver fail to stop after aircraft accident within Gatwick Airport',
      legislation: 'whatever'
    };
    const defendant = mockDefendant;
    const offence = mockDefendant.offences[0];
    const action = fromHearing.setDefendantOffence({ offence, defendant, offenceType });
    expect({ ...action }).toEqual({
      type: 'SET_DEFENDANT_OFFENCE',
      offence,
      defendant,
      offenceType
    });
  });

  describe('Cracked Ineffective Sub Reasons Actions', () => {
    it('Should create a loadCrackedIneffectiveSubReasons action', () => {
      const action = fromHearing.loadCrackedIneffectiveSubReasons();
      expect({ ...action }).toEqual({
        type: fromHearing.loadCrackedIneffectiveSubReasons.type
      });
    });

    it('Should create a loadCrackedIneffectiveSubReasonsSuccess action', () => {
      const mockSubReasons: CrackedIneffectiveSubReason[] = [
        {
          id: '1',
          subReasonCode: 'SUB1',
          subReasonDesc: 'Sub Reason 1',
          primaryReasonCode: 'CRACKED',
          validFrom: '',
          validTo: ''
        },
        {
          id: '2',
          subReasonCode: 'SUB2',
          subReasonDesc: 'Sub Reason 2',
          primaryReasonCode: 'CRACKED',
          validFrom: '',
          validTo: ''
        }
      ];
      const action = fromHearing.loadCrackedIneffectiveSubReasonsSuccess({
        subReasons: mockSubReasons
      });
      expect({ ...action }).toEqual({
        type: fromHearing.loadCrackedIneffectiveSubReasonsSuccess.type,
        subReasons: mockSubReasons
      });
    });

    it('Should create a loadCrackedIneffectiveSubReasonsFailure action', () => {
      const error: ValidationError = { id: 'test-id', message: 'Error loading sub reasons' };
      const action = fromHearing.loadCrackedIneffectiveSubReasonsFailure({ error });
      expect({ ...action }).toEqual({
        type: fromHearing.loadCrackedIneffectiveSubReasonsFailure.type,
        error
      });
    });

    it('Should create a clearCrackedIneffectiveSubReasons action', () => {
      const action = fromHearing.clearCrackedIneffectiveSubReasons();
      expect({ ...action }).toEqual({
        type: fromHearing.clearCrackedIneffectiveSubReasons.type
      });
    });

    it('Should create a loadCrackedIneffectiveSubReasonById action', () => {
      const action = fromHearing.loadCrackedIneffectiveSubReasonById({
        subReasonId: '123'
      });
      expect({ ...action }).toEqual({
        type: fromHearing.loadCrackedIneffectiveSubReasonById.type,
        subReasonId: '123'
      });
    });

    it('Should create a loadCrackedIneffectiveSubReasonByIdSuccess action', () => {
      const mockSubReason: CrackedIneffectiveSubReason = {
        id: '123',
        subReasonCode: 'SUB1',
        subReasonDesc: 'Sub Reason 1',
        primaryReasonCode: 'CRACKED',
        validFrom: '',
        validTo: ''
      };
      const action = fromHearing.loadCrackedIneffectiveSubReasonByIdSuccess({
        subReason: mockSubReason
      });
      expect({ ...action }).toEqual({
        type: fromHearing.loadCrackedIneffectiveSubReasonByIdSuccess.type,
        subReason: mockSubReason
      });
    });

    it('Should create a loadCrackedIneffectiveSubReasonByIdFailure action', () => {
      const error: ValidationError = { id: 'test-id', message: 'Error loading sub reason by id' };
      const action = fromHearing.loadCrackedIneffectiveSubReasonByIdFailure({ error });
      expect({ ...action }).toEqual({
        type: fromHearing.loadCrackedIneffectiveSubReasonByIdFailure.type,
        error
      });
    });
  });
  describe('Trial Effectiveness Error Actions', () => {
    it('Should create a setTrialEffectivenessError action with error', () => {
      const error: ValidationError[] = [
        {
          id: 'trial-effectiveness',
          message: 'Trial effectiveness is required'
        }
      ];

      const action = fromHearing.setTrialEffectivenessError({ error });

      expect({ ...action }).toEqual({
        type: 'SET_TRIAL_EFFECTIVENESS_ERROR',
        error
      });
    });

    it('Should create a setTrialEffectivenessError action with null', () => {
      const action = fromHearing.setTrialEffectivenessError({ error: null });

      expect({ ...action }).toEqual({
        type: 'SET_TRIAL_EFFECTIVENESS_ERROR',
        error: null
      });
    });
  });
});
