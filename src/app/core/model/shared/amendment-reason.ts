export interface AmendmentReason {
  id: string;
  description?: string;
  date?: string;
  seqNo?: number;
  reasonDescription?: string;
  validFrom?: string;
  reasonCode?: string;
}

export const ADMIN_ERROR_REASON_CODE = 'AE';
