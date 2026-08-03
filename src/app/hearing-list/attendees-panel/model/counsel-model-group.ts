import { AutoSuggestOption } from '../../../core/model/autosuggest-option';
import {
  DefenceCounsel,
  CompanyRepresentative,
  ProsecutionCounsel,
  IntermediaryCounsel
} from '../../../core';

type PropIdAutoSuggest = AutoSuggestOption | AutoSuggestOption[];
type PropIdAutoString = Array<string> | string;

export interface CounselModelGroup {
  [id: string]: {
    firstNameSuggestions: AutoSuggestOption[];
    lastNameSuggestions: AutoSuggestOption[];
    [uniqPropToId: string]: PropIdAutoSuggest | PropIdAutoString;
  };
}

export const counselPrefix = {
  first_name: 'firstName-',
  last_Name: 'lastName-',
  defendantId: 'defendantId-'
};

export type counselEntities =
  | DefenceCounsel
  | CompanyRepresentative
  | ProsecutionCounsel
  | IntermediaryCounsel;
