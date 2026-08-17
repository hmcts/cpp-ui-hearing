import { ListType, Tier, Tier2Subcategory } from '../core';

export interface TierOption {
  value: Tier;
  labelKey: string;
  descriptionKey: string;
}

export interface Tier2SubcategoryOption {
  value: Tier2Subcategory;
  labelKey: string;
}

export interface ListTypeOption {
  value: ListType;
  labelKey: string;
  hintKey: string;
}

/**
 * The seven Practice Direction tiers, in the order the judge considers them.
 * Descriptions are fixed statutory wording, so they live in i18n rather than
 * coming from reference data.
 */
export const TIER_OPTIONS: TierOption[] = [
  {
    value: 'TIER_1',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_1',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_1_DESCRIPTION'
  },
  {
    value: 'TIER_2',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_2_DESCRIPTION'
  },
  {
    value: 'TIER_3',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_3',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_3_DESCRIPTION'
  },
  {
    value: 'TIER_4',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_4',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_4_DESCRIPTION'
  },
  {
    value: 'TIER_5',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_5',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_5_DESCRIPTION'
  },
  {
    value: 'TIER_6',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_6',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_6_DESCRIPTION'
  },
  {
    value: 'TIER_7',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_7',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_7_DESCRIPTION'
  }
];

/** Revealed only when tier 2 is selected; one of them is then required. */
export const TIER_2_SUBCATEGORY_OPTIONS: Tier2SubcategoryOption[] = [
  {
    value: 'LAY_WITNESS_RECOLLECTION',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_LAY_WITNESS_RECOLLECTION'
  },
  {
    value: 'DELAY_AFFECTS_EVIDENCE_QUALITY',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_DELAY_AFFECTS_EVIDENCE_QUALITY'
  },
  {
    value: 'DELAY_AFFECTS_PARTICIPATION',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_DELAY_AFFECTS_PARTICIPATION'
  },
  {
    value: 'WITNESS_FROM_ABROAD',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_WITNESS_FROM_ABROAD'
  },
  {
    value: 'CONTESTED_EXPERT_EVIDENCE',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_CONTESTED_EXPERT_EVIDENCE'
  },
  {
    value: 'ESTIMATE_EXCEEDS_5_DAYS',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_ESTIMATE_EXCEEDS_5_DAYS'
  }
];

export const LIST_TYPE_OPTIONS: ListTypeOption[] = [
  {
    value: 'TYPE_1',
    labelKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_1',
    hintKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_1_HINT'
  },
  {
    value: 'TYPE_2',
    labelKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_2',
    hintKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_2_HINT'
  }
];

export const TIER_2 = 'TIER_2';
export const LIST_TYPE_FIXED_DATE = 'TYPE_1';
