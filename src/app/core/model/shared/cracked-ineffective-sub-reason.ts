export interface CrackedIneffectiveSubReason {
  id: string;
  primaryReasonCode: string;
  subReasonCode: string;
  subReasonDesc: string;
  validFrom: string;
  validTo: string;
}

export interface CrackedIneffectiveSubReasonResponse {
  crackedIneffectiveSubReasons: CrackedIneffectiveSubReason[];
}
