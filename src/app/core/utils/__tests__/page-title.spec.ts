import { buildPageTitle, formatDefendantNamesForTitle, formatNameForTitle } from '../page-title';

describe('page-title utils', () => {
  describe('formatNameForTitle', () => {
    it('should format a person as surname followed by the upper-cased initial', () => {
      expect(formatNameForTitle({ firstName: 'john', lastName: 'Smith' })).toBe('Smith J');
    });

    it('should use only the surname when there is no first name', () => {
      expect(formatNameForTitle({ firstName: '', lastName: 'Smith' })).toBe('Smith');
    });

    it('should use the first name as-is when there is no surname (organisations)', () => {
      expect(formatNameForTitle({ firstName: 'Acme Ltd', lastName: '' })).toBe('Acme Ltd');
    });

    it('should trim surrounding whitespace', () => {
      expect(formatNameForTitle({ firstName: ' john ', lastName: ' Smith ' })).toBe('Smith J');
    });

    it('should return an empty string for a missing name', () => {
      expect(formatNameForTitle(undefined)).toBe('');
      expect(formatNameForTitle({ firstName: '', lastName: '' })).toBe('');
    });
  });

  describe('formatDefendantNamesForTitle', () => {
    it('should use the lead (first) name only', () => {
      expect(
        formatDefendantNamesForTitle([
          { firstName: 'George', lastName: 'Washington' },
          { firstName: 'Harold', lastName: 'Winston' }
        ])
      ).toBe('Washington G');
    });

    it('should return an empty string when there are no names', () => {
      expect(formatDefendantNamesForTitle([])).toBe('');
      expect(formatDefendantNamesForTitle(undefined)).toBe('');
      expect(formatDefendantNamesForTitle(null)).toBe('');
    });
  });

  describe('buildPageTitle', () => {
    it('should prefix the page title with the defendant name and append the suffix', () => {
      expect(buildPageTitle('Manage hearing', 'Smith J')).toBe(
        'Smith J - Manage hearing | Common Platform | GOV.UK'
      );
    });

    it('should omit the prefix when there is no defendant name', () => {
      expect(buildPageTitle('Manage hearing')).toBe('Manage hearing | Common Platform | GOV.UK');
      expect(buildPageTitle('Manage hearing', '')).toBe(
        'Manage hearing | Common Platform | GOV.UK'
      );
    });

    it('should not duplicate the suffix when the page title already has it', () => {
      expect(buildPageTitle('Manage hearing | Common Platform | GOV.UK', 'Smith J')).toBe(
        'Smith J - Manage hearing | Common Platform | GOV.UK'
      );
    });

    it('should complete a page title that only ends in Common Platform', () => {
      expect(buildPageTitle('Technical error | Common Platform')).toBe(
        'Technical error | Common Platform | GOV.UK'
      );
    });

    it('should normalise a differently cased suffix', () => {
      expect(buildPageTitle('Remove future hearing | Common platform | GOV.UK')).toBe(
        'Remove future hearing | Common Platform | GOV.UK'
      );
    });

    it('should fall back to the suffix alone when there is no page title', () => {
      expect(buildPageTitle('')).toBe('Common Platform | GOV.UK');
      expect(buildPageTitle(undefined, 'Smith J')).toBe('Smith J - Common Platform | GOV.UK');
    });
  });
});
