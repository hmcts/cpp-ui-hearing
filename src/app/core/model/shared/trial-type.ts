/**/
import { CrackedIneffectiveSubReason } from './cracked-ineffective-sub-reason';
export interface TrialType {
  id: string;
  seqNo: number;
  reasonCode: string;
  trialType: string;
  jurisdiction: string;
  reasonShortDescription: string;
  value?: string;
  label?: string;
  vacateTrial?: boolean;
  type?: string;
  crackedIneffectiveSubReasonId?: string;
  subReason?: CrackedIneffectiveSubReason;
}

export interface TrialTypeBody {
  trialTypeId?: string;
  isEffectiveTrial?: boolean;
  crackedIneffectiveSubReasonId?: string;
}

export interface TrialTypeSuccessBody {
  crackedIneffectiveTrial?: TrialType;
  isEffectiveTrial?: boolean;
}

export enum TrialTypeEnum {
  EFFECTIVE = 'Effective',
  CRACKED = 'Cracked',
  INEFFECTIVE = 'Ineffective',
  VACATED = 'Vacated'
}
