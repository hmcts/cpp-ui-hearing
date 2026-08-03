import { formatDate } from '@angular/common';
import { ValidationErrors } from '@angular/forms';
import { getCPPDate } from '../../../core/utils/cpp-date';
import { DatePromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isDatePromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is DatePromptChoice => {
  return promptChoice.type === 'DATE';
};

export const formatDateValue = (value: string): string => {
  return formatDate(String(value), 'dd MMM yyyy', 'en-GB');
};

export const validateDateValue = (value: unknown): ValidationErrors | null => {
  if (
    typeof value === 'string' &&
    /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(value)
  ) {
    return null;
  }
  return { dateFormat: true };
};

export const validateFutureDateValue = (
  value: unknown,
  hearingDay?: string
): ValidationErrors | null => {
  if (typeof value !== 'string') {
    return { pastDate: true };
  }
  const cppDate = getCPPDate();
  // Compare against the hearing day so validity does not drift with the wall
  // clock. Falls back to the current date defensively; hearingDay is always
  // present in practice.
  const reference = hearingDay ?? cppDate.getCurrentDate();
  if (cppDate.isAfter(value, reference, cppDate.DAY)) {
    return null;
  }
  return { pastDate: true };
};
