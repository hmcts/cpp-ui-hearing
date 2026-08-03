import produce from 'immer';
import { findIndex } from 'lodash-es';
import moment from 'moment';
import {
  DraftResultWithMetadata,
  MigrationFunction,
  MigrationFunctionExtras,
  PromiseValue
} from '../../results.interfaces';
import { getTargetId, getTargetsForHearing } from '../helpers';
import { Legacy, migrateLegacyDraftResult } from './legacy';
import { getCPPDate } from '../../../core';

const migrations = [migrateLegacyDraftResult] as MigrationFunction[];

// this interface should represent the return type of the final migration
type MigratedDraftResultType = PromiseValue<ReturnType<typeof migrateLegacyDraftResult>>;

/**
 * Migrate a draft result to the latest interface expected by the code: Over
 * time, it's expected that the structure of the draft result will change due to
 * incremental features or refactoring, and compatibility must be maintained
 * with all historical versions. Consequently, when a draft result is saved, it
 * is done so with a version to identify itself, with which we can then
 * transform to any newer version through a sequence of migrations.
 *
 * @param draftResult the draft result for migration
 * @param targetVersion the version to which to migrate the draft result
 * @param extras an object containing any useful data to be forwarded to the
 * migration functions
 * @returns the migrated draft result with metadata
 */
export const migrateDraftResultToVersion = (
  draftResult: DraftResultWithMetadata | Legacy.DraftResult,
  targetVersion: number,
  extras: MigrationFunctionExtras,
  isBoxWork: boolean,
  firstSharedDate: string
): DraftResultWithMetadata<MigratedDraftResultType> => {
  // The original legacy draft result will not contain a version, so default
  // it to 0. This will in turn force the migration mechanism to always run as
  // the minimum version is 1.
  const __metadata__ = '__metadata__' in draftResult ? draftResult.__metadata__ : { version: 0 };
  const previousVersion = __metadata__.version;

  let currentState = draftResult;

  if (previousVersion < targetVersion) {
    // Any historical draft result must be run sequentially through all
    // migrations between its version and the latest version.
    for (let i = previousVersion; i < targetVersion; i++) {
      currentState = migrations[i](draftResult, extras);
    }
  }

  let migratedState = currentState as MigratedDraftResultType;

  if (isBoxWork && __metadata__.lastSharedTime) {
    updateBoxworkOrderDate(migratedState, __metadata__.lastSharedTime, firstSharedDate);
  }

  // Evaluate if the result lines conform to any `lastSharedTime` saved to the
  // metadata: When sharing, the backend will write a `lastSharedTime` to the
  // __metadata__ property as part of an atomic operation to share the result
  // lines. When this value is present, it should be set on any result line that
  // does not yet adhere to it.
  if (__metadata__.lastSharedTime) {
    const lastSharedDate = moment(__metadata__.lastSharedTime);

    migratedState.resultLines = Object.keys(migratedState.resultLines).reduce(
      (reducedResultLines, resultLineId) => {
        const resultLine = (currentState as MigratedDraftResultType).resultLines[resultLineId];

        if (
          'resultDefinitionId' in resultLine &&
          (!resultLine.sharedDate || lastSharedDate.isAfter(resultLine.sharedDate))
        ) {
          return {
            ...reducedResultLines,
            [resultLine.resultLineId]: {
              ...resultLine,
              sharedDate: __metadata__.lastSharedTime
            }
          };
        }
        return reducedResultLines;
      },
      migratedState.resultLines
    );
  }

  // Handle an issue where targets belonging to another hearing were/are being
  // saved to the wrong hearing. Hence, we validate the targets on the incoming
  // draft result belong to the hearing, and strip them if they do not.
  // https://tools.hmcts.net/jira/browse/DD-16613
  if (extras.hearing) {
    const targets = getTargetsForHearing(extras.hearing);

    migratedState = produce(migratedState, nextState => {
      const purgeResult = (resultLineId: string) => {
        const idx = findIndex(nextState.relations, { resultLineId });

        for (const childResultLineId of nextState.relations[idx].childResultLineIds) {
          purgeResult(childResultLineId);
        }
        delete nextState.resultLines[resultLineId];
        nextState.relations.splice(idx, 1);
      };

      for (const relation of nextState.relations) {
        if (relation.ruleType === 'standalone' || relation.ruleType === 'unknown') {
          const resultLine = nextState.resultLines[relation.resultLineId];
          const targetId = getTargetId(resultLine);

          if (!targets.find(target => target.id === targetId)) {
            purgeResult(resultLine.resultLineId);
          }
        }
      }
    });
  }

  // Once all migrations are complete, we can identify this draft result as
  // being migrated to the current version, and hence compatible with the
  // codebase.
  return {
    ...migratedState,
    __metadata__: {
      ...__metadata__,
      version: targetVersion
    }
  } as DraftResultWithMetadata<MigratedDraftResultType>;
};

const updateBoxworkOrderDate = (
  migratedState: MigratedDraftResultType,
  lastSharedTime: string,
  firstSharedDate: string
): void => {
  const cppDate = getCPPDate();
  const orderedDate = firstSharedDate
    ? cppDate.format(firstSharedDate, cppDate.US_DATE_FORMAT)
    : cppDate.format(lastSharedTime, cppDate.US_DATE_FORMAT);

  migratedState.resultLines = Object.keys(migratedState.resultLines).reduce(
    (reducedResultLines, resultLineId) => {
      const resultLine = migratedState.resultLines[resultLineId];

      if ('resultDefinitionId' in resultLine && !resultLine.sharedDate) {
        return {
          ...reducedResultLines,
          [resultLine.resultLineId]: {
            ...resultLine,
            orderedDate
          }
        };
      }
      return reducedResultLines;
    },
    migratedState.resultLines
  );
};
