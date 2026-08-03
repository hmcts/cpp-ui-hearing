export interface CheckInDefendant {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  organisationName?: string;
}

export interface CheckInProsecutionCaseIdentifier {
  caseURN?: string;
  prosecutionAuthorityReference?: string;
}

export interface CheckInProsecutionCaseSummary {
  id: string;
  prosecutionCaseIdentifier: CheckInProsecutionCaseIdentifier;
  defendants: CheckInDefendant[];
}

export interface CheckInCourtCentre {
  roomName: string;
}

export interface CheckInHearingSummary {
  id: string;
  courtCentre: CheckInCourtCentre;
  prosecutionCaseSummaries: CheckInProsecutionCaseSummary[];
}
