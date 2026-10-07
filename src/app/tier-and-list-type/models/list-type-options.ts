import { ListType } from './ptph-detail.model';

export interface ListTypeOption {
  value: ListType;
  labelKey: string;
  hintKey: string;
  requiresKeyReason: boolean;
}

export const LIST_TYPE_OPTIONS: readonly ListTypeOption[] = [
  {
    value: 'TYPE_1_FIXED',
    labelKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_1_LABEL',
    hintKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_1_HINT',
    requiresKeyReason: true
  },
  {
    value: 'TYPE_2_FLEXIBLE',
    labelKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_2_LABEL',
    hintKey: 'TIER_AND_LIST_TYPE.LIST_TYPE_2_HINT',
    requiresKeyReason: false
  }
];

export const listTypeOption = (listType: ListType | null | undefined): ListTypeOption | undefined =>
  listType ? LIST_TYPE_OPTIONS.find(option => option.value === listType) : undefined;

export const listTypeRequiresKeyReason = (listType: ListType | null | undefined): boolean =>
  listTypeOption(listType)?.requiresKeyReason === true;
