import { DelegatedPowers } from './delegated-powers';
import { JudicialResultPrompt } from './judicial-result-prompt';

export interface JudicialResult {
  cJSCode: boolean;
  category: string;
  courtClerk: DelegatedPowers;
  isAdjournmentResult: boolean;
  isAvailableForCourtExtract: boolean;
  isConvictedResult: boolean;
  isFinancialResult: boolean;
  judicialResultPrompts: JudicialResultPrompt[];
  label: string;
  lastSharedDateTime: string;
  orderedDate: string;
  orderedHearingId: string;
  rank: number;
  usergroups: string[];
  welshLabel: string;
}
