import { TestBed } from '@angular/core/testing';
import produce from 'immer';
import { pick } from 'lodash-es';
import { Server } from 'miragejs';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState, AmendmentReason, omitUndefined } from '../../../../core';
import {
  AnyDraftResultLine,
  CopyDraftResultsTarget,
  DraftResult,
  DraftResultPrompt,
  ParseChildOptions,
  ParseTextOptions,
  ReplaceDraftResultLineOptions,
  ResolvedDraftResultLine,
  UnresolvedPartChoice,
} from '../../../results.interfaces';
import { isExtendedResolvedDraftResultLine, isResolvedDraftResultLine } from '../../helpers';
import { DraftResultBuilderService } from '../../services/draft-result-builder.service';
import { NotepadParserService } from '../../services/notepad-parser.service';
import { createDraftResult, createDraftResultPromptsForShortcode } from '../factory';
import { createMockServer } from '../server';
import { UserDetails } from '@cpp/users-groups';

let uuid: number;

jest.mock('uuid', () => ({ v4: jest.fn(() => `UUID:${uuid++}`) }));

export class DraftResultBuilder {
  private static server: Server;

  draftResult = createDraftResult();
  draftResultBuilder: DraftResultBuilderService;
  userDetails: UserDetails = {
    userId: 'userId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: '1@1.com',
    prosecutingAuthorityAccess: 'prosecutingAuthorityAccess',
  };

  constructor(draftResultBuilder?: DraftResultBuilderService) {
    uuid = 1;

    if (!draftResultBuilder) {
      draftResultBuilder = new DraftResultBuilderService(
        {
          getValuesForResultLine: () => of([]),
          getValuesForHierarchy: () => of({}),
        } as any,
        TestBed.inject(NotepadParserService),
        {
          transform: () => 'FirstName Lastname',
        },
        TestBed.inject<Store<AppState>>(Store)
      );
    }
    if (!DraftResultBuilder.server) {
      DraftResultBuilder.server = createMockServer();
    }
    this.draftResultBuilder = draftResultBuilder;
  }

  get snapshot(): DraftResult {
    return produce(this.draftResult, ({ resultLines }) => {
      for (const resultLineId in resultLines) {
        if (Object.prototype.hasOwnProperty.call(resultLines, resultLineId)) {
          const resultLine = resultLines[resultLineId];

          if (isExtendedResolvedDraftResultLine(resultLine)) {
            delete resultLine.childResultDefinitions;
            delete resultLine.promptChoices;
            delete resultLine.conditionalMandatory;
            delete resultLine.excludedFromResults;
          }
        }
      }
    });
  }

  get structure() {
    const { relations, resultLines } = this.draftResult;

    return {
      relations,
      resultLines: Object.keys(resultLines).reduce(
        (resultLinesLite, resultLineId) => ({
          ...resultLinesLite,
          [resultLineId]: omitUndefined(
            pick(
              resultLines[resultLineId],
              'applicationId',
              'caseId',
              'masterDefendantId',
              'defendantId',
              'offenceId',
              'originalText'
            )
          ),
        }),
        {}
      ),
    };
  }

  addChild = async (childOptions: ParseChildOptions) => {
    this.draftResult = await this.draftResultBuilder
      .addChildResultDefinition(this.draftResult, this.userDetails, childOptions)
      .toPromise();
  };

  addResultPromptsFor = (resultLineId: string): DraftResultPrompt[] => {
    let resultPrompts: DraftResultPrompt[] = [];

    this.draftResult = produce(this.draftResult, ({ resultLines }) => {
      const resultLine = resultLines[resultLineId];

      if (isResolvedDraftResultLine(resultLine)) {
        resultPrompts = createDraftResultPromptsForShortcode(resultLine.shortCode);
        resultLine.resultPrompts = resultPrompts;
      }
    });
    return resultPrompts;
  };

  copyResultLines = async (copyTargets: CopyDraftResultsTarget[]) => {
    this.draftResult = await this.draftResultBuilder
      .copyResultLines(this.draftResult, this.userDetails, copyTargets)
      .toPromise();
  };

  destroyPart = async (destroyPartOptions: { resultLineId: string; partIndex: number }) => {
    this.draftResult = await this.draftResultBuilder
      .destroyPart(this.draftResult, this.userDetails, destroyPartOptions)
      .toPromise();
  };

  getResultLineById = <T extends AnyDraftResultLine>(resultLineId: string): T => {
    return this.draftResult.resultLines[resultLineId] as T;
  };

  destroyResultLine = async (resultLineId: string) => {
    this.draftResult = await this.draftResultBuilder
      .destroyResultLine(this.draftResult, this.userDetails, resultLineId)
      .toPromise();
  };

  parseTextOptions = async (...items: ParseTextOptions[]) => {
    this.draftResult = await this.draftResultBuilder
      .parseResultDefinitions(this.draftResult, this.userDetails, items)
      .toPromise();
  };

  replaceResultLine = async (options: ReplaceDraftResultLineOptions) => {
    this.draftResult = await this.draftResultBuilder
      .replaceResultLine(this.draftResult, this.userDetails, options)
      .toPromise();
  };

  resolvePart = async (options: {
    resultLineId: string;
    partIndex: number;
    choice: UnresolvedPartChoice;
  }) => {
    this.draftResult = await this.draftResultBuilder
      .resolvePart(this.draftResult, this.userDetails, options)
      .toPromise();
  };

  setAmendmentReason = (options: {
    amendmentReason: AmendmentReason;
    resultLineId: string;
    amendmentDate: string;
    userDetails: UserDetails;
  }) => {
    this.draftResult = this.draftResultBuilder.setAmendmentReason(this.draftResult, options);

    return Promise.resolve(this.draftResult);
  };

  setAmendmentReasonForAllResultLines = (
    amendmentReason: AmendmentReason,
    amendmentDate = '2020-01-02'
  ) => {
    this.draftResult = produce(this.draftResult, ({ resultLines }) => {
      Object.keys(resultLines).forEach((resultLineId) => {
        const resultLine = resultLines[resultLineId];

        if (isResolvedDraftResultLine(resultLine)) {
          resultLine.amendmentReason = amendmentReason;
          resultLine.amendmentDate = amendmentDate;
        }
      });
    });
    return Promise.resolve(this.draftResult);
  };

  setDelegatedPowers = (options: {
    delegatedPowers: boolean;
    userDetails: UserDetails;
    amendmentReason?: AmendmentReason;
    amendmentDate?: string;
  }) => {
    this.draftResult = this.draftResultBuilder.setDelegatedPowers(this.draftResult, options);

    return Promise.resolve(this.draftResult);
  };

  setShadowListedOffenceIds = (offenceIds: string[]) => {
    this.draftResult = this.draftResultBuilder.setShadowListedOffenceIds(
      this.draftResult,
      offenceIds
    );
    return Promise.resolve(this.draftResult);
  };

  setSharedDate = async (options: { resultLineId: string; sharedDate: string }) => {
    this.draftResult = produce(this.draftResult, (draftResult) => {
      (draftResult.resultLines[options.resultLineId] as ResolvedDraftResultLine).sharedDate =
        options.sharedDate;
    });

    return Promise.resolve(this.draftResult);
  };

  setSharedDateForAllResultLines = async (sharedDate: string) => {
    this.draftResult = produce(this.draftResult, (draftResult) => {
      Object.keys(draftResult.resultLines).forEach((resultLineId) => {
        const resultLine = draftResult.resultLines[resultLineId];
        if (isResolvedDraftResultLine(resultLine)) {
          resultLine.sharedDate = sharedDate;
        }
      });
    });

    return Promise.resolve(this.draftResult);
  };

  toggleConditionalMandatory = async (options: { resultLineId: string; selected: boolean }) => {
    this.draftResult = await this.draftResultBuilder
      .toggleConditionalMandatoryChild(this.draftResult, this.userDetails, options)
      .toPromise();
  };

  updateResultPrompts = async (options: {
    resultLineId: string;
    resultPrompts: DraftResultPrompt[];
  }) => {
    this.draftResult = await this.draftResultBuilder
      .updateResultPrompts(this.draftResult, options)
      .toPromise();
  };
}
