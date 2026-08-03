import {
  AddressPromptChoice,
  BooleanPromptChoice,
  CurrencyPromptChoice,
  DatePromptChoice,
  DurationPromptChoice,
  FixedListMultiplePromptChoice,
  FixedListOtherMultiplePromptChoice,
  FixedListOtherPromptChoice,
  FixedListPromptChoice,
  IntegerPromptChoice,
  NameAddressPromptChoice,
  OneOfPromptChoice,
  PromptChoice,
  RemoteResolvedParsedResult,
  TextPromptChoice,
  TimePromptChoice
} from '../../../results.interfaces';
import resultDefinitions from './schemas/parsed-result-definitions.json';

export const getParsedResultDefinitionByShortCode = (
  shortCode: string
): RemoteResolvedParsedResult => {
  const resource = (resultDefinitions as any[]).find(resultDefinition =>
    [shortCode, shortCode.toLowerCase(), shortCode.toUpperCase()].includes(
      resultDefinition.shortCode
    )
  );

  if (resource) {
    return resource as unknown as RemoteResolvedParsedResult;
  }
  throw new Error(
    `No matching ParsedResultDefinition for ${shortCode} found. Please check that your environment has been primed and that the platform resources have been synchronized.`
  );
};

export function getPromptChoiceForType(type: AddressPromptChoice['type']): AddressPromptChoice;
export function getPromptChoiceForType(type: BooleanPromptChoice['type']): BooleanPromptChoice;
export function getPromptChoiceForType(type: CurrencyPromptChoice['type']): CurrencyPromptChoice;
export function getPromptChoiceForType(type: DatePromptChoice['type']): DatePromptChoice;
export function getPromptChoiceForType(type: DurationPromptChoice['type']): DurationPromptChoice;
export function getPromptChoiceForType(type: FixedListPromptChoice['type']): FixedListPromptChoice;
export function getPromptChoiceForType(
  type: FixedListMultiplePromptChoice['type']
): FixedListMultiplePromptChoice;
export function getPromptChoiceForType(
  type: FixedListOtherPromptChoice['type']
): FixedListOtherPromptChoice;
export function getPromptChoiceForType(
  type: FixedListOtherMultiplePromptChoice['type']
): FixedListOtherMultiplePromptChoice;
export function getPromptChoiceForType(type: IntegerPromptChoice['type']): IntegerPromptChoice;
export function getPromptChoiceForType(
  type: NameAddressPromptChoice['type']
): NameAddressPromptChoice;
export function getPromptChoiceForType(type: OneOfPromptChoice['type']): OneOfPromptChoice;
export function getPromptChoiceForType(type: TextPromptChoice['type']): TextPromptChoice;
export function getPromptChoiceForType(type: TimePromptChoice['type']): TimePromptChoice;
export function getPromptChoiceForType(type: PromptChoice['type']): PromptChoice {
  for (const resultDefinition of resultDefinitions) {
    for (const promptChoice of resultDefinition.promptChoices) {
      if (promptChoice.type === type) {
        return promptChoice as PromptChoice;
      }
    }
  }
  return undefined;
}
