export type Tier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4' | 'TIER_5' | 'TIER_6' | 'TIER_7';

export type ListType = 'TYPE_1_FIXED' | 'TYPE_2_FLEXIBLE';

export interface PtphDetail {
  tier?: Tier | null;
  listType?: ListType | null;
  keyReason?: string | null;
  finalised: boolean;
}

export interface SavePtphDetailPayload {
  hearingId: string;
  tier: Tier;
  listType?: ListType | null;
  keyReason?: string | null;
}
