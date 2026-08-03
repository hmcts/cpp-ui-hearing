import { AvailableHearing } from './../model/available-hearing';
import { Action, props, createAction } from '@ngrx/store';
import {
  PleaData,
  HearingSummary,
  CheckInHearingSummary,
  Counsel,
  DefendantCounsel,
  DefenceCounsel,
  UpdateDefendantAttendance,
  ApplicantCounsel,
  RespondentCounsel,
  ProsecutionCounsel,
  IntermediaryCounsel,
  CompanyRepresentative,
  HearingCaseNotes,
  CourtApplicationResponse,
  Defendant,
  CheckInAsDefence,
  CheckInAsProsecutor,
  SearchAvailableHearingsFormOptions,
  ExtendMagistratesAccessPermission,
  HearingDetailResponse,
  CheckInPayload,
  HearingLockState,
  ElectronicMonitoringDefendant,
  DefaultOptions,
  CourtApplication,
  UpdateVerdictData,
  Offence,
  OffenceType
} from '../model';
import { AmendmentReason, TrialTypeBody, TrialTypeSuccessBody } from '../model/shared';
import { OrganisationUnit } from '@cpp/reference-data';
import { VacateTrialParams } from '../../trial-outcome/vacate-trial.interfaces';
import { UserDetails } from '@cpp/users-groups';
import { ResolvedDraftResultLine } from '../../results/results.interfaces';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import { ValidationError } from '@cpp/pdk';

export const LOAD_HEARING_LIST = 'LOAD_HEARING_LIST';
export const LOAD_HEARING_LIST_SUCCESS = 'LOAD_HEARING_LIST_SUCCESS';
export const CLEAR_HEARING_LIST = 'CLEAR_HEARING_LIST';

export const LOAD_HEARING_DETAIL = 'LOAD_HEARING_DETAIL';
export const LOAD_HEARING_DETAIL_SUCCESS = 'LOAD_HEARING_DETAIL_SUCCESS';

export const LOAD_AMENDING_USER_DETAILS = 'LOAD_AMENDING_USER_DETAILS';
export const LOAD_AMENDING_USER_DETAILS_SUCCESS = 'LOAD_AMENDING_USER_DETAILS_SUCCESS';

export const UPDATE_PLEA = 'UPDATE_PLEA';
export const STORE_PLEAS = 'STORE_PLEAS';
export const UPDATE_PLEA_SUCCESS = 'UPDATE_PLEA_SUCCESS';
export const RESET_PLEAS = 'RESET_PLEAS';

export const UPDATE_ATTENDEES = 'UPDATE_ATTENDEES';
export const UPDATE_ATTENDEES_SUCCESS = 'UPDATE_ATTENDEES_SUCCESS';
export const DELETE_ATTENDEE = 'DELETE_ATTENDEE';
export const DELETE_ATTENDEE_SUCCESS = 'DELETE_ATTENDEE_SUCCESS';

export const UPDATE_VERDICT = 'UPDATE_VERDICT';
export const UPDATE_VERDICT_SUCCESS = 'UPDATE_VERDICT_SUCCESS';

export const UPDATE_PRESENCE = 'UPDATE_PRESENCE';
export const UPDATE_PRESENCE_SUCCESS = 'UPDATE_PRESENCE_SUCCESS';

export const SET_SELECTED_HEARING_DATE = 'SET_SELECTED_HEARING_DATE';
export const SET_SELECTED_OPTIONS = 'SET_SELECTED_OPTIONS';

export const SAVE_HEARING_CASE_NOTE_ACTION = 'SAVE_HEARING_CASE_NOTE_ACTION';
export const SAVE_HEARING_CASE_NOTE_ACTION_SUCCESS = 'SAVE_HEARING_CASE_NOTE_ACTION_SUCCESS';
export const SHARE_HEARING_RESULTS_SUCCESS = 'SHARE_HEARING_RESULTS_SUCCESS';

export const DOWNLOAD_DOCUMENT_ACTION = 'DOWNLOAD_DOCUMENT_ACTION';
export const SAVE_APPLICANT_COUNSELS = 'SAVE_APPLICANT_COUNSELS';
export const SAVE_APPLICANT_COUNSELS_SUCCESS = 'SAVE_APPLICANT_COUNSELS_SUCCESS';
export const SAVE_DEFENCE_COUNSELS = 'SAVE_DEFENCE_COUNSELS';
export const SAVE_INTERMEDIARY_COUNSELS = 'SAVE_INTERMEDIARY_COUNSELS';
export const SAVE_INTERMEDIARY_COUNSELS_SUCCESS = 'SAVE_INTERMEDIARY_COUNSELS_SUCCESS';
export const SAVE_COMPANY_REPRESENTATIVES = 'SAVE_COMPANY_REPRESENTATIVES';
export const SAVE_PROSECUTION_COUNSELS = 'SAVE_PROSECUTION_COUNSELS';
export const SAVE_RESPONDENT_COUNSELS = 'SAVE_RESPONDENT_COUNSELS';
export const SAVE_RESPONDENT_COUNSELS_SUCCESS = 'SAVE_RESPONDENT_COUNSELS_SUCCESS';
export const SAVE_PROSECUTION_COUNSELS_SUCCESS = 'SAVE_PROSECUTION_COUNSELS_SUCCESS';

export const ADD_DEFENCE_COUNSELS_SUCCESS = 'ADD_DEFENCE_COUNSELS_SUCCESS';
export const EDIT_DEFENCE_COUNSELS_SUCCESS = 'EDIT_DEFENCE_COUNSELS_SUCCESS';
export const REMOVE_DEFENCE_COUNSELS_SUCCESS = 'REMOVE_DEFENCE_COUNSELS_SUCCESS';

export const ADD_COMPANY_REPRESENTATIVES_SUCCESS = 'ADD_COMPANY_REPRESENTATIVES_SUCCESS';
export const EDIT_COMPANY_REPRESENTATIVES_SUCCESS = 'EDIT_COMPANY_REPRESENTATIVES_SUCCESS';
export const REMOVE_COMPANY_REPRESENTATIVES_SUCCESS = 'REMOVE_COMPANY_REPRESENTATIVES_SUCCESS';

export const UPDATE_APPLICATION_RESPONSE = 'UPDATE_APPLICATION_RESPONSE';
export const UPDATE_APPLICATION_RESPONSE_SUCCESS = 'UPDATE_APPLICATION_RESPONSE_SUCCESS';

export const SET_TRIAL_TYPE = 'SET_TRIAL_TYPE';
export const SET_TRIAL_TYPE_SUCCESS = 'SET_TRIAL_TYPE_SUCCESS';

export const APPLY_DECISION = 'APPLY_DECISION';

export const CHECK_IN_AS_PROSECUTOR = 'CHECK_IN_AS_PROSECUTOR';
export const CHECK_IN_HEARINGS = 'CHECK_IN_HEARINGS';
export const CHECK_IN_AS_PROSECUTOR_SUCCESS = 'CHECK_IN_AS_PROSECUTOR_SUCCESS';
export const CHECK_IN_AS_DEFENCE = 'CHECK_IN_AS_DEFENCE';
export const CHECK_IN_AS_DEFENCE_SUCCESS = 'CHECK_IN_AS_DEFENCE_SUCCESS';

export const VACATE_TRIAL = 'VACATE_TRIAL';
export const SEARCH_AVAILABLE_HEARINGS = 'SEARCH_AVAILABLE_HEARINGS';
export const SEARCH_AVAILABLE_HEARINGS_SUCCESS = 'SEARCH_AVAILABLE_HEARINGS_SUCCESS';
export const RESET_AVAILABLE_HEARINGS = 'RESET_AVAILABLE_HEARINGS';

export const EXTEND_MAGISTRATES_ACCESS = 'EXTEND_MAGISTRATES_ACCESS';

export const TOGGLE_SITTING_YOUTH_COURT = 'TOGGLE_SITTING_YOUTH_COURT';
export const TOGGLE_SITTING_YOUTH_COURT_SUCCESS = 'TOGGLE_SITTING_YOUTH_COURT_SUCCESS';

export const LOAD_DEFENDANTS_TRACKING_STATUS = 'LOAD_DEFENDANTS_TRACKING_STATUS';
export const LOAD_DEFENDANTS_TRACKING_STATUS_SUCCESS = 'LOAD_DEFENDANTS_TRACKING_STATUS_SUCCESS';

export class SetSelectedHearingDateAction implements Action {
  readonly type = SET_SELECTED_HEARING_DATE;
  constructor(public readonly payload: string) {}
}

export class LoadHearingListAction implements Action {
  readonly type = LOAD_HEARING_LIST;

  constructor(
    public readonly payload: {
      date: string;
      courtCentreId: string;
      roomId?: string;
      startTime?: string;
      endTime?: string;
      hearingId?: string;
    }
  ) {}
}

export class LoadHearingListSuccessAction implements Action {
  readonly type = LOAD_HEARING_LIST_SUCCESS;

  constructor(public readonly payload: HearingSummary[]) {}
}

export class ClearHearingList implements Action {
  readonly type = CLEAR_HEARING_LIST;

  constructor() {}
}

export class LoadHearingDetailAction implements Action {
  readonly type = LOAD_HEARING_DETAIL;
  constructor(public readonly hearingId: string) {}
}

export class LoadAmendingUserDetailsAction implements Action {
  readonly type = LOAD_AMENDING_USER_DETAILS;
  constructor(public readonly userId: string) {}
}

export class LoadAmendingUserDetailsSuccessAction implements Action {
  readonly type = LOAD_AMENDING_USER_DETAILS_SUCCESS;
  constructor(public readonly userDetails: UserDetails) {}
}

export class LoadHearingDetailSuccessAction implements Action {
  readonly type = LOAD_HEARING_DETAIL_SUCCESS;

  constructor(public readonly payload: HearingDetailResponse) {}
}

export class LoadDefendantsTrackingStatusAction implements Action {
  readonly type = LOAD_DEFENDANTS_TRACKING_STATUS;

  constructor() {}
}

export class LoadDefendantsTrackingStatusSuccessAction implements Action {
  readonly type = LOAD_DEFENDANTS_TRACKING_STATUS_SUCCESS;

  constructor(public readonly payload: ElectronicMonitoringDefendant[]) {}
}

export class UpdatePleaAction implements Action {
  readonly type = UPDATE_PLEA;

  constructor(
    public readonly payload: {
      body: PleaData[];
      hearingId: string;
    }
  ) {}
}

export class StoreDefendantsPleaAction implements Action {
  readonly type = STORE_PLEAS;
  constructor(public readonly payload: PleaData[], public readonly guiltyPleas: string[]) {}
}

export class UpdatePleaSuccessAction implements Action {
  readonly type = UPDATE_PLEA_SUCCESS;
}

export class ResetPleasAction implements Action {
  readonly type = RESET_PLEAS;
}

export class UpdateAttendeesAction implements Action {
  readonly type = UPDATE_ATTENDEES;

  constructor(
    public readonly payload: {
      prosecutionCounsels: Counsel[];
      defenceCounsels: DefendantCounsel[];
      hearingId: string;
    }
  ) {}
}

export class UpdateAttendeesSuccessAction implements Action {
  readonly type = UPDATE_ATTENDEES_SUCCESS;

  constructor(
    public readonly payload: {
      prosecutionCounsels: Counsel[];
      defenceCounsels: DefenceCounsel[];
      hearingId: string;
    }
  ) {}
}

export class DeleteAttendeeAction implements Action {
  readonly type = DELETE_ATTENDEE;

  constructor(
    public readonly payload: {
      hearingId: string;
      attendeeId: string;
      hearingDate: string;
    }
  ) {}
}

export class DeleteAttendeeSuccessAction implements Action {
  readonly type = DELETE_ATTENDEE_SUCCESS;

  constructor(
    public readonly payload: {
      attendeeId: string;
      hearingDate: string;
    }
  ) {}
}

export class UpdateVerdictAction implements Action {
  readonly type = UPDATE_VERDICT;

  constructor(
    public readonly payload: {
      verdict: any;
      hearingId: string;
    }
  ) {}
}
export class UpdateVerdictSuccessAction implements Action {
  readonly type = UPDATE_VERDICT_SUCCESS;

  constructor(
    public readonly payload: {
      verdict: any;
      hearingId: string;
    }
  ) {}
}

export class UpdatePresenceAction implements Action {
  readonly type = UPDATE_PRESENCE;

  constructor(public readonly payload: UpdateDefendantAttendance) {}
}
export class UpdatePresenceSuccessAction implements Action {
  readonly type = UPDATE_PRESENCE_SUCCESS;

  constructor(public readonly payload: UpdateDefendantAttendance) {}
}

export class DownloadDocumentAction implements Action {
  readonly type = DOWNLOAD_DOCUMENT_ACTION;
  constructor(public readonly materialId: string) {}
}

export class SaveApplicantCounselsAction implements Action {
  readonly type = SAVE_APPLICANT_COUNSELS;

  constructor(
    public readonly payload: {
      hearingId: string;
      added: ApplicantCounsel[];
      updated: ApplicantCounsel[];
      removed: ApplicantCounsel[];
    }
  ) {}
}

export class SaveApplicantCounselsSuccessAction implements Action {
  readonly type = SAVE_APPLICANT_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      hearingId: string;
      added: ApplicantCounsel[];
      updated: ApplicantCounsel[];
      removed: ApplicantCounsel[];
    }
  ) {}
}

export class SaveRespondentCounselsAction implements Action {
  readonly type = SAVE_RESPONDENT_COUNSELS;

  constructor(
    public readonly payload: {
      hearingId: string;
      added: RespondentCounsel[];
      updated: RespondentCounsel[];
      removed: RespondentCounsel[];
    }
  ) {}
}

export class SaveRespondentCounselsSuccessAction implements Action {
  readonly type = SAVE_RESPONDENT_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      hearingId: string;
      added: RespondentCounsel[];
      updated: RespondentCounsel[];
      removed: RespondentCounsel[];
    }
  ) {}
}

export class SaveProsecutionCounselsAction implements Action {
  readonly type = SAVE_PROSECUTION_COUNSELS;

  constructor(
    public readonly payload: {
      hearingId: string;
      prosecutionCounselsToAdd: ProsecutionCounsel[];
      prosecutionCounselsToUpdate: ProsecutionCounsel[];
      prosecutionCounselsToDelete: string[];
    }
  ) {}
}

export class SaveProsecutionCounselsSuccessAction implements Action {
  readonly type = SAVE_PROSECUTION_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      prosecutionCounselsToAdd: ProsecutionCounsel[];
      prosecutionCounselsToUpdate: ProsecutionCounsel[];
    }
  ) {}
}

export class SaveDefenceCounselsAction implements Action {
  readonly type = SAVE_DEFENCE_COUNSELS;

  constructor(
    public readonly payload: {
      hearingId: string;
      defenceCounselsToAdd: DefenceCounsel[];
      defenceCounselsToUpdate: DefenceCounsel[];
      defenceCounselsToDelete: string[];
    }
  ) {}
}

export class SaveIntermediaryCounselsAction implements Action {
  readonly type = SAVE_INTERMEDIARY_COUNSELS;

  constructor(
    public readonly payload: {
      hearingId: string;
      added: IntermediaryCounsel[];
      updated: IntermediaryCounsel[];
      removed: string[];
    }
  ) {}
}

export class SaveIntermediaryCounselsSuccessAction implements Action {
  readonly type = SAVE_INTERMEDIARY_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      hearingId: string;
      added: IntermediaryCounsel[];
      updated: IntermediaryCounsel[];
      removed: string[];
    }
  ) {}
}

export class AddDefenceCounselsSuccessAction implements Action {
  readonly type = ADD_DEFENCE_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      defenceCounselsToAdd: DefenceCounsel[];
    }
  ) {}
}

export class EditDefenceCounselsSuccessAction implements Action {
  readonly type = EDIT_DEFENCE_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      defenceCounselsToEdit: DefenceCounsel[];
    }
  ) {}
}

export class RemoveDefenceCounselsSuccessAction implements Action {
  readonly type = REMOVE_DEFENCE_COUNSELS_SUCCESS;

  constructor(
    public readonly payload: {
      defenceCounselsToRemove: string[];
    }
  ) {}
}

export class SaveCompanyRepresentativesAction implements Action {
  readonly type = SAVE_COMPANY_REPRESENTATIVES;

  constructor(
    public readonly payload: {
      hearingId: string;
      companyRepresentativesToAdd: CompanyRepresentative[];
      companyRepresentativesToUpdate: CompanyRepresentative[];
      companyRepresentativesToDelete: string[];
    }
  ) {}
}

export class AddCompanyRepresentativesSuccessAction implements Action {
  readonly type = ADD_COMPANY_REPRESENTATIVES_SUCCESS;

  constructor(
    public readonly payload: {
      companyRepresentativesToAdd: CompanyRepresentative[];
    }
  ) {}
}

export class EditCompanyRepresentativesSuccessAction implements Action {
  readonly type = EDIT_COMPANY_REPRESENTATIVES_SUCCESS;

  constructor(
    public readonly payload: {
      companyRepresentativesToEdit: CompanyRepresentative[];
    }
  ) {}
}

export class RemoveCompanyRepresentativesSuccessAction implements Action {
  readonly type = REMOVE_COMPANY_REPRESENTATIVES_SUCCESS;

  constructor(
    public readonly payload: {
      companyRepresentativesToRemove: string[];
    }
  ) {}
}

export class SaveHearingCaseNoteAction implements Action {
  readonly type = SAVE_HEARING_CASE_NOTE_ACTION;
  constructor(public readonly payload: HearingCaseNotes) {}
}

export class SaveHearingCaseNoteActionSuccess implements Action {
  readonly type = SAVE_HEARING_CASE_NOTE_ACTION_SUCCESS;
  constructor(public readonly payload: HearingCaseNotes) {}
}

export class UpdateApplicationResponseAction implements Action {
  readonly type = UPDATE_APPLICATION_RESPONSE;
  constructor(
    public readonly payload: {
      hearingId: string;
      body: {
        applicationResponse: CourtApplicationResponse;
        applicationPartyId: string;
      };
    }
  ) {}
}

export class UpdateApplicationResponseSuccessAction implements Action {
  readonly type = UPDATE_APPLICATION_RESPONSE_SUCCESS;
  constructor(
    public readonly payload: {
      hearingId: string;
      body: {
        applicationResponse: CourtApplicationResponse;
        applicationPartyId: string;
      };
    }
  ) {}
}

export class SetTrialTypeAction implements Action {
  readonly type = SET_TRIAL_TYPE;
  constructor(
    public readonly payload: {
      hearingId: string;
      trialTypeBody: TrialTypeBody;
    }
  ) {}
}

export class SetTrialTypeActionSuccess implements Action {
  readonly type = SET_TRIAL_TYPE_SUCCESS;
  constructor(
    public readonly payload: {
      hearingId: string;
      trialTypeSuccessBody: TrialTypeSuccessBody;
    }
  ) {}
}

export class VacateTrialAction implements Action {
  readonly type = VACATE_TRIAL;
  constructor(public payload: VacateTrialParams) {}
}

export class ApplyDecisionAction implements Action {
  readonly type = APPLY_DECISION;

  constructor(public readonly payload: Defendant, public readonly offence: Offence) {}
}

export class CheckInAsProsecutorAction implements Action {
  readonly type = CHECK_IN_AS_PROSECUTOR;

  constructor(
    public readonly payload: {
      checkInAsProsecutor: CheckInAsProsecutor[];
      courtCentre: OrganisationUnit;
    }
  ) {}
}

export class CheckInHearings implements Action {
  readonly type = CHECK_IN_HEARINGS;

  constructor(
    public readonly payload: CheckInPayload,
    public readonly courtCentre: OrganisationUnit
  ) {}
}

export class CheckInAsProsecutorActionSuccess implements Action {
  readonly type = CHECK_IN_AS_PROSECUTOR_SUCCESS;
}

export class CheckInAsDefenceAction implements Action {
  readonly type = CHECK_IN_AS_DEFENCE;
  constructor(
    public readonly payload: {
      defenceCheckIn: CheckInAsDefence[];
      courtCentreName: string;
    }
  ) {}
}

export class CheckInAsDefenceSuccessAction implements Action {
  readonly type = CHECK_IN_AS_DEFENCE_SUCCESS;
}

export class SearchAvailableHearingsAction implements Action {
  readonly type = SEARCH_AVAILABLE_HEARINGS;

  constructor(public payload: SearchAvailableHearingsFormOptions) {}
}

export class SearchAvailableHearingsSuccessAction implements Action {
  readonly type = SEARCH_AVAILABLE_HEARINGS_SUCCESS;

  constructor(public payload: AvailableHearing[]) {}
}

export class ResetAvailableHearingsAction implements Action {
  readonly type = RESET_AVAILABLE_HEARINGS;
}

export class ExtendMagistratesAccess implements Action {
  readonly type = EXTEND_MAGISTRATES_ACCESS;

  constructor(public payload: ExtendMagistratesAccessPermission) {}
}

export const loadCheckInHearingList = createAction(
  '[Check-In] Load Hearing List',
  props<{ date: string; courtCentreId: string }>()
);

export const loadCheckInHearingListSuccess = createAction(
  '[Check-In] Load Hearing List Success',
  props<{ summaries: CheckInHearingSummary[] }>()
);

export const clearCheckInHearingList = createAction('[Check-In] Clear Hearing List');

export const loadCrackedIneffectiveSubReasons = createAction(
  'LOAD_CRACKED_INEFFECTIVE_SUB_REASONS'
);

export const loadCrackedIneffectiveSubReasonsSuccess = createAction(
  'LOAD_CRACKED_INEFFECTIVE_SUB_REASONS_SUCCESS',
  props<{ subReasons: CrackedIneffectiveSubReason[] }>()
);

export const loadCrackedIneffectiveSubReasonsFailure = createAction(
  'LOAD_CRACKED_INEFFECTIVE_SUB_REASONS_FAILURE',
  props<{ error: ValidationError }>()
);

export const clearCrackedIneffectiveSubReasons = createAction(
  'CLEAR_CRACKED_INEFFECTIVE_SUB_REASONS'
);

export const loadCrackedIneffectiveSubReasonById = createAction(
  'LOAD_CRACKED_INEFFECTIVE_SUB_REASON_BY_ID',
  props<{ subReasonId: string }>()
);

export const loadCrackedIneffectiveSubReasonByIdSuccess = createAction(
  'LOAD_CRACKED_INEFFECTIVE_SUB_REASON_BY_ID_SUCCESS',
  props<{ subReason: CrackedIneffectiveSubReason }>()
);

export const loadCrackedIneffectiveSubReasonByIdFailure = createAction(
  'LOAD_CRACKED_INEFFECTIVE_SUB_REASON_BY_ID_FAILURE',
  props<{ error: ValidationError }>()
);

export const setHearingState = createAction(
  'SET_HEARING_STATE',
  props<{
    hearingState: HearingLockState;
    amendedByUser?: UserDetails;
    amendmentReason?: AmendmentReason;
  }>()
);

export const clearCurrentHearing = createAction('CLEAR_CURRENT_HEARING');

export const getSelectedHearingIsRestricted = createAction('GET_SELECTED_HEARING_IS_RESTRICTED');

export const getSelectedHearingIsRestrictedSuccess = createAction(
  'GET_SELECTED_HEARING_IS_RESTRICTED_SUCCESS',
  props<{ isRestricted: boolean }>()
);

export const toggleSittingYouthCourt = createAction(
  'TOGGLE_SITTING_YOUTH_COURT',
  props<{ defendantId?: string; isToggleAll?: boolean }>()
);

export const toggleSittingYouthCourtSuccess = createAction(
  'TOGGLE_SITTING_YOUTH_COURT_SUCCESS',
  props<{ newYouthCourtDefendantIds: string[] }>()
);

export const setIsSelectedCaseBulk = createAction(
  'SET_IS_SELECTED_CASE_BULK',
  props<{ isSelectedCaseBulk: boolean }>()
);

export const setSelectedOptions = createAction(
  'SET_SELECTED_OPTIONS',
  props<{ selectedOptions: DefaultOptions }>()
);

export const setCurrentAmendmentReason = createAction(
  'SET_CURRENT_AMENDMENT_REASON',
  props<{ amendmentReason: AmendmentReason }>()
);

export const clearCurrentAmendmentReason = createAction('RESET_CURRENT_AMENDMENT_REASON');

export const setCourtApplication = createAction(
  'SET_COURT_APPLICATIONS',
  props<{ courtApplications: CourtApplication[] }>()
);

export const setStandaloneAncillaryResults = createAction(
  'SET_STANDALONE_ANCILLARY_RESULTS',
  props<{ standaloneAncillaryResults: ResolvedDraftResultLine[] }>()
);

export const clearStandaloneAncillaryResults = createAction('CLEAR_STANDALONE_ANCILLARY_RESULTS');

export const storeDefendantVerdictData = createAction(
  'STORE_DEFENDANT_VERDICT_DATA',
  props<{ verdictData: UpdateVerdictData[] }>()
);

export const resetVerdictAction = createAction('RESET_VERDICT_ACTION');

export const setDefendantOffence = createAction(
  'SET_DEFENDANT_OFFENCE',
  props<{ offence: Offence; defendant: Defendant; offenceType: OffenceType }>()
);

export const setTrialEffectivenessError = createAction(
  'SET_TRIAL_EFFECTIVENESS_ERROR',
  props<{ error: ValidationError[] | null }>()
);

export type HearingAction =
  | LoadHearingListAction
  | LoadHearingListSuccessAction
  | ClearHearingList
  | LoadHearingDetailAction
  | LoadDefendantsTrackingStatusSuccessAction
  | LoadHearingDetailSuccessAction
  | LoadAmendingUserDetailsAction
  | LoadAmendingUserDetailsSuccessAction
  | UpdatePleaAction
  | UpdateVerdictSuccessAction
  | StoreDefendantsPleaAction
  | UpdatePleaSuccessAction
  | ResetPleasAction
  | UpdateAttendeesAction
  | UpdateAttendeesSuccessAction
  | DeleteAttendeeAction
  | DeleteAttendeeSuccessAction
  | SetSelectedHearingDateAction
  | UpdatePresenceAction
  | UpdatePresenceSuccessAction
  | SaveHearingCaseNoteAction
  | SaveHearingCaseNoteActionSuccess
  | DownloadDocumentAction
  | SaveProsecutionCounselsAction
  | SaveProsecutionCounselsSuccessAction
  | SaveDefenceCounselsAction
  | SaveCompanyRepresentativesAction
  | AddDefenceCounselsSuccessAction
  | EditDefenceCounselsSuccessAction
  | RemoveDefenceCounselsSuccessAction
  | AddCompanyRepresentativesSuccessAction
  | EditCompanyRepresentativesSuccessAction
  | RemoveCompanyRepresentativesSuccessAction
  | SaveIntermediaryCounselsAction
  | SaveIntermediaryCounselsSuccessAction
  | UpdateApplicationResponseAction
  | UpdateApplicationResponseSuccessAction
  | SaveApplicantCounselsAction
  | SaveApplicantCounselsSuccessAction
  | SaveRespondentCounselsAction
  | SaveRespondentCounselsSuccessAction
  | SetTrialTypeAction
  | SetTrialTypeActionSuccess
  | ApplyDecisionAction
  | CheckInAsProsecutorAction
  | CheckInAsProsecutorActionSuccess
  | CheckInAsDefenceAction
  | CheckInAsDefenceSuccessAction
  | CheckInHearings
  | SearchAvailableHearingsAction
  | SearchAvailableHearingsSuccessAction
  | ResetAvailableHearingsAction
  | ExtendMagistratesAccess
  | ReturnType<typeof loadCheckInHearingList>
  | ReturnType<typeof loadCheckInHearingListSuccess>
  | ReturnType<typeof clearCheckInHearingList>
  | ReturnType<typeof loadCrackedIneffectiveSubReasons>
  | ReturnType<typeof loadCrackedIneffectiveSubReasonsSuccess>
  | ReturnType<typeof loadCrackedIneffectiveSubReasonsFailure>
  | ReturnType<typeof clearCrackedIneffectiveSubReasons>
  | ReturnType<typeof loadCrackedIneffectiveSubReasonById>
  | ReturnType<typeof loadCrackedIneffectiveSubReasonByIdSuccess>
  | ReturnType<typeof loadCrackedIneffectiveSubReasonByIdFailure>
  | ReturnType<typeof clearCurrentHearing>
  | ReturnType<typeof toggleSittingYouthCourt>
  | ReturnType<typeof toggleSittingYouthCourtSuccess>
  | ReturnType<typeof getSelectedHearingIsRestricted>
  | ReturnType<typeof getSelectedHearingIsRestrictedSuccess>
  | ReturnType<typeof setHearingState>
  | ReturnType<typeof setCurrentAmendmentReason>
  | ReturnType<typeof clearCurrentAmendmentReason>
  | ReturnType<typeof setSelectedOptions>
  | ReturnType<typeof setCourtApplication>
  | ReturnType<typeof setIsSelectedCaseBulk>
  | ReturnType<typeof setStandaloneAncillaryResults>
  | ReturnType<typeof clearStandaloneAncillaryResults>
  | ReturnType<typeof storeDefendantVerdictData>
  | ReturnType<typeof resetVerdictAction>
  | ReturnType<typeof setDefendantOffence>
  | ReturnType<typeof setTrialEffectivenessError>;
