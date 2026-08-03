import { JurisdictionType } from '../core/model/hearing-detail';

export interface ResultsValidationErrors {
  errorMessages: string[];
  validationIssues: ValidationIssue[];
}

export interface ResultsValidationResponse {
  validationId: string;
  timestamp: string;
  mode: string;
  rulesEvaluated: string[];
  isValid: boolean;
  errors: ResultsValidationErrors;
  warnings: ValidationIssue[];
  processingTimeMs: number;
}

export interface AffectedOffence {
  offenceId?: string;
  offenceTitle?: string;
  message?: string;
}

export interface AffectedDefendant {
  defendantId: string;
  message: string;
}

export type ValidationLevel = 'OFFENCE' | 'DEFENDANT';

export interface ValidationMessage {
  ruleId: string;
  message: string;
}

export interface ValidationIssue {
  ruleId?: string;
  severity?: ValidationIssueSeverityEnum;
  message?: string;
  affectedResultCodes?: string[];
  affectedOffences?: AffectedOffence[];
  affectedDefendants?: AffectedDefendant[];
  validationLevel?: ValidationLevel;
}

export enum ValidationIssueSeverityEnum {
  ERROR = 'ERROR',
  WARNING = 'WARNING'
}

export type ResultLineCategoryEnum = 'A' | 'I' | 'F';

export interface ResultsValidationPrompt {
  promptRef: string;
  promptValue?: string;
}

export interface ResultsLineValidation {
  resultLineId: string;
  shortCode: string;
  label: string;
  defendantId: string;
  offenceId: string;
  isConcurrent?: boolean;
  consecutiveToOffence?: string;
  category?: ResultLineCategoryEnum;
  prompts?: ResultsValidationPrompt[];
}

export interface ResultsValidationDefendant {
  defendantId: string;
  firstName: string;
  lastName: string;
  masterDefendantId?: string;
}

export interface ResultsValidationOffence {
  offenceId: string;
  offenceCode: string;
  offenceTitle: string;
  hasActiveElectronicMonitoring?: boolean;
  orderIndex?: number;
  caseUrn?: string;
  hasExistingCtlRecord?: boolean;
  isConvicted?: boolean;
}

export interface ResultsValidation {
  hearingId: string;
  caseId?: string;
  hearingDay: string;
  courtType: JurisdictionType;
  resultLines: ResultsLineValidation[];
  defendants: ResultsValidationDefendant[];
  offences: ResultsValidationOffence[];
}
