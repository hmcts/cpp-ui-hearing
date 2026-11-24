export interface CustodyEstablishment {
  id: string;
  name: string;
  custody: string;
  /** When the custodial establishment was last changed (ISO-8601), if known. */
  lastUpdated?: string;
}
