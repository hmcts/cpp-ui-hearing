import { createReducer, on } from '@ngrx/store';
import { cloneDeep, merge } from 'lodash-es';
import {
  getSelectedHearingIsRestrictedSuccess,
  HearingAction,
  clearCurrentAmendmentReason,
  setCurrentAmendmentReason,
  setHearingState,
  setSelectedOptions,
  toggleSittingYouthCourtSuccess,
  setIsSelectedCaseBulk
} from '../actions';
import * as HearingActions from '../actions/hearing';
import {
  clearCurrentHearing,
  clearStandaloneAncillaryResults,
  resetVerdictAction,
  setCourtApplication,
  setDefendantOffence,
  setStandaloneAncillaryResults,
  storeDefendantVerdictData
} from '../actions/hearing';
import {
  AmendmentReason,
  AvailableHearing,
  CheckInHearingSummary,
  CompanyRepresentative,
  CounselsCache,
  CourtApplication,
  DefaultOptions,
  DefenceCounsel,
  HearingDetailRedux,
  HearingDetailResponse,
  HearingSummary,
  Offence,
  PleaData,
  ProsecutionCounsel,
  Verdict,
  UpdateVerdictData,
  Defendant,
  OffenceType,
  ProsecutionCaseDetails
} from '../model';
import { ResolvedDraftResultLine } from '../../results/results.interfaces';
import { ListingNote } from '@cpp/scheduling';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import { ValidationError } from '@cpp/pdk';

export interface HearingState {
  summaries: HearingSummary[];
  checkInSummaries: CheckInHearingSummary[];
  current: HearingDetailRedux;
  selectedHearingDate: string;
  selectedOptions: DefaultOptions;
  counselsCache: CounselsCache;
  amendmentReason: AmendmentReason;
  available: AvailableHearing[];
  listingNotes: ListingNote[];
  isRestricted: boolean;
  isSelectedCaseBulk: boolean;
  standaloneAncillaryResults: ResolvedDraftResultLine[];

  subReasons: CrackedIneffectiveSubReason[];
  currentSubReason: CrackedIneffectiveSubReason | null;
  currentSubReasonLoading: boolean;
  trialEffectivenessError: ValidationError[] | null;
}

const initialState: HearingState = {
  summaries: [],
  checkInSummaries: [],
  current: {
    hearingState: null,
    hearing: null,
    electronicMonitoring: []
  },
  counselsCache: {
    firstNameOpts: [],
    lastNameOpts: []
  },
  selectedHearingDate: null,
  selectedOptions: {
    dateFilter: null,
    courtCentreFilter: null,
    courtRoomFilter: null,
    startTimeFilter: null,
    endTimeFilter: null
  },
  amendmentReason: null,
  available: null,
  listingNotes: [],
  isRestricted: null,
  isSelectedCaseBulk: null,
  standaloneAncillaryResults: [],
  subReasons: [],
  currentSubReason: null,
  currentSubReasonLoading: false,
  trialEffectivenessError: null
};

export function hearingLegacyReducer(
  state: HearingState = initialState,
  action: HearingAction
): HearingState {
  switch (action.type) {
    case HearingActions.LOAD_HEARING_LIST_SUCCESS:
      return {
        ...state,
        summaries: action.payload,
        current: {
          hearingState: null,
          hearing: null
        }
      };

    case HearingActions.CLEAR_HEARING_LIST:
      return {
        ...state,
        summaries: null,
        current: {
          hearingState: null,
          hearing: null
        }
      };

    case HearingActions.SET_SELECTED_HEARING_DATE:
      return {
        ...state,
        selectedHearingDate: action.payload
      };

    case HearingActions.LOAD_HEARING_DETAIL_SUCCESS:
      const actionPayload = populatePleasVerdicts(action.payload);
      const { crackedIneffectiveTrial } = actionPayload.hearing;

      const current = { ...state.current, ...actionPayload };
      const hearingWithcrackedIneffectiveTrial = {
        ...state,
        current: {
          ...current,
          hearing: {
            ...current.hearing,
            crackedIneffectiveTrial: {
              ...crackedIneffectiveTrial,
              trialType:
                crackedIneffectiveTrial &&
                (crackedIneffectiveTrial.trialType || crackedIneffectiveTrial.type)
            }
          }
        }
      };

      const hearingDetails = { ...state, current };

      return crackedIneffectiveTrial ? hearingWithcrackedIneffectiveTrial : hearingDetails;

    case HearingActions.LOAD_DEFENDANTS_TRACKING_STATUS_SUCCESS:
      return {
        ...state,
        current: {
          ...state.current,
          electronicMonitoring: action.payload
        }
      };

    case HearingActions.LOAD_AMENDING_USER_DETAILS_SUCCESS:
      return {
        ...state,
        current: {
          ...state.current,
          amendedByUser: action.userDetails
        }
      };

    case HearingActions.SAVE_HEARING_CASE_NOTE_ACTION_SUCCESS:
      const updatedNotes = [...state.current.hearing.hearingCaseNotes, action.payload];
      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            hearingCaseNotes: updatedNotes.sort(
              (a, b) => new Date(b.noteDateTime).getTime() - new Date(a.noteDateTime).getTime()
            )
          }
        }
      };

    case HearingActions.UPDATE_PRESENCE_SUCCESS:
      const defendantAttendanceCopy = cloneDeep(state.current.hearing.defendantAttendance);
      const currentDefendantAttendance = defendantAttendanceCopy.find(
        x => x.defendantId === action.payload.defendantId
      );

      if (currentDefendantAttendance) {
        const found = currentDefendantAttendance.attendanceDays.find(
          x => x.day === action.payload.attendanceDay.day
        );

        if (found) {
          found.attendanceType = action.payload.attendanceDay.attendanceType;
        } else {
          const newAttendanceDay = {
            day: action.payload.attendanceDay.day,
            attendanceType: action.payload.attendanceDay.attendanceType
          };
          currentDefendantAttendance.attendanceDays.push(newAttendanceDay);
        }
      } else {
        const newAd = {
          defendantId: action.payload.defendantId,
          attendanceDays: [
            {
              day: action.payload.attendanceDay.day,
              attendanceType: action.payload.attendanceDay.attendanceType
            }
          ]
        };
        defendantAttendanceCopy.push(newAd);
      }

      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            defendantAttendance: defendantAttendanceCopy
          }
        }
      };

    case HearingActions.SAVE_PROSECUTION_COUNSELS_SUCCESS:
      const counsels = [
        ...action.payload.prosecutionCounselsToUpdate,
        ...action.payload.prosecutionCounselsToAdd
      ];
      const counselsToCache = filterCounselsToCache(state, counsels);
      return {
        ...state,
        counselsCache: {
          firstNameOpts: [
            ...state.counselsCache.firstNameOpts,
            ...buildCounselOptions(counselsToCache, 'firstName')
          ],
          lastNameOpts: [
            ...state.counselsCache.lastNameOpts,
            ...buildCounselOptions(counselsToCache, 'lastName')
          ]
        },
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            prosecutionCounsels: counsels
          }
        }
      };

    case HearingActions.ADD_DEFENCE_COUNSELS_SUCCESS:
      const counselsAddedToCache = filterCounselsToCache(
        state,
        action.payload.defenceCounselsToAdd
      );
      return {
        ...state,
        counselsCache: {
          firstNameOpts: [
            ...state.counselsCache.firstNameOpts,
            ...buildCounselOptions(counselsAddedToCache, 'firstName')
          ],
          lastNameOpts: [
            ...state.counselsCache.lastNameOpts,
            ...buildCounselOptions(counselsAddedToCache, 'lastName')
          ]
        },
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            defenceCounsels: [
              ...state.current.hearing.defenceCounsels,
              ...action.payload.defenceCounselsToAdd
            ]
          }
        }
      };

    case HearingActions.EDIT_DEFENCE_COUNSELS_SUCCESS:
      const counselsEditedToCache = filterCounselsToCache(
        state,
        action.payload.defenceCounselsToEdit
      );
      const updatedDefenceCounsels = state.current.hearing.defenceCounsels.map(dc => {
        const foundDefenceCounsel = action.payload.defenceCounselsToEdit.find(
          editDc => dc.id === editDc.id
        );

        if (!foundDefenceCounsel) {
          return dc;
        } else {
          return foundDefenceCounsel;
        }
      });

      return {
        ...state,
        counselsCache: {
          firstNameOpts: [
            ...state.counselsCache.firstNameOpts,
            ...buildCounselOptions(counselsEditedToCache, 'firstName')
          ],
          lastNameOpts: [
            ...state.counselsCache.lastNameOpts,
            ...buildCounselOptions(counselsEditedToCache, 'lastName')
          ]
        },
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            defenceCounsels: updatedDefenceCounsels
          }
        }
      };

    case HearingActions.REMOVE_DEFENCE_COUNSELS_SUCCESS:
      const dcListAfterRemoving = state.current.hearing.defenceCounsels.filter(dc =>
        action.payload.defenceCounselsToRemove.every(r => r !== dc.id)
      );
      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            defenceCounsels: dcListAfterRemoving
          }
        }
      };

    case HearingActions.ADD_COMPANY_REPRESENTATIVES_SUCCESS:
      const representativesAddedToCache = filterCounselsToCache(
        state,
        action.payload.companyRepresentativesToAdd
      );
      return {
        ...state,
        counselsCache: {
          firstNameOpts: [
            ...state.counselsCache.firstNameOpts,
            ...buildCounselOptions(representativesAddedToCache, 'firstName')
          ],
          lastNameOpts: [
            ...state.counselsCache.lastNameOpts,
            ...buildCounselOptions(representativesAddedToCache, 'lastName')
          ]
        },
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            companyRepresentatives: [
              ...state.current.hearing.companyRepresentatives,
              ...action.payload.companyRepresentativesToAdd
            ]
          }
        }
      };

    case HearingActions.EDIT_COMPANY_REPRESENTATIVES_SUCCESS:
      const representativesEditedToCache = filterCounselsToCache(
        state,
        action.payload.companyRepresentativesToEdit
      );
      const updatedCompanyRepresentatives = state.current.hearing.companyRepresentatives.map(
        rep => {
          const foundCompanyRepresentative = action.payload.companyRepresentativesToEdit.find(
            editDc => rep.id === editDc.id
          );

          if (!foundCompanyRepresentative) {
            return rep;
          } else {
            return foundCompanyRepresentative;
          }
        }
      );

      return {
        ...state,
        counselsCache: {
          firstNameOpts: [
            ...state.counselsCache.firstNameOpts,
            ...buildCounselOptions(representativesEditedToCache, 'firstName')
          ],
          lastNameOpts: [
            ...state.counselsCache.lastNameOpts,
            ...buildCounselOptions(representativesEditedToCache, 'lastName')
          ]
        },
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            companyRepresentatives: updatedCompanyRepresentatives
          }
        }
      };

    case HearingActions.REMOVE_COMPANY_REPRESENTATIVES_SUCCESS:
      const repListAfterRemoving = state.current.hearing.companyRepresentatives.filter(rep =>
        action.payload.companyRepresentativesToRemove.every(r => r !== rep.id)
      );
      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            companyRepresentatives: repListAfterRemoving
          }
        }
      };

    case HearingActions.UPDATE_APPLICATION_RESPONSE_SUCCESS:
      const courtApplications = cloneDeep(state.current.hearing.courtApplications);

      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            courtApplications
          }
        }
      };

    case HearingActions.SAVE_INTERMEDIARY_COUNSELS_SUCCESS: {
      const { added, updated, removed } = action.payload;
      const omit = [...updated.map(counsel => counsel.id), ...removed];

      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            intermediaries: [
              ...(state.current.hearing.intermediaries || []).filter(
                counsel => !omit.includes(counsel.id)
              ),
              ...updated,
              ...added
            ]
          }
        }
      };
    }

    case HearingActions.SAVE_APPLICANT_COUNSELS_SUCCESS: {
      const { added, updated, removed } = action.payload;
      const omit = [...updated, ...removed].map(counsel => counsel.id);

      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            applicantCounsels: [
              ...state.current.hearing.applicantCounsels.filter(
                counsel => !omit.includes(counsel.id)
              ),
              ...updated,
              ...added
            ]
          }
        }
      };
    }

    case HearingActions.SAVE_RESPONDENT_COUNSELS_SUCCESS: {
      const { added, updated, removed } = action.payload;
      const omit = [...updated, ...removed].map(counsel => counsel.id);

      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            respondentCounsels: [
              ...state.current.hearing.respondentCounsels.filter(
                counsel => !omit.includes(counsel.id)
              ),
              ...updated,
              ...added
            ]
          }
        }
      };
    }

    case HearingActions.SET_TRIAL_TYPE_SUCCESS:
      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            crackedIneffectiveTrial: action.payload.trialTypeSuccessBody.crackedIneffectiveTrial,
            isEffectiveTrial: action.payload.trialTypeSuccessBody.isEffectiveTrial
          }
        }
      };

    case HearingActions.SET_TIER_AND_LIST_TYPE_SUCCESS:
      return {
        ...state,
        current: {
          ...state.current,
          hearing: {
            ...state.current.hearing,
            tierAndListType: action.payload.tierAndListType
          }
        }
      };

    case HearingActions.STORE_PLEAS:
      const stateCopy = cloneDeep(state.current);
      const hearing = getUpdatedHearing(stateCopy, action.payload, action.guiltyPleas);
      return {
        ...state,
        current: {
          ...hearing,
          draftHearing: stateCopy.draftHearing ? stateCopy.draftHearing : stateCopy.hearing
        }
      };

    case HearingActions.RESET_PLEAS:
      const currentHearing = cloneDeep(state.current);
      return {
        ...state,
        current: {
          ...currentHearing,
          hearing: currentHearing.draftHearing
            ? currentHearing.draftHearing
            : currentHearing.hearing,
          draftHearing: undefined
        }
      };

    case HearingActions.UPDATE_VERDICT_SUCCESS:
      const hearingVerdict = getUpdatedHearingVerdict(state.current, action.payload);
      return {
        ...state,
        current: {
          ...hearingVerdict,
          draftHearing: undefined
        }
      };

    case HearingActions.APPLY_DECISION:
      const applyDecisionOffence = action.offence;
      const currentStateCopy = cloneDeep(state.current);
      (currentStateCopy.hearing.prosecutionCases || []).forEach(kase => {
        kase.defendants.forEach(defendant => {
          defendant.offences.forEach(offence => {
            if (offence.indicatedPlea) {
              offence.indicatedPlea = {
                ...applyDecisionOffence.indicatedPlea,
                offenceId: offence.indicatedPlea.offenceId
              };
            }
            if (offence.allocationDecision) {
              offence.allocationDecision = {
                ...applyDecisionOffence.allocationDecision,
                offenceId: offence.allocationDecision.offenceId,
                applicationId: offence.allocationDecision.applicationId
              };
            }
            if (offence.plea) {
              offence.plea = {
                ...applyDecisionOffence.plea,
                offenceId: offence.plea.offenceId,
                applicationId: offence.plea.applicationId
              };
            }
          });
        });
      });
      return {
        ...state,
        current: currentStateCopy
      };

    case HearingActions.SEARCH_AVAILABLE_HEARINGS_SUCCESS:
      return {
        ...state,
        available: action.payload
      };

    case HearingActions.RESET_AVAILABLE_HEARINGS:
      return {
        ...state,
        available: null
      };

    default:
      return state;
  }
}

export const hearingReducer = createReducer(
  initialState,
  on(clearCurrentHearing, (state): HearingState => {
    return {
      ...state,
      current: {
        hearingState: null,
        hearing: null
      }
    };
  }),

  on(toggleSittingYouthCourtSuccess, (state, { newYouthCourtDefendantIds }) => ({
    ...state,
    current: {
      ...state.current,
      hearing: {
        ...state.current.hearing,
        youthCourtDefendantIds: newYouthCourtDefendantIds
      }
    }
  })),

  on(getSelectedHearingIsRestrictedSuccess, (state, { isRestricted }) => {
    return {
      ...state,
      isRestricted
    };
  }),

  on(setIsSelectedCaseBulk, (state, { isSelectedCaseBulk }) => {
    return {
      ...state,
      isSelectedCaseBulk
    };
  }),

  on(setHearingState, (state, { amendedByUser, hearingState }) => ({
    ...state,
    current: {
      ...state.current,
      amendedByUserId: amendedByUser ? amendedByUser.userId : null,
      amendedByUser,
      hearingState
    }
  })),

  on(setSelectedOptions, (state, { selectedOptions }) => {
    return {
      ...state,
      selectedOptions: { ...selectedOptions }
    };
  }),

  on(setCurrentAmendmentReason, (state, { amendmentReason }) => {
    return {
      ...state,
      amendmentReason
    };
  }),

  on(clearCurrentAmendmentReason, (state): HearingState => {
    return {
      ...state,
      amendmentReason: null
    };
  }),

  on(setCourtApplication, (state, { courtApplications }) => {
    return {
      ...state,
      current: {
        ...state.current,
        hearing: {
          ...state.current.hearing,
          courtApplications: [
            ...(state.current.hearing.courtApplications || []),
            ...courtApplications
          ]
        }
      }
    };
  }),

  on(setStandaloneAncillaryResults, (state, { standaloneAncillaryResults }) => {
    return {
      ...state,
      standaloneAncillaryResults
    };
  }),

  on(clearStandaloneAncillaryResults, (state): HearingState => {
    return {
      ...state,
      standaloneAncillaryResults: []
    };
  }),

  on(storeDefendantVerdictData, (state, { verdictData }) => {
    const stateCopy = cloneDeep(state.current);
    const hearing = setUpdatedHearingForVerdict(stateCopy, verdictData);
    return {
      ...state,
      current: {
        ...hearing,
        draftHearing: stateCopy.draftHearing ? stateCopy.draftHearing : state.current.hearing
      }
    };
  }),

  on(resetVerdictAction, (state): HearingState => {
    const currentHearing = cloneDeep(state.current);
    return {
      ...state,
      current: {
        ...currentHearing,
        hearing: currentHearing.draftHearing ? currentHearing.draftHearing : currentHearing.hearing,
        draftHearing: undefined
      }
    };
  }),

  on(setDefendantOffence, (state, { offence, defendant, offenceType }) => {
    const stateCopy = cloneDeep(state.current);
    const hearing = setDefendantOffenceForVerdict(stateCopy, { offence, defendant, offenceType });
    return {
      ...state,
      current: {
        ...hearing
      }
    };
  }),

  on(
    HearingActions.loadCrackedIneffectiveSubReasons,
    (state): HearingState => ({
      ...state
    })
  ),

  on(
    HearingActions.loadCrackedIneffectiveSubReasonsSuccess,
    (state, { subReasons }): HearingState => ({
      ...state,
      subReasons
    })
  ),

  on(
    HearingActions.loadCrackedIneffectiveSubReasonsFailure,
    (state): HearingState => ({
      ...state,
      subReasons: []
    })
  ),

  on(
    HearingActions.clearCrackedIneffectiveSubReasons,
    (state): HearingState => ({
      ...state,
      subReasons: []
    })
  ),

  on(
    HearingActions.loadCrackedIneffectiveSubReasonById,
    (state): HearingState => ({
      ...state,
      currentSubReasonLoading: true,
      currentSubReason: null
    })
  ),

  on(
    HearingActions.loadCrackedIneffectiveSubReasonByIdSuccess,
    (state, { subReason }): HearingState => ({
      ...state,
      currentSubReason: subReason,
      currentSubReasonLoading: false,
      subReasons:
        state.subReasons && state.subReasons.some(sr => sr.id === subReason.id)
          ? state.subReasons
          : [...(state.subReasons || []), subReason]
    })
  ),

  on(
    HearingActions.loadCrackedIneffectiveSubReasonByIdFailure,
    (state): HearingState => ({
      ...state,
      currentSubReason: null,
      currentSubReasonLoading: false
    })
  ),

  on(HearingActions.setTrialEffectivenessError, (state, { error }) => ({
    ...state,
    trialEffectivenessError: error
  })),

  on(
    HearingActions.loadCheckInHearingListSuccess,
    (state, { summaries }): HearingState => ({
      ...state,
      checkInSummaries: summaries
    })
  ),

  on(
    HearingActions.clearCheckInHearingList,
    (state): HearingState => ({
      ...state,
      checkInSummaries: []
    })
  )
);

// we compose both reducers until we migrate the hearing legacy reducer above
export function composeHearingReducers(state = initialState, action: HearingAction): HearingState {
  return [hearingLegacyReducer, hearingReducer].reduce(
    (prevState, reducer: (state: HearingState, action: HearingAction) => HearingState) => {
      return reducer(prevState, action);
    },
    state
  );
}

type Counsel = ProsecutionCounsel | CompanyRepresentative | DefenceCounsel;

function getUpdatedHearingVerdict(
  hearing: HearingDetailResponse,
  payload: { verdict: { verdicts: Verdict[] }; hearingId: string }
): HearingDetailResponse {
  const hearingCopy = cloneDeep(hearing);

  (hearingCopy.hearing.prosecutionCases || []).forEach(kase => {
    kase.defendants.forEach(defendant => {
      defendant.offences.forEach((offence: Offence) => {
        getUpdatedHearingVerdictPerAppOrOffence(offence, payload);
      });
    });
  });

  (hearingCopy.hearing.courtApplications || []).forEach(app => {
    if (!!app.type.pleaApplicableFlag) {
      getUpdatedHearingVerdictPerAppOrOffence(app, payload);
    }
    (app.courtApplicationCases || []).forEach(kase => {
      (kase.offences || []).forEach(offence => {
        getUpdatedHearingVerdictPerAppOrOffence(offence, payload);
      });
    });
    if (app.courtOrder) {
      (app.courtOrder.courtOrderOffences || []).forEach(offence => {
        getUpdatedHearingVerdictPerAppOrOffence(offence.offence, payload);
      });
    }
  });

  return hearingCopy;
}

function getUpdatedHearingVerdictPerAppOrOffence(
  appOrOffence: CourtApplication | Offence,
  payload: { verdict: { verdicts: Verdict[] }; hearingId: string }
) {
  const updatedVerdict = (appOrOffence as CourtApplication).type
    ? payload.verdict.verdicts.find(verdict => verdict.applicationId === appOrOffence.id)
    : payload.verdict.verdicts.find(verdict => verdict.offenceId === appOrOffence.id);

  if (updatedVerdict) {
    if (
      updatedVerdict.verdictType &&
      updatedVerdict.verdictType.categoryType.indexOf('GUILTY') === 0 &&
      !appOrOffence.convictionDate
    ) {
      appOrOffence.convictionDate = updatedVerdict.verdictDate;
    }

    if (
      updatedVerdict.verdictType &&
      updatedVerdict.verdictType.categoryType.indexOf('NOT_GUILTY') === 0
    ) {
      appOrOffence.convictionDate = undefined;
    }

    appOrOffence.verdict = { ...updatedVerdict };
  }
}

function getUpdatedHearing(
  hearing: HearingDetailResponse,
  payload: PleaData[],
  guiltyPleas: string[]
): HearingDetailResponse {
  const hearingCopy = cloneDeep(hearing);

  (hearingCopy.hearing.prosecutionCases || []).forEach(kase => {
    kase.defendants.forEach(defendant => {
      defendant.offences.forEach((offence: Offence) => {
        getUpdatedHearingPerAppOrOffence(offence, payload, guiltyPleas);
      });
    });
  });

  (hearingCopy.hearing.courtApplications || []).forEach(app => {
    if (!!app.type.pleaApplicableFlag) {
      getUpdatedHearingPerAppOrOffence(app, payload, guiltyPleas);
    }
    (app.courtApplicationCases || []).forEach(kase => {
      (kase.offences || []).forEach(offence => {
        getUpdatedHearingPerAppOrOffence(offence, payload, guiltyPleas);
      });
    });
    if (!!app.courtOrder) {
      (app.courtOrder.courtOrderOffences || []).forEach(offence => {
        getUpdatedHearingPerAppOrOffence(offence.offence, payload, guiltyPleas);
      });
    }
  });

  return hearingCopy;
}

function getUpdatedHearingPerAppOrOffence(
  appOrOffence: CourtApplication | Offence,
  payload: PleaData[],
  guiltyPleas: string[]
) {
  const updatedOffence = payload.find(plea => plea.offenceId === appOrOffence.id);
  if (updatedOffence) {
    if (updatedOffence.plea) {
      if (guiltyPleas.includes(updatedOffence.plea.pleaValue) && !appOrOffence.convictionDate) {
        appOrOffence.convictionDate = updatedOffence.plea.pleaDate;
      }

      if (
        !guiltyPleas.includes(updatedOffence.plea.pleaValue) &&
        appOrOffence.verdict &&
        appOrOffence.verdict.verdictType &&
        appOrOffence.verdict.verdictType.categoryType !== 'GUILTY'
      ) {
        appOrOffence.convictionDate = undefined;
      }
    }

    if (
      updatedOffence.indicatedPlea &&
      updatedOffence.indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY'
    ) {
      appOrOffence.allocationDecision = {};
    } else if (
      updatedOffence.allocationDecision &&
      updatedOffence.indicatedPlea &&
      updatedOffence.indicatedPlea.indicatedPleaValue !== 'INDICATED_GUILTY'
    ) {
      appOrOffence.allocationDecision = updatedOffence.allocationDecision.courtIndicatedSentence
        ? { ...appOrOffence.allocationDecision, ...updatedOffence.allocationDecision }
        : {
            ...appOrOffence.allocationDecision,
            ...updatedOffence.allocationDecision,
            courtIndicatedSentence: {}
          };
    }
    if (updatedOffence.allocationDecision) {
      appOrOffence.allocationDecision.motReasonCode =
        updatedOffence.allocationDecision.motReasonCode;
      appOrOffence.allocationDecision.motReasonDescription =
        updatedOffence.allocationDecision.motReasonDescription;
      appOrOffence.allocationDecision.motReasonId = updatedOffence.allocationDecision.motReasonId;
    }

    appOrOffence.indicatedPlea = updatedOffence.indicatedPlea
      ? updatedOffence.indicatedPlea
      : appOrOffence.indicatedPlea;
    appOrOffence.plea = { ...appOrOffence.plea, ...updatedOffence.plea };
  }
}

function filterCounselsToCache(state: HearingState, counsels: Counsel[]) {
  return counsels.filter(counsel => !isCounselInCache(state.counselsCache, counsel));
}

function isCounselInCache(counselsCache: CounselsCache, counsel: Counsel): boolean {
  return Boolean(
    counselsCache.firstNameOpts.find(cachedFirstNameOpts => {
      const cachedCounsel = cachedFirstNameOpts.value;
      return (
        cachedCounsel.firstName === counsel.firstName && cachedCounsel.lastName === counsel.lastName
      );
    })
  );
}

function buildCounselOptions<k extends keyof Counsel>(counsels: Counsel[], prop: k) {
  return counsels.map(counsel => ({
    label: counsel[prop],
    value: counsel
  }));
}

function populatePleasVerdicts(hearing: HearingDetailResponse): HearingDetailResponse {
  const hearingCopy = cloneDeep(hearing);

  (hearingCopy.hearing.prosecutionCases || []).forEach(kase => {
    kase.defendants.forEach(defendant => {
      const isYouth = !!defendant.isYouth;
      (defendant.offences || []).forEach((offence: Offence) => {
        populatePleasVerdictsPerOffence(hearingCopy.hearing.id, offence, isYouth);
      });
    });
  });

  (hearingCopy.hearing.courtApplications || []).forEach(app => {
    if (!!app.type.pleaApplicableFlag) {
      populatePleasVerdictsPerOffence(hearingCopy.hearing.id, app);
    }
    (app.courtApplicationCases || []).forEach(kase => {
      (kase.offences || []).forEach(offence => {
        populatePleasVerdictsPerOffence(hearingCopy.hearing.id, offence);
      });
    });
    if (app.courtOrder) {
      (app.courtOrder.courtOrderOffences || []).forEach(offence => {
        populatePleasVerdictsPerOffence(hearingCopy.hearing.id, offence.offence);
      });
    }
  });
  return hearingCopy;
}

function populatePleasVerdictsPerOffence(
  hearingId: string,
  appOrOffence: CourtApplication | Offence,
  isYouth = false
) {
  const applicationId = (appOrOffence as CourtApplication).type ? appOrOffence.id : undefined;
  const offenceId = appOrOffence.id;

  if (!appOrOffence.plea) {
    appOrOffence.plea = {
      offenceId,
      applicationId,
      originatingHearingId: hearingId,
      pleaDate: null,
      pleaValue: null
    };
  }

  if (
    (appOrOffence.modeOfTrial === 'Either Way' ||
      (appOrOffence.modeOfTrial === 'Indictable' && isYouth)) &&
    !appOrOffence.indicatedPlea
  ) {
    appOrOffence.indicatedPlea = {
      offenceId: appOrOffence.id,
      originatingHearingId: hearingId,
      indicatedPleaDate: null,
      indicatedPleaValue: null
    };
  }

  if (!appOrOffence.allocationDecision) {
    appOrOffence.allocationDecision = {
      offenceId: appOrOffence.id,
      originatingHearingId: hearingId,
      motReasonCode: null,
      motReasonDescription: null,
      motReasonId: null,
      courtIndicatedSentence: {}
    };
  }

  if (appOrOffence.allocationDecision && !appOrOffence.allocationDecision.courtIndicatedSentence) {
    appOrOffence.allocationDecision.courtIndicatedSentence = {
      courtIndicatedSentenceTypeId: null,
      courtIndicatedSentenceDescription: null
    };
  }

  const { verdict = <Verdict>{} } = appOrOffence;
  const templateVerdict: Verdict = {
    offenceId,
    applicationId,
    verdictDate: null,
    verdictType: {
      id: null,
      code: '',
      description: '',
      category: '',
      categoryType: '',
      jurisdiction: ''
    },
    originatingHearingId: hearingId,
    lesserOrAlternativeOffence: null,
    jurors: {
      numberOfJurors: 12,
      numberOfSplitJurors: 0,
      unanimous: true
    }
  };
  appOrOffence.verdict = merge(templateVerdict, verdict);
}

function setUpdatedHearingForVerdict(
  hearing: HearingDetailResponse,
  payload: UpdateVerdictData[]
): HearingDetailResponse {
  const hearingCopy = hearing;

  (hearingCopy.hearing.prosecutionCases || []).forEach(kase => {
    kase.defendants.forEach(defendant => {
      defendant.offences.forEach((offence: Offence) => {
        setUpdatedHearingForVerdictPerAppOrOffence(offence, payload);
      });
    });
  });

  (hearingCopy.hearing.courtApplications || []).forEach(app => {
    if (!!app.type.pleaApplicableFlag) {
      setUpdatedHearingForVerdictPerAppOrOffence(app, payload);
    }
    (app.courtApplicationCases || []).forEach(kase => {
      (kase.offences || []).forEach(offence => {
        setUpdatedHearingForVerdictPerAppOrOffence(offence, payload);
      });
    });
    if (!!app.courtOrder) {
      (app.courtOrder.courtOrderOffences || []).forEach(offence => {
        setUpdatedHearingForVerdictPerAppOrOffence(offence.offence, payload);
      });
    }
  });
  return hearingCopy;
}

function setUpdatedHearingForVerdictPerAppOrOffence(
  appOrOffence: CourtApplication | Offence,
  payload: UpdateVerdictData[]
) {
  const updatedOffenceVerdict = payload.find(verdict => verdict.offenceId === appOrOffence.id);
  if (updatedOffenceVerdict) {
    if (updatedOffenceVerdict.verdict) {
      appOrOffence.verdict = {
        ...updatedOffenceVerdict.verdict
      };
    }
  }
}

function setDefendantOffenceForVerdict(
  hearing: HearingDetailResponse,
  payload: { offence: Offence; defendant: Defendant; offenceType: OffenceType }
) {
  const hearingCopy = hearing;

  (hearingCopy.hearing.prosecutionCases || []).forEach(kase => {
    const selectedDefendant = kase.defendants.find(
      eachDefendant => eachDefendant.id === payload.defendant.id
    );
    setLesserOffenceForCase(selectedDefendant, payload, kase);
  });

  (hearingCopy.hearing.courtApplications || []).forEach(app => {
    if (!!app.type.pleaApplicableFlag) {
      setLesserOffenceForAppOffence(app, payload);
    }
    (app.courtApplicationCases || []).forEach(kase => {
      (kase.offences || []).forEach(offence => {
        setLesserOffenceForAppOffence(offence, payload);
      });
    });
    if (!!app.courtOrder) {
      (app.courtOrder.courtOrderOffences || []).forEach(offence => {
        setLesserOffenceForAppOffence(offence.offence, payload);
      });
    }
  });

  return hearingCopy;
}

function setLesserOffenceForCase(
  selectedDefendant: Defendant,
  payload: { offence: Offence; defendant: Defendant; offenceType: OffenceType },
  prosecutionCase: ProsecutionCaseDetails
) {
  if (selectedDefendant) {
    const updatedOffences = selectedDefendant.offences.reduce<Offence[]>((acc, currentOffence) => {
      let offenceToUpdate = currentOffence;
      if (currentOffence.id === payload.offence.id) {
        offenceToUpdate = {
          ...offenceToUpdate,
          verdict: {
            ...offenceToUpdate.verdict,
            lesserOrAlternativeOffence: {
              offenceCode: payload.offenceType.cjsOffenceCode,
              offenceDefinitionId: payload.offenceType.offenceId,
              offenceTitle: payload.offenceType.title,
              offenceLegislation: payload.offenceType.legislation
            }
          }
        };
      }
      acc.push(offenceToUpdate);
      return acc;
    }, []);
    selectedDefendant.offences = updatedOffences;
  }

  prosecutionCase.defendants.forEach(perDefendant => {
    if (perDefendant.id === selectedDefendant.id) {
      perDefendant = selectedDefendant;
    }
  });
}

function setLesserOffenceForAppOffence(
  appOrOffence: CourtApplication | Offence,
  payload: { offence: Offence; defendant: Defendant; offenceType: OffenceType }
) {
  if (appOrOffence.id === payload.offence.id) {
    appOrOffence.verdict = {
      ...appOrOffence.verdict,
      lesserOrAlternativeOffence: {
        offenceCode: payload.offenceType.cjsOffenceCode,
        offenceDefinitionId: payload.offenceType.offenceId,
        offenceTitle: payload.offenceType.title,
        offenceLegislation: payload.offenceType.legislation
      }
    };
  }
}
