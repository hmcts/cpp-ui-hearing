/**
 * This file is dedicated to transforming the hearing into the structure
 * expected by the 'Enter results' and 'Copy results' pages to avoid complexity
 * in the components. That is to say we create a hierarchy of:
 *
 * - MasterDefendant D1
 *   - Case C1
 *     - Offence O1
 *     - Offence O2
 *     - Linked Application A1
 *   - Case C2
 *   - Standalone Application A2
 * - MasterDefendant D2
 *   - Case C1
 *     - Offence 03
 *     - Linked Application A3
 *
 * Note that, where an offence exists on both on application and a defendant,
 * it's annotated with the applicationId property.
 */
import { LinkType } from '@cpp/reference-data';
import { cloneDeep, find, sortBy } from 'lodash-es';
import memoizeOne from 'memoize-one';
import {
  CourtApplication,
  CourtApplicationParty,
  Defendant,
  HearingDetail,
  Offence,
  omitUndefined,
  ProsecutionCaseIdentifier,
  sortDefendants,
  sortOffences
} from '../../../core';
import { AnyDraftResultLine, TargetLike } from '../../results.interfaces';

// A target is either an application or offence against which a result will be recorded
export type Target = CourtApplication | Offence;
export type TargetSubject = Defendant | CourtApplicationParty;

export interface ApplicationItem {
  application: CourtApplication;
  applicationId: string;
  caseId?: string;
  masterDefendantId?: string;
}

export interface OffenceItem {
  applicationId?: string;
  caseId: string;
  defendantId: string;
  masterDefendantId: string;
  offenceId: string;
  offence: Offence;
  bulkDefendant?: boolean;
}

export interface TargetGroup {
  applicationItems: ApplicationItem[];
  offenceItems: OffenceItem[];
  prosecutionCase?: {
    id: string;
    prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
    isCourtOrderOffence?: boolean;
  };
}

export interface TargetsGroupedBySubject<T extends TargetSubject = TargetSubject> {
  subject: T;
  targetGroups: TargetGroup[];
}

export const getTargetId = (resultLine: AnyDraftResultLine): string => {
  return 'offenceId' in resultLine ? resultLine.offenceId : resultLine.applicationId;
};

export function getForeignKeysForTarget(options: any): TargetLike {
  if ('offenceId' in options) {
    const { applicationId, masterDefendantId, caseId, defendantId, offenceId } = options;

    return omitUndefined({ applicationId, masterDefendantId, caseId, defendantId, offenceId });
  }
  return omitUndefined({
    applicationId: options.applicationId,
    caseId: options.caseId,
    masterDefendantId: options.masterDefendantId
  });
}

// Obtain a flattened list of targets for a hearing

export const getTargetsForHearing = memoizeOne((hearing: HearingDetail): Target[] => {
  const targetsGroupedBySubject = getTargetsHierarchy(hearing);
  let targets: Target[] = [];

  for (const { targetGroups } of targetsGroupedBySubject) {
    for (const item of targetGroups) {
      targets = [
        ...targets,
        ...item.applicationItems.map(applicationItem => applicationItem.application),
        ...item.offenceItems.map(offenceItem => offenceItem.offence)
      ];
    }
  }
  return targets;
});

// Create a hierarchy of the targets for rendering in the 'Enter results' page

export const getTargetsHierarchy = memoizeOne(
  (hearingDetail: HearingDetail): TargetsGroupedBySubject[] => {
    const { prosecutionCases = [], courtApplications = [] } = cloneDeep(hearingDetail);
    let targetGroupsForSubjects: TargetsGroupedBySubject[] = [];

    // 1. Offences
    // Group the targets by defendant by extracting offences from the prosecution cases
    const bulkCase = prosecutionCases.find(kase => kase.isGroupMaster);

    for (const prosecutionCase of prosecutionCases) {
      prosecutionCase.defendants = sortDefendants(prosecutionCase.defendants);

      for (const defendant of prosecutionCase.defendants) {
        const targetGroup = createOrGetTargetGroupForSubject(defendant, prosecutionCase);
        defendant.offences = sortOffences(defendant.offences, hearingDetail.jurisdictionType);

        for (const offence of defendant.offences) {
          targetGroup.offenceItems.push({
            caseId: prosecutionCase.id,
            defendantId: defendant.id,
            masterDefendantId: defendant.masterDefendantId,
            bulkDefendant: bulkCase
              ? bulkCase.defendants.some(({ id }) => id === defendant.id)
              : false,
            offence,
            offenceId: offence.id
          });
        }
      }
    }

    // Sort defendants into a deterministic order based on courtProceedingsInitiated

    targetGroupsForSubjects = sortBy(
      targetGroupsForSubjects,
      ({ targetGroups }) => !targetGroups[0]?.offenceItems[0]?.bulkDefendant
    );

    // Sort defendants into a deterministic order based on courtProceedingsInitiated

    targetGroupsForSubjects = sortBy(targetGroupsForSubjects, ({ subject }) =>
      new Date((subject as Defendant).courtProceedingsInitiated).getTime()
    );

    // 2. Applications
    // Evaluate any applications on the hearing – these may be linked or standalone

    for (const application of courtApplications) {
      let targetGroup: TargetGroup;

      if (application.type.linkType !== LinkType.FIRST_HEARING) {
        if (application.courtOrder) {
          for (const courtOrderOffence of application.courtOrder.courtOrderOffences) {
            const prosecutionCase = {
              id: courtOrderOffence.prosecutionCaseId,
              prosecutionCaseIdentifier: courtOrderOffence.prosecutionCaseIdentifier,
              isCourtOrderOffence: true
            };

            targetGroup = createOrGetTargetGroupForSubject(
              application.subject,
              prosecutionCase,
              application
            );

            const offenceItem = find(targetGroup.offenceItems, {
              offenceId: courtOrderOffence.offence.id
            });

            let applicationItem = targetGroup.applicationItems.find(
              ({ applicationId }) => applicationId === application.id
            );

            if (!applicationItem) {
              applicationItem = { applicationId: application.id, application };
              targetGroup.applicationItems.push(applicationItem);
            }

            if (offenceItem) {
              // In offence has already been introduced via a defendant, patch
              // it with the `applicationId`
              offenceItem.applicationId = application.id;
            } else {
              const { masterDefendantId, defendantCase = [] } = application.subject.masterDefendant;
              const defendantCase_ = defendantCase.find(
                _defendantCase_ => _defendantCase_.caseId === courtOrderOffence.prosecutionCaseId
              );

              applicationItem.caseId = courtOrderOffence.prosecutionCaseId;
              applicationItem.masterDefendantId = masterDefendantId;
              targetGroup.offenceItems.push({
                applicationId: application.id,
                caseId: courtOrderOffence.prosecutionCaseId,
                defendantId: defendantCase_ ? defendantCase_.defendantId : masterDefendantId,
                masterDefendantId,
                offence: courtOrderOffence.offence,
                offenceId: courtOrderOffence.offence.id
              });
            }
          }
        }

        if (application.courtApplicationCases) {
          for (const courtApplicationCase of application.courtApplicationCases) {
            const { offences = [] } = courtApplicationCase;

            for (const offence of offences) {
              const prosecutionCase = {
                id: courtApplicationCase.prosecutionCaseId,
                prosecutionCaseIdentifier: courtApplicationCase.prosecutionCaseIdentifier
              };

              targetGroup = createOrGetTargetGroupForSubject(
                application.subject,
                prosecutionCase,
                application
              );

              const offenceItem = targetGroup.offenceItems.find(
                offenceItem_ => offenceItem_.offence.id === offence.id
              );

              let applicationItem = targetGroup.applicationItems.find(
                ({ applicationId }) => applicationId === application.id
              );

              if (!applicationItem) {
                applicationItem = { applicationId: application.id, application };
                targetGroup.applicationItems.push(applicationItem);
              }

              if (offenceItem) {
                offenceItem.applicationId = application.id;
              } else {
                const { masterDefendantId, defendantCase = [] } =
                  application.subject.masterDefendant;

                const defendantCase_ = defendantCase.find(
                  _defendantCase_ =>
                    _defendantCase_.caseId === courtApplicationCase.prosecutionCaseId
                );

                applicationItem.caseId = courtApplicationCase.prosecutionCaseId;
                applicationItem.masterDefendantId = masterDefendantId;
                targetGroup.offenceItems.push({
                  applicationId: application.id,
                  caseId: courtApplicationCase.prosecutionCaseId,
                  defendantId: defendantCase_ ? defendantCase_.defendantId : masterDefendantId,
                  masterDefendantId,
                  offence,
                  offenceId: offence.id
                });
              }
            }
          }
        }
      }

      // If no target group has been assigned by this point via court order or
      // cases, add this application independently.

      if (!targetGroup) {
        targetGroup = createOrGetTargetGroupForSubject(application.subject);

        const applicationItem: ApplicationItem = {
          applicationId: application.id,
          application
        };
        targetGroup.applicationItems.push(applicationItem);

        // A linked application will contain a masterDefendant, in which case we
        // should extract the caseId and masterDefendantId  and decorate the
        // application item so that results added to this application obey
        // grouping rules
        if ('masterDefendant' in application.subject) {
          applicationItem.masterDefendantId = application.subject.masterDefendant.masterDefendantId;
          if (
            application.subject.masterDefendant.defendantCase &&
            application.subject.masterDefendant.defendantCase[0]
          ) {
            applicationItem.caseId = application.subject.masterDefendant.defendantCase[0].caseId;
          }
        }
      }
    }

    return targetGroupsForSubjects;

    function createOrGetTargetGroupForSubject(
      subject: TargetSubject,
      prosecutionCase?: {
        id: string;
        prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
        isCourtOrderOffence?: boolean;
      },
      courtApplication?: CourtApplication
    ): TargetGroup {
      let targetGroupsForSubject = targetGroupsForSubjects.find(
        targetGroup => getSubjectId(targetGroup.subject) === getSubjectId(subject)
      );

      if (!targetGroupsForSubject) {
        targetGroupsForSubject = {
          subject,
          targetGroups: []
        };
        targetGroupsForSubjects.push(targetGroupsForSubject);
      }

      let existingTargetGroup: TargetGroup;

      if (prosecutionCase) {
        existingTargetGroup = targetGroupsForSubject.targetGroups.find(
          targetGroup =>
            targetGroup.prosecutionCase && targetGroup.prosecutionCase.id === prosecutionCase.id
        );
      }

      // Check if court application target already exists
      if (courtApplication && !!!existingTargetGroup) {
        existingTargetGroup = targetGroupsForSubject.targetGroups.find(targetGroup =>
          targetGroup.applicationItems.find(
            a => !!a.application && a.application.id === courtApplication.id
          )
        );
      }

      if (!existingTargetGroup) {
        existingTargetGroup = {
          applicationItems: [],
          offenceItems: [],
          prosecutionCase
        };
        targetGroupsForSubject.targetGroups.push(existingTargetGroup);
      }
      return existingTargetGroup;
    }
  }
);

export const getSubjectId = (subject: TargetSubject) => {
  if ('masterDefendantId' in subject) {
    return subject.masterDefendantId;
  }
  if ('masterDefendant' in subject) {
    return subject.masterDefendant.masterDefendantId;
  }
  if ('prosecutingAuthority' in subject) {
    return subject.prosecutingAuthority.prosecutionAuthorityId;
  }
  if ('organisation' in subject) {
    return subject.organisation.id;
  }

  return undefined;
};
