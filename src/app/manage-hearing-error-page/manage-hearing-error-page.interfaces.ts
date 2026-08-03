import { NotificationEvent } from '@cpp/core';
import { HearingLockState } from '../core/model/hearing-detail';

export enum ManageHearingErrorType {
  VERSION = 'VERSION',
  SHARED = 'SHARED'
}

export interface ManageHearingPublicEventError extends NotificationEvent {
  hearingId: string;
  hearingState?: HearingLockState;
  error: {
    type: ManageHearingErrorType;
    code: string;
    reason: string;
  };
  info: {
    hearingDay: string;
    lastUpdatedByUserName: string;
    userName: string;
    version: number;
    lastUpdatedVersion?: number;
  };
}
