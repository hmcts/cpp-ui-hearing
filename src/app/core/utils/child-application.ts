import { flatMap } from 'lodash-es';
import { OffenceActiveOrderType } from '@cpp/reference-data';
import { CourtApplication } from '../model/court-application';

const hasCases = (courtApplication: CourtApplication): boolean =>
  (courtApplication.courtApplicationCases || []).length > 0 || !!courtApplication.courtOrder;

/**
 * Whether a child application can be added to the given (parent) application.
 * Permission ("Link Create Child Application") is checked separately by the caller.
 * Kept in line with the equivalent helper in cpp-ui-prosecution-casefile.
 *
 * - child applications cannot have children (no grandchildren)
 * - standalone applications (no cases) can have children
 * - case-linked applications can have children only when every offence on the
 *   application was inactive when the application was created, or the offences
 *   come from an active order (breach applications)
 */
export const canHaveChildApplication = (courtApplication: CourtApplication): boolean => {
  if (!courtApplication || courtApplication.parentApplicationId) {
    return false;
  }

  if (!hasCases(courtApplication)) {
    return true;
  }

  if (courtApplication.type?.offenceActiveOrder === OffenceActiveOrderType.NOT_APPLICABLE) {
    return false;
  }

  const caseOffences = flatMap(
    courtApplication.courtApplicationCases || [],
    applicationCase => applicationCase.offences || []
  );
  const orderOffences = courtApplication.courtOrder?.courtOrderOffences || [];

  if (caseOffences.length === 0 && orderOffences.length === 0) {
    return false;
  }

  return caseOffences.every(offence => offence.proceedingsConcluded === true);
};

/**
 * A case-linked application whose offences are inactive, i.e. an eligible parent
 * for a child application from the Manage Hearings 'Case Links' tab.
 * Standalone applications are excluded - AAAG is their only child entry point.
 */
export const isApplicationOnInactiveOffences = (courtApplication: CourtApplication): boolean =>
  hasCases(courtApplication) && canHaveChildApplication(courtApplication);

export const isStandaloneCourtApplication = (courtApplication: CourtApplication): boolean =>
  !hasCases(courtApplication);

export const getCaseIdFromApplication = (courtApplication: CourtApplication): string | null =>
  courtApplication?.courtApplicationCases?.[0]?.prosecutionCaseId ??
  courtApplication?.courtOrder?.courtOrderOffences?.[0]?.prosecutionCaseId ??
  null;
