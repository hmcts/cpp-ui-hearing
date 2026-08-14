import { Tier } from './ptph-detail.model';

export interface TierOption {
  value: Tier;
  labelKey: string;
  descriptionKey: string;
  bulletKeys: string[];
}

export const TIER_OPTIONS: readonly TierOption[] = [
  {
    value: 'TIER_1',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_1_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_1_DESCRIPTION',
    bulletKeys: []
  },
  {
    value: 'TIER_2',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_2_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_2_INTRO',
    bulletKeys: [
      'TIER_AND_LIST_TYPE.TIER_2_BULLET_1',
      'TIER_AND_LIST_TYPE.TIER_2_BULLET_2',
      'TIER_AND_LIST_TYPE.TIER_2_BULLET_3',
      'TIER_AND_LIST_TYPE.TIER_2_BULLET_4',
      'TIER_AND_LIST_TYPE.TIER_2_BULLET_5'
    ]
  },
  {
    value: 'TIER_3',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_3_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_3_DESCRIPTION',
    bulletKeys: []
  },
  {
    value: 'TIER_4',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_4_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_4_DESCRIPTION',
    bulletKeys: []
  },
  {
    value: 'TIER_5',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_5_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_5_DESCRIPTION',
    bulletKeys: []
  },
  {
    value: 'TIER_6',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_6_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_6_DESCRIPTION',
    bulletKeys: []
  },
  {
    value: 'TIER_7',
    labelKey: 'TIER_AND_LIST_TYPE.TIER_7_LABEL',
    descriptionKey: 'TIER_AND_LIST_TYPE.TIER_7_DESCRIPTION',
    bulletKeys: []
  }
];
