/**/
export type Tier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4' | 'TIER_5' | 'TIER_6' | 'TIER_7';

export type Tier2Subcategory =
  | 'LAY_WITNESS_RECOLLECTION'
  | 'DELAY_AFFECTS_EVIDENCE_QUALITY'
  | 'DELAY_AFFECTS_PARTICIPATION'
  | 'WITNESS_FROM_ABROAD'
  | 'CONTESTED_EXPERT_EVIDENCE'
  | 'ESTIMATE_EXCEEDS_5_DAYS';

export type ListType = 'TYPE_1' | 'TYPE_2';

export interface TierAndListType {
  tier: Tier;
  tier2Subcategory?: Tier2Subcategory;
  listType?: ListType;
  fixedDateReason?: string;
}
