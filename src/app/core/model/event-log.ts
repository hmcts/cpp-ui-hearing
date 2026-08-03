export interface EventLogView extends EventLog {
  expanded?: boolean;
  overflow?: boolean;
  isCreate?: boolean;
}

export interface EventLog {
  hearingEventId?: string;
  latestHearingEventId?: string;
  hearingEventDefinitionId?: string;
  alterable?: boolean;
  recordedLabel?: string;
  eventTime?: string;
  lastModifiedTime?: string;
  override?: boolean;
  note?: string;
}

export interface EventInfo {
  events: EventLog[];
  hearingId: string;
  hasActiveHearing?: boolean;
}

export interface EventLogCountInfo {
  eventLogCountByHearingIdAndDate: number;
  eventLogCountByHearingId: number;
}
