import { HearingReferenceDataAction } from '../actions';
import * as HearingReferenceDataActions from '../actions/hearing-reference-data';
import { MotReason, SentencingIndication } from '../../contexts';
import { VerdictType, AmendmentReason } from '..';
import {
  AlcoholLevelMethod,
  ApplicationOutcomeTypeByApplicationMap,
  ApplicationResponseTypeByApplicationMap,
  TrialType
} from '../model';

export interface HearingReferenceDataState {
  verdictTypes: VerdictType[];
  amendmentReasons: AmendmentReason[];
  alcoholLevelMethods: AlcoholLevelMethod[];
  trialTypes: TrialType[];
  courtApplicationOutcomeTypes: ApplicationOutcomeTypeByApplicationMap;
  courtApplicationResponseTypes: ApplicationResponseTypeByApplicationMap;
  motReasons: MotReason[];
  sentencingIndications: SentencingIndication[];
}

const initialState: HearingReferenceDataState = {
  verdictTypes: [],
  amendmentReasons: [],
  alcoholLevelMethods: [],
  trialTypes: [],
  courtApplicationOutcomeTypes: {},
  courtApplicationResponseTypes: {},
  motReasons: [],
  sentencingIndications: []
};

export function hearingReferencedataReducer(
  state: HearingReferenceDataState = initialState,
  action: HearingReferenceDataAction
): HearingReferenceDataState {
  switch (action.type) {
    case HearingReferenceDataActions.LOAD_VERDICT_TYPES_SUCCESS:
      return {
        ...state,
        verdictTypes: [...action.payload]
      };

    case HearingReferenceDataActions.LOAD_AMENDMENT_REASONS_SUCCESS:
      return {
        ...state,
        amendmentReasons: [...action.payload]
      };

    case HearingReferenceDataActions.LOAD_COURT_APPLICATION_OUTCOME_TYPES_SUCCESS:
      return {
        ...state,
        courtApplicationOutcomeTypes: { ...action.payload }
      };

    case HearingReferenceDataActions.LOAD_COURT_APPLICATION_RESPONSE_TYPES_SUCCESS:
      return {
        ...state,
        courtApplicationResponseTypes: { ...action.payload }
      };

    case HearingReferenceDataActions.LOAD_MOT_REASONS_SUCCESS:
      return {
        ...state,
        motReasons: [...action.payload]
      };

    case HearingReferenceDataActions.LOAD_SENTENCING_INDICATIONS_SUCCESS:
      return {
        ...state,
        sentencingIndications: [...action.payload]
      };

    case HearingReferenceDataActions.LOAD_ALCOHOL_LEVEL_METHODS_SUCCESS:
      return {
        ...state,
        alcoholLevelMethods: [...action.payload]
      };

    default:
      return state;
  }
}
