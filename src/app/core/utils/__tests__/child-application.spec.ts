import { OffenceActiveOrderType } from '@cpp/reference-data';
import { CourtApplication } from '../../model/court-application';
import {
  canHaveChildApplication,
  getCaseIdFromApplication,
  isApplicationOnInactiveOffences,
  isStandaloneCourtApplication
} from '../child-application';

const withOffences = (...proceedingsConcluded: boolean[]): CourtApplication =>
  ({
    id: 'app1',
    courtApplicationCases: [
      {
        prosecutionCaseId: 'case1',
        offences: proceedingsConcluded.map((concluded, i) => ({
          id: `o${i}`,
          proceedingsConcluded: concluded
        }))
      }
    ]
  } as CourtApplication);

describe('child-application utils', () => {
  describe('canHaveChildApplication', () => {
    it('is false for a missing application', () => {
      expect(canHaveChildApplication(undefined)).toBe(false);
    });

    it('is false for a child application', () => {
      expect(
        canHaveChildApplication({ ...withOffences(true), parentApplicationId: 'parent1' })
      ).toBe(false);
    });

    it('is true for a standalone application', () => {
      expect(canHaveChildApplication({ id: 'app1' } as CourtApplication)).toBe(true);
    });

    it('is true when every application offence is inactive', () => {
      expect(canHaveChildApplication(withOffences(true, true))).toBe(true);
    });

    it('is false when any application offence is active', () => {
      expect(canHaveChildApplication(withOffences(true, false))).toBe(false);
    });

    it('is false for a case application without offences', () => {
      expect(canHaveChildApplication(withOffences())).toBe(false);
    });

    it('is false when the application type has no offences (NOT_APPLICABLE)', () => {
      expect(
        canHaveChildApplication({
          ...withOffences(true),
          type: { offenceActiveOrder: OffenceActiveOrderType.NOT_APPLICABLE }
        } as CourtApplication)
      ).toBe(false);
    });

    it('is true for a breach application on an active order', () => {
      expect(
        canHaveChildApplication({
          id: 'app1',
          courtOrder: { courtOrderOffences: [{ prosecutionCaseId: 'case1' }] }
        } as CourtApplication)
      ).toBe(true);
    });
  });

  describe('isApplicationOnInactiveOffences', () => {
    it('excludes standalone applications', () => {
      expect(isApplicationOnInactiveOffences({ id: 'app1' } as CourtApplication)).toBe(false);
    });

    it('includes case applications on inactive offences', () => {
      expect(isApplicationOnInactiveOffences(withOffences(true))).toBe(true);
    });
  });

  describe('isStandaloneCourtApplication', () => {
    it('is true without cases or court order', () => {
      expect(isStandaloneCourtApplication({ id: 'app1' } as CourtApplication)).toBe(true);
    });

    it('is false with cases', () => {
      expect(isStandaloneCourtApplication(withOffences(true))).toBe(false);
    });
  });

  describe('getCaseIdFromApplication', () => {
    it('reads the case id from the application cases', () => {
      expect(getCaseIdFromApplication(withOffences(true))).toBe('case1');
    });

    it('falls back to the court order offences', () => {
      expect(
        getCaseIdFromApplication({
          id: 'app1',
          courtOrder: { courtOrderOffences: [{ prosecutionCaseId: 'case9' }] }
        } as CourtApplication)
      ).toBe('case9');
    });

    it('returns null without cases', () => {
      expect(getCaseIdFromApplication({ id: 'app1' } as CourtApplication)).toBeNull();
    });
  });
});
