import mockDataJson from './hearing.json';
import { HearingDetail } from '../../model/hearing-detail';
import { HearingSummary } from '../../model/hearing-summary';

export interface MockHearingData {
  hearing: Partial<HearingDetail>;
  hearingList?: Partial<HearingDetail>[];
  hearingSummaries?: Partial<HearingSummary>[];
  [key: string]: unknown;
}

export const mockData = mockDataJson as unknown as MockHearingData;

export const hearing = mockData.hearing;
export const hearingList = mockData.hearingList;
export const hearingSummaries = mockData.hearingSummaries;
