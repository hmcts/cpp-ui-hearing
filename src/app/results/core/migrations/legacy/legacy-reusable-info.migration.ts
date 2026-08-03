import { Legacy, V1 } from './legacy.interfaces';

export const migrateLegacyReusableInfoRequest = ({
  reusablePrompts,
  reusableResults
}: V1.ReusableInfo): Legacy.ReusableInfo => {
  return {
    reusablePrompts,
    reusableResults: reusableResults.map(({ promptValues, ...other }) => ({
      ...other,
      value: JSON.stringify(promptValues)
    }))
  };
};

export const migrateLegacyReusableInfoResponse = ({
  reusablePrompts,
  reusableResults
}: Legacy.ReusableInfo): V1.ReusableInfo => {
  const mapResultLineToCachedPromptValues = ({
    originalText,
    choices = [],
    childResultLines = []
  }: Legacy.DraftResultLine): Record<string, V1.CachedPromptValue[]> => {
    const shortCode = originalText.split(' ')[0];
    const promptValues = choices
      .filter(choice => choice.value !== undefined)
      .map(({ promptRef, type, value }) => ({ promptRef, type, value }));

    return childResultLines.reduce(
      (keyedPromptValues, childResultLine) => ({
        ...keyedPromptValues,
        ...mapResultLineToCachedPromptValues(childResultLine)
      }),
      { [shortCode]: promptValues }
    );
  };

  return {
    reusablePrompts,
    reusableResults: reusableResults.map(reusableResult => {
      const { value, ...other } = reusableResult;
      const obj = JSON.parse(value);

      return {
        ...other,
        promptValues: 'resultLineId' in obj ? mapResultLineToCachedPromptValues(obj) : obj
      };
    })
  };
};
