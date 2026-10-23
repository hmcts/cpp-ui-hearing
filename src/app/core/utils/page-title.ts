import { HearingPersonDetails } from '../model/hearing-person-details';

export type PageTitleName = Partial<Pick<HearingPersonDetails, 'firstName' | 'lastName'>>;

export const COMMON_PLATFORM_TITLE_SUFFIX = 'Common Platform | GOV.UK';

// hearing route titles end in "| Common Platform | GOV.UK", some without the "| GOV.UK" part
const TITLE_SUFFIX_PATTERN = /\s*\|\s*common platform(\s*\|\s*gov\.uk)?\s*$/i;

// People become "Surname I". Organisations only have a firstName, so they are used as-is.
export const formatNameForTitle = (name?: PageTitleName): string => {
  const firstName = (name?.firstName || '').trim();
  const lastName = (name?.lastName || '').trim();
  const initial = firstName.charAt(0).toUpperCase();

  if (lastName) {
    return initial ? `${lastName} ${initial}` : lastName;
  }

  return firstName;
};

// Only the lead name goes in the tab, otherwise it gets too long
export const formatDefendantNamesForTitle = (names: PageTitleName[] = []): string =>
  formatNameForTitle((names || [])[0]);

// "<defendantName> - <pageTitle> | Common Platform | GOV.UK", only adding the suffix once
export const buildPageTitle = (pageTitle: string, defendantName = ''): string => {
  const title = (pageTitle || '').replace(TITLE_SUFFIX_PATTERN, '').trim();
  const prefix = defendantName ? `${defendantName} - ` : '';

  return title
    ? `${prefix}${title} | ${COMMON_PLATFORM_TITLE_SUFFIX}`
    : `${prefix}${COMMON_PLATFORM_TITLE_SUFFIX}`;
};
