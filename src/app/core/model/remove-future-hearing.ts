export interface RemoveFutureHearing {
  hearingId: string;
  reasonId?: string;
  offenceIds?: string[];
  hearingToRemove?: boolean;
}
