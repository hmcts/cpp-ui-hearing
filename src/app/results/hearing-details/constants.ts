import { HearingType } from '@cpp/reference-data';

// NOTE:
// defaultHearingTypePlaceHolder is not exported from @cpp/reference-data in v19
// @reference-data//src/components/hmi-hearing-type.autosuggest.ts
export const defaultHearingTypePlaceHolder: HearingType = {
  id: 'All',
  hearingCode: 'All',
  seqId: 0,
  defaultDurationMin: 0,
  welshHearingDescription: '',
  hearingDescription: 'All hearing types',
  magistratesFlag: true,
  crownFlag: true,
};
