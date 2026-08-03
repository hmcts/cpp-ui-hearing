import { AmendmentReason, HearingDetail } from '../core';

export type BailStatusCode = 'C' | 'P' | 'L' | 'S' | 'B' | 'U';

// Draft result

export type DraftStatus = 'DRAFT' | 'SHARED' | 'READONLY';

export interface DraftResult<R extends AnyDraftResultLine = AnyDraftResultLine> {
  hearingId: string;
  hearingDay: string;
  resultLines: Record<string, R>;
  relations: DraftResultRelation[];
  shadowListedOffenceIds: string[];
  delegatedPowers?: boolean;
  version?: number;
}

export interface DraftResultRelation {
  resultLineId: string;
  ruleType: 'standalone' | 'unknown' | ChildResultDefinition['ruleType'];
  childResultLineIds: string[];
}

export interface CompressedDraftResultWithMetadata {
  body: string;
  isResetResults?: boolean; // This flag in the payload bypasses BE check for hearing state
  __metadata__: {
    lastSharedTime?: string;
    version: number;
  };
}

export type DraftResultWithMetadata<T extends DraftResult = DraftResult> = T & {
  __metadata__: {
    lastSharedTime?: string;
    version: number;
  };
};

export type ApplicationLike<T extends object = {}> = T & {
  applicationId: string;
  caseId?: string;
  masterDefendantId?: string;
};

export type OffenceLike<T extends object = {}> = T & {
  applicationId?: string;
  caseId: string;
  defendantId: string;
  masterDefendantId: string;
  offenceId: string;
};

export type TargetLike<T extends object = {}> = ApplicationLike<T> | OffenceLike<T>;

interface AbstractUnresolvedDraftResultLine {
  resultLineId: string;
  orderedDate: string;
  originalText: string;
  unresolvedParts: RemoteUnresolvedPart[];
  amendmentReason?: AmendmentReason;
  amendmentDate?: string;
}

export type UnresolvedDraftResultLine = TargetLike<AbstractUnresolvedDraftResultLine>;

interface AbstractResolvedDraftResultLine
  extends Omit<AbstractUnresolvedDraftResultLine, 'unresolvedParts'> {
  autoPopulateBooleanResult?: string;
  category?: 'A' | 'I' | 'F';
  deleted?: boolean;
  disabled?: boolean;
  resultLineId: string;
  orderedDate: string;
  resultDefinitionId: string;
  label: string;
  shortCode: string;
  resultPrompts: DraftResultPrompt[];
  resultLevel: ResultDefinitionLevel;
  originalText: string;
  unresolvedParts: UnresolvedPromptPart[];
  valid: boolean;
  amendmentsLog?: AmendmentsLog;
  conditionalMandatory?: boolean;
  sharedDate?: string;
  unscheduled?: boolean;
  nonStandaloneAncillaryResult?: boolean;
}

export interface AmendmentsLog {
  isAmended: boolean;
  isCurrentlyAdded?: boolean;
  resultWithoutPrompts?: boolean;
  amendmentsRecord?: AmendmentRecord[];
}

export interface AmendmentRecord {
  amendedBy: string;
  amendmentDate: string;
  amendmentReason: AmendmentReason;
  resultPromptsRecord: DraftResultPrompt[];
  validatedBy?: string;
  validationDate?: string;
}

export type ResolvedDraftResultLine = TargetLike<AbstractResolvedDraftResultLine>;

interface AbstractExtendedResolvedDraftResultLine extends AbstractResolvedDraftResultLine {
  bailStatusCode?: BailStatusCode;
  conditionalMandatory: boolean;
  excludedFromResults: boolean;
  childResultDefinitions?: ChildResultDefinition[];
  promptChoices: PromptChoice[];
}

export type ExtendedResolvedDraftResultLine = TargetLike<AbstractExtendedResolvedDraftResultLine>;

interface AbstractConditionalMandatoryDraftResultLine extends AbstractResolvedDraftResultLine {
  conditionalMandatory: true;
  childResultDefinitions: ChildResultDefinition[];
}

export type ConditionalMandatoryDraftResultLine =
  TargetLike<AbstractConditionalMandatoryDraftResultLine>;

export type AnyDraftResultLine =
  | ConditionalMandatoryDraftResultLine
  | ExtendedResolvedDraftResultLine
  | ResolvedDraftResultLine
  | UnresolvedDraftResultLine;

export interface Result<T extends AnyDraftResultLine = AnyDraftResultLine> {
  resultLine: T;
  relation: DraftResultRelation;
}

// Cache

export interface ReusableInfoDefinitions {
  reusablePromptDefinitions: ReusablePromptDefinition[];
  reusableResultDefinitions: Array<{ shortCode: string }>;
}

export interface ReusablePromptDefinition {
  promptRef: string;
  type: string;
  cacheDataPath?: string;
  cacheable: number;
}

export type CachedPromptValuesKeyedByShortcode = Record<string, CachedPromptValue[]>;

export interface PromptEntry {
  masterDefendantId?: string;
  applicationId?: string;
  cacheDataPath?: string;
  cacheable?: number;
  offenceId?: string;
  promptRef: string;
  type: ResultPromptType;
  value: unknown;
}

export interface ReusableInfo {
  reusablePrompts: PromptEntry[];
  reusableResults: ResultEntry[];
}

export interface ResultEntry {
  shortCode: string;
  masterDefendantId: string;
  offenceId: string;
  promptValues: CachedPromptValuesKeyedByShortcode;
}

export interface RemoteResultEntry {
  shortCode: string;
  masterDefendantId: string;
  offenceId: string;
  value: string;
}

export interface CachedPromptValue {
  promptRef: string;
  type: string;
  value: unknown;
}

// Parser

export interface RemoteUnresolvedParsedResult {
  orderedDate: string;
  originalText: string;
  parts: RemoteUnresolvedPart[];
}

export interface RemoteResolvedParsedResult {
  orderedDate: string;
  originalText: string;
  resultDefinitionId: string;
  label: string;
  shortCode: string;
  resultLevel: ResultDefinitionLevel;
  bailStatusCode?: BailStatusCode;
  childResultDefinitions?: ChildResultDefinition[];
  excludedFromResults: boolean;
  promptChoices: PromptChoice[];
  conditionalMandatory: boolean;
  parts: [RemoteResolvedPartForResult, ...RemoteUnresolvedPartForValue[]];
}

// Remote part representations

export type RemoteParsedResult = RemoteResolvedParsedResult | RemoteUnresolvedParsedResult;
export type RemoteUnresolvedPart = RemoteUnresolvedPartForResult | RemoteUnresolvedPartForValue;
export type RemoteResolvedPart = RemoteResolvedPartForResult | RemoteUnresolvedPartForValue;

export interface RemoteUnresolvedPartForValue {
  type: ResultPromptType;
  state: 'UNRESOLVED';
  originalText?: string;
  value: unknown;
}

export interface RemoteUnresolvedPartForResult {
  state: 'UNRESOLVED';
  resultChoices: RemoteResultChoice[];
  value: string;
}

export interface RemoteResultChoice {
  code: string;
  label: string;
  level: ResultDefinitionLevel;
  shortCode: string;
  type: 'RESULT';
}

export interface RemoteResolvedPartForResult {
  type: 'RESULT';
  state: 'RESOLVED';
  value: string;
}

// Local part representations
export interface UnresolvedPromptPart {
  type: ResultPromptType;
  originalText?: string;
  value: unknown;
  resultPrompts: DraftResultPrompt[];
}

export type UnresolvedPart = RemoteUnresolvedPart | UnresolvedPromptPart;
export type UnresolvedPartChoice = RemoteResultChoice | DraftResultPrompt;

export interface UnresolvedParsedResult extends Omit<RemoteUnresolvedParsedResult, 'parts'> {
  unresolvedParts: RemoteUnresolvedPart[];
}

export interface ResolvedParsedResult extends Omit<RemoteResolvedParsedResult, 'parts'> {
  unresolvedParts: UnresolvedPromptPart[];
  resolvedResultPrompts: DraftResultPrompt[];
}

export type ParsedResult = ResolvedParsedResult | UnresolvedParsedResult;

// Prompt choices

export interface DefaultPromptChoice {
  code: string;
  label: string;
  promptRef: string;
  promptOrder: number;
  required: boolean;
}

export type AddressPartName =
  | 'AddressLine1'
  | 'AddressLine2'
  | 'AddressLine3'
  | 'AddressLine4'
  | 'AddressLine5'
  | 'PostCode'
  | 'EmailAddress1'
  | 'EmailAddress2';

export interface AddressPromptChoice extends DefaultPromptChoice {
  type: 'ADDRESS';
  children: PromptChoiceChild<AddressPartName>[];
  required: boolean;
}

export interface BooleanPromptChoice extends DefaultPromptChoice {
  type: 'BOOLEAN';
}

export interface CourtroomPromptChoice extends DefaultPromptChoice {
  type: 'HCROOM';
}

export interface CurrencyPromptChoice extends DefaultPromptChoice {
  type: 'CURR';
  minValue?: string;
  maxValue?: string;
}

export interface DatePromptChoice extends DefaultPromptChoice {
  type: 'DATE';
  futureDate?: boolean;
}

export interface DurationPromptChoice extends DefaultPromptChoice {
  type: 'DURATION';
  durationSequence: number;
  multipleAllowed: boolean;
  children: Array<{
    label: string;
    type: 'INT' | 'INTM';
    code: string;
    promptRef: string;
    welshLabel: string;
    minValue?: string;
    maxValue?: string;
  }>;
}

export interface FixedListPromptChoice extends DefaultPromptChoice {
  type: 'FIXL';
  fixedList: string[];
}

export interface FixedListMultiplePromptChoice extends DefaultPromptChoice {
  type: 'FIXLM';
  fixedList: string[];
}

export interface FixedListOtherPromptChoice extends DefaultPromptChoice {
  type: 'FIXLO';
  fixedList: string[];
}

export interface FixedListOtherMultiplePromptChoice extends DefaultPromptChoice {
  type: 'FIXLOM';
  fixedList: string[];
}

export interface HiddenPromptChoice extends DefaultPromptChoice {
  type: 'HIDDEN';
}

export interface IntegerPromptChoice extends DefaultPromptChoice {
  type: 'INT' | 'INTC' | 'INTM';
  minValue?: string;
  maxValue?: string;
  minLength?: string;
  maxLength?: string;
}

export type NameAddressPartName =
  | AddressPartName
  | 'OrganisationName'
  | 'FirstName'
  | 'MiddleName'
  | 'LastName';

export interface NameAddressListItem<PartName extends string = string> {
  label: string;
  addressParts: Record<PartName, string>;
}

export interface NameAddressPromptChoice extends DefaultPromptChoice {
  type: 'NAMEADDRESS';
  addressType: 'Organisation' | 'Person' | 'Both';
  listLabel: string;
  nameAddressList?: NameAddressListItem[];
  children: PromptChoiceChild<NameAddressPartName>[];
  required: boolean;
}

export interface OneOfPromptChoice extends DefaultPromptChoice {
  type: 'ONEOF';
  children: PromptChoice[];
}

export interface TextPromptChoice extends DefaultPromptChoice {
  type: 'TXT';
  min?: string;
  max?: string;
  maxLength?: string;
  minLength?: string;
  partName?: string;
}

export interface TimePromptChoice extends DefaultPromptChoice {
  type: 'TIME';
}

export interface YesboxPromptChoice extends DefaultPromptChoice {
  type: 'YESBOX';
  yesBoxText?: string;
}

export type ResultPromptType = PromptChoice['type'];

export type PromptChoice =
  | AddressPromptChoice
  | BooleanPromptChoice
  | CourtroomPromptChoice
  | CurrencyPromptChoice
  | DatePromptChoice
  | DurationPromptChoice
  | IntegerPromptChoice
  | FixedListPromptChoice
  | FixedListMultiplePromptChoice
  | FixedListOtherPromptChoice
  | FixedListOtherMultiplePromptChoice
  | HiddenPromptChoice
  | NameAddressPromptChoice
  | OneOfPromptChoice
  | TextPromptChoice
  | TimePromptChoice
  | YesboxPromptChoice;

export type ResultDefinitionLevel = 'C' | 'D' | 'O';

export interface PromptChoiceChild<P = string> {
  label: string;
  code: string;
  type: PromptChoice['type'];
  promptRef: string;
  partName: P;
  sequence: number;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  maxValue?: number;
  minValue?: number;
  hint?: string;
}

export interface ChildResultDefinition {
  code: string;
  shortCode: string;
  label: string;
  ruleType: ChildResultDefinitionRuleType;
  excludedFromResults: boolean;
  childResultCodes?: string[];
  childOfTrueResponse?: boolean;
}

export type ChildResultDefinitionRuleType = 'mandatory' | 'optional' | 'oneOf' | 'atleastOneOf';

export interface DraftResultPrompt<V = unknown> {
  type: ResultPromptType;
  promptId: string;
  promptRef: string;
  label: string;
  welshLabel?: string;
  value: V;
  welshValue?: V;
}

export interface DraftResultPromptValue {
  label: string;
  value: number;
}

export interface ParseTextOptionsForApplication {
  amendmentReason?: AmendmentReason;
  amendmentDate?: string;
  applicationId: string;
  caseId?: string;
  masterDefendantId?: string;
  originalText: string;
  orderedDate: string;
}

export interface ParseTextOptionsForOffence {
  amendmentReason?: AmendmentReason;
  amendmentDate?: string;
  applicationId?: string;
  caseId: string;
  defendantId: string;
  masterDefendantId: string;
  offenceId: string;
  originalText: string;
  orderedDate: string;
}

export type ParseTextOptions = ParseTextOptionsForApplication | ParseTextOptionsForOffence;

export interface ParseChildOptions {
  belongsToResultLineId: string;
  orderedDate: string;
  shortCode: string;
}

export interface ReplaceDraftResultLineOptions {
  resultLineId: string;
  originalText: string;
  orderedDate: string;
}

export type MigrationFunction = <S, T>(draftResult: S, extras: MigrationFunctionExtras) => T;

export interface MigrationFunctionExtras {
  hearingId: string;
  hearingDay: string;
  hearing?: HearingDetail;
}

export type PromiseValue<T> = T extends PromiseLike<infer U> ? U : T;

// Shared result

export interface DelegatedPowers {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface SharedResult {
  resultLines: SharedResultLine[];
  version: number;
}

export interface ShareableResult {
  resultLines: SharedResultLine[];
  courtClerk: DelegatedPowers;
  version: number;
}

interface AbstractSharedResultLine {
  autoPopulateBooleanResult?: string;
  category?: 'A' | 'I' | 'F';
  delegatedPowers?: DelegatedPowers;
  disabled?: boolean;
  orderedDate: string;
  sharedDate: string;
  shortCode: string;
  resultLineId: string;
  resultDefinitionId: string;
  level: 'OFFENCE' | 'CASE' | 'DEFENDANT';
  resultLabel: string;
  amendmentsLog?: AmendmentsLog | string;
  amendmentReasonId?: string;
  amendmentReason?: string;
  amendmentDate?: string;
  prompts?: ShareableResultPrompt[];
  fourEyesApproval?: DelegatedPowers;
  approvedDate?: string;
  isDeleted?: boolean;
  applicationOutcome?: unknown;
  childResultLineIds?: string[];
  parentResultLineIds?: string[];
  nonStandaloneAncillaryResult?: boolean;
}

export interface ShareableResultPrompt {
  id: string;
  promptRef: string;
  label: string;
  fixedListCode?: string;
  value: string;
  welshValue?: string;
}

export type SharedResultLine = AbstractSharedResultLine &
  (
    | { applicationId: string }
    | {
        caseId: string;
        defendantId: string;
        masterDefendantId: string;
        offenceId: string;
        shadowListed: boolean;
      }
  );

// Other
export interface AbstractCopyDraftResultsTarget {
  originalResultLineId: string;
}

export type CopyDraftResultsTarget = TargetLike<AbstractCopyDraftResultsTarget>;

// Better OnChanges type

type MarkFunctionProperties<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
};
type ExcludeFunctionPropertyNames<T> = MarkFunctionProperties<T>[keyof T];
type ExcludeFunctions<T> = Pick<T, ExcludeFunctionPropertyNames<T>>;

export type NgChanges<Component, Props = ExcludeFunctions<Component>> = {
  [Key in keyof Props]: {
    previousValue: Props[Key];
    currentValue: Props[Key];
    firstChange: boolean;
    isFirstChange(): boolean;
  };
};

export class InvalidResulLinesError extends Error {
  constructor(public invalidResultLines: ResolvedDraftResultLine[], message?: string) {
    super(message || 'InvalidResulLinesError');
    this.name = 'InvalidResulLinesError';
  }
}

export interface ProsecutorTobeNotified {
  prosecutortobenotifiedOrganisationName?: string;
  prosecutortobenotifiedAddress1?: string;
  prosecutortobenotifiedAddress2?: string;
  prosecutortobenotifiedAddress3?: string;
  prosecutortobenotifiedAddress4?: string;
  prosecutortobenotifiedPostCode?: string;
  prosecutortobenotifiedEmailAddress1?: string;
  prosecutortobenotifiedEmailAddress2?: string;
}
