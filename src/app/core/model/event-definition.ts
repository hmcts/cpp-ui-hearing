import { AutosuggestSection } from '@cpp/pdk';

export interface EventDefinition {
  id: string;
  actionLabel: string;
  groupLabel: string;
  alterable: boolean;
  recordedLabel: string;
  caseAttributes: string[];
  actionSequence: number;
  groupSequence: number;
  value?: string;
  label?: string;
}

export interface CustomAutosuggestSection<T> extends AutosuggestSection {
  first?: boolean;
}
