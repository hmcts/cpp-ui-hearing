export interface IdpcIngestionParams {
  courtCentreId: string;
  roomId: string;
  date: string;
}

export interface IdpcIngestionResponse {
  lastUpdated: string;
  phase: IdpcIngestionPhase;
  message: string;
}

export enum IdpcIngestionPhase {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  FORBIDDEN = 'FORBIDDEN'
}
