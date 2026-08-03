import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { provideCppCoreHttpServices } from '@cpp/core';
import { createDraftResultPromptsForShortcode, DraftResultBuilder } from '../../testing';
import {
  getResultBelongsToOptionalBranch,
  isShareableDraftResultLine,
  validateAncillaryResults,
  validateDraftResult,
  validateDraftResultDetails
} from '../draft-result-validation';
import { reducers, AppState } from 'src/app/core';
import { filterResults } from '../draft-result';
import { isActiveDraftResultLine, isResolvedDraftResultLine } from '../result-line';
import { AnyDraftResultLine, DraftResult, Result } from '../../../../results/results.interfaces';
import { NotepadParserService } from '../../services/notepad-parser.service';

describe('draft result', () => {
  let draftResultBuilder: DraftResultBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        NotepadParserService,
        provideStore(reducers, {
          initialState: {
            hearings: {
              current: {
                hearing: { id: 'hearingId' }
              }
            }
          } as AppState,
          runtimeChecks: {}
        }),
        provideRouter([])
      ],
      teardown: { destroyAfterEach: true }
    });
    draftResultBuilder = new DraftResultBuilder();
  });

  const parseOriginalText = async (shortCode: string) => {
    await draftResultBuilder.parseTextOptions({
      applicationId: 'applicationId',
      orderedDate: '2020-01-01',
      originalText: shortCode
    });
  };

  describe('getResultBelongsToOptionalBranch', () => {
    it('should validate an optional child with an `atleastOneOf` child', async () => {
      await parseOriginalText('RILA');
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:4',
        shortCode: 'stayds',
        orderedDate: '2020-01-01'
      });

      expect(getResultBelongsToOptionalBranch(draftResultBuilder.draftResult, 'UUID:4')).toBe(
        false
      );
    });
  });

  describe('validateDraftResult', () => {
    it('should validate a draft result with no result lines', () => {
      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a draft result with an unresolved result line', async () => {
      await parseOriginalText('UNKNOWN');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);
    });

    it('should validate a draft result with a result line that has no prompt choices', async () => {
      await parseOriginalText('AD');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a draft result with a result line that has prompt choices', async () => {
      await parseOriginalText('CD');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('CD')
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a deleted result line with incomplete prompt choices', async () => {
      await parseOriginalText('CD');
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({
        id: '*',
        reasonDescription: '*'
      });
      await draftResultBuilder.destroyResultLine('UUID:1');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a conditional mandatory result line', async () => {
      await parseOriginalText('EMREQ');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.toggleConditionalMandatory({
        resultLineId: 'UUID:1',
        selected: false
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);

      await draftResultBuilder.toggleConditionalMandatory({
        resultLineId: 'UUID:1',
        selected: true
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:2',
        resultPrompts: createDraftResultPromptsForShortcode('nordrc')
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a result line with a `oneOf` child result definition', async () => {
      await parseOriginalText('NEXH');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'nhccs',
        orderedDate: '2020-01-01'
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:2',
        resultPrompts: createDraftResultPromptsForShortcode('NHCCS')
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a result line with an `atLeastOneOf` child result definition', async () => {
      await parseOriginalText('BAIC');

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'pore10',
        orderedDate: '2020-01-01'
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);

      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'porr3',
        orderedDate: '2020-01-01'
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:3',
        resultPrompts: createDraftResultPromptsForShortcode('porr3')
      });

      expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
    });

    describe('optional results', () => {
      it('should validate a result line with an `atLeastOneOf` child result definition', async () => {
        await parseOriginalText('PBVAR');
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('PBVAR')
        });

        expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
      });

      it('should validate an optional child with no result prompts', async () => {
        await parseOriginalText('STDEC');
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('STDEC')
        });

        expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(true);
      });

      it('should validate an optional child with incomplete result prompts', async () => {
        await parseOriginalText('STDEC');
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('STDEC')
        });
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:2',
          resultPrompts: [createDraftResultPromptsForShortcode('der')[0]]
        });

        expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);
      });

      it('should validate an optional child with completed result prompts', async () => {
        await parseOriginalText('STDEC');
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('STDEC')
        });
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:2',
          resultPrompts: [createDraftResultPromptsForShortcode('der')[0]]
        });

        expect(validateDraftResult(draftResultBuilder.draftResult)).toBe(false);
      });
    });
  });

  describe('validateDraftResultDetails', () => {
    it('should validate a draft result with no result lines', () => {
      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a draft result with an unresolved result line', async () => {
      await parseOriginalText('UNKNOWN');

      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a draft result with a result line that has no prompt choices', async () => {
      await parseOriginalText('AD');

      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a deleted result line with incomplete prompt choices', async () => {
      await parseOriginalText('CD');
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({
        id: '*',
        reasonDescription: '*'
      });
      await draftResultBuilder.destroyResultLine('UUID:1');

      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a draft result with a result line that has prompt choices', async () => {
      await parseOriginalText('CD');

      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(false);

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('CD')
      });

      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should validate a conditional mandatory result line', async () => {
      await parseOriginalText('EMREQ');

      expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
    });

    it('should return false for a falsy draft result', () => {
      // Guards against runtime scenarios where the store has not yet been populated.
      expect(validateDraftResultDetails(null as any)).toBe(false);
    });

    describe('optional results', () => {
      beforeEach(async () => {
        // important – use STDEC as it contains optional children with nested mandatory children
        await parseOriginalText('STDEC');
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:1',
          resultPrompts: createDraftResultPromptsForShortcode('STDEC')
        });
      });

      it('should validate an optional child with no result prompts', async () => {
        expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(true);
      });

      it('should validate an optional child with incomplete result prompts', async () => {
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:2',
          resultPrompts: [createDraftResultPromptsForShortcode('der')[0]]
        });

        expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(false);
      });

      it('should validate an optional child with completed result prompts', async () => {
        await draftResultBuilder.updateResultPrompts({
          resultLineId: 'UUID:2',
          resultPrompts: [createDraftResultPromptsForShortcode('der')[0]]
        });

        expect(validateDraftResultDetails(draftResultBuilder.draftResult)).toBe(false);
      });
    });
  });

  describe('validateAncillaryResults', () => {
    const orderedDate = '2024-01-01';

    const getActiveShareableResults = (
      draftResult: DraftResult<AnyDraftResultLine>
    ): Result<AnyDraftResultLine>[] =>
      filterResults(
        draftResult,
        ({ resultLine }) =>
          isActiveDraftResultLine(resultLine) && isShareableDraftResultLine(draftResult, resultLine)
      );

    it('should not validate a nonStandaloneAncillaryResult as a single result on an offence', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId1',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        defendantId: 'defendantId',
        originalText: 'TEXT',
        orderedDate
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([
        {
          amendmentsLog: undefined,
          caseId: 'caseId1',
          conditionalMandatory: false,
          defendantId: 'defendantId',
          excludedFromResults: false,
          nonStandaloneAncillaryResult: true,
          label: 'Text',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          orderedDate: '2024-02-12',
          originalText: 'TEXT',
          promptChoices: [
            {
              code: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              hidden: false,
              label: 'Text',
              maxLength: '4000',
              minLength: '1',
              nameAddressList: [],
              promptOrder: 100,
              promptRef: 'text',
              required: true,
              type: 'TXT'
            }
          ],
          resultDefinitionId: '98138ec8-5dd3-11e8-9c2d-fa7ae01bbebc',
          resultLevel: 'O',
          resultLineId: 'UUID:1',
          resultPrompts: [
            {
              label: 'Text',
              promptId: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              promptRef: 'text',
              type: 'TXT',
              value: '*'
            }
          ],
          shortCode: 'text',
          unresolvedParts: [],
          unscheduled: false,
          valid: true
        }
      ]);
    });

    it('should not validate a nonStandaloneAncillaryResult as a single result on an application', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'TEXT',
        orderedDate,
        applicationId: 'applicationId'
      });

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([
        {
          amendmentsLog: undefined,
          applicationId: 'applicationId',
          conditionalMandatory: false,
          excludedFromResults: false,
          nonStandaloneAncillaryResult: true,
          label: 'Text',
          orderedDate: '2024-02-12',
          originalText: 'TEXT',
          promptChoices: [
            {
              code: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              hidden: false,
              label: 'Text',
              maxLength: '4000',
              minLength: '1',
              nameAddressList: [],
              promptOrder: 100,
              promptRef: 'text',
              required: true,
              type: 'TXT'
            }
          ],
          resultDefinitionId: '98138ec8-5dd3-11e8-9c2d-fa7ae01bbebc',
          resultLevel: 'O',
          resultLineId: 'UUID:1',
          resultPrompts: [
            {
              label: 'Text',
              promptId: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              promptRef: 'text',
              type: 'TXT',
              value: '*'
            }
          ],
          shortCode: 'text',
          unresolvedParts: [],
          unscheduled: false,
          valid: true
        }
      ]);
    });

    it('should not validate a nonStandaloneAncillaryResult without other results that are not final or interim on an offence', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          caseId: 'caseId1',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          defendantId: 'defendantId',
          originalText: 'TEXT',
          orderedDate
        },
        {
          caseId: 'caseId1',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          defendantId: 'defendantId',
          originalText: 'rinstl 1/8/20',
          orderedDate
        }
      );
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([
        {
          amendmentsLog: undefined,
          caseId: 'caseId1',
          conditionalMandatory: false,
          defendantId: 'defendantId',
          excludedFromResults: false,
          nonStandaloneAncillaryResult: true,
          label: 'Text',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          orderedDate: '2024-02-12',
          originalText: 'TEXT',
          promptChoices: [
            {
              code: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              hidden: false,
              label: 'Text',
              maxLength: '4000',
              minLength: '1',
              nameAddressList: [],
              promptOrder: 100,
              promptRef: 'text',
              required: true,
              type: 'TXT'
            }
          ],
          resultDefinitionId: '98138ec8-5dd3-11e8-9c2d-fa7ae01bbebc',
          resultLevel: 'O',
          resultLineId: 'UUID:1',
          resultPrompts: [
            {
              label: 'Text',
              promptId: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              promptRef: 'text',
              type: 'TXT',
              value: '*'
            }
          ],
          shortCode: 'text',
          unresolvedParts: [],
          unscheduled: false,
          valid: true
        }
      ]);
    });

    it('should not validate a nonStandaloneAncillaryResult without other results that are not final or interim on an application', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'TEXT',
          orderedDate,
          applicationId: 'applicationId'
        },
        {
          originalText: 'rinstl 1/8/20',
          orderedDate,
          applicationId: 'applicationId'
        }
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([
        {
          amendmentsLog: undefined,
          applicationId: 'applicationId',
          conditionalMandatory: false,
          excludedFromResults: false,
          nonStandaloneAncillaryResult: true,
          label: 'Text',
          orderedDate: '2024-02-12',
          originalText: 'TEXT',
          promptChoices: [
            {
              code: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              hidden: false,
              label: 'Text',
              maxLength: '4000',
              minLength: '1',
              nameAddressList: [],
              promptOrder: 100,
              promptRef: 'text',
              required: true,
              type: 'TXT'
            }
          ],
          resultDefinitionId: '98138ec8-5dd3-11e8-9c2d-fa7ae01bbebc',
          resultLevel: 'O',
          resultLineId: 'UUID:1',
          resultPrompts: [
            {
              label: 'Text',
              promptId: 'b4ac2e46-5dd3-11e8-9c2d-fa7ae01bbebc',
              promptRef: 'text',
              type: 'TXT',
              value: '*'
            }
          ],
          shortCode: 'text',
          unresolvedParts: [],
          unscheduled: false,
          valid: true
        }
      ]);
    });

    it('should validate a nonStandaloneAncillaryResult with other results that is final (category="F") on an offence', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          caseId: 'caseId1',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          defendantId: 'defendantId',
          originalText: 'TEXT',
          orderedDate
        },
        {
          caseId: 'caseId1',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          defendantId: 'defendantId',
          originalText: 'FO',
          orderedDate
        }
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:2',
        resultPrompts: createDraftResultPromptsForShortcode('FO')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([]);
    });

    it('should validate a nonStandaloneAncillaryResult with other results that is final (category="F") on an application', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'TEXT',
          orderedDate,
          applicationId: 'applicationId'
        },
        {
          originalText: 'FO',
          orderedDate,
          applicationId: 'applicationId'
        }
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:2',
        resultPrompts: createDraftResultPromptsForShortcode('FO')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([]);
    });

    it('should validate a nonStandaloneAncillaryResult with other results that is interim (category="I") on an offence', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          caseId: 'caseId1',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          defendantId: 'defendantId',
          originalText: 'TEXT',
          orderedDate
        },
        {
          caseId: 'caseId1',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          defendantId: 'defendantId',
          originalText: 'RT',
          orderedDate
        }
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([]);
    });

    it('should validate a nonStandaloneAncillaryResult with other results that is interim (category="I") on an application', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'TEXT',
          orderedDate,
          applicationId: 'applicationId'
        },
        {
          originalText: 'RT',
          orderedDate,
          applicationId: 'applicationId'
        }
      );

      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('TEXT')
      });

      const activeShareableResults = getActiveShareableResults(draftResultBuilder.draftResult);

      expect(validateAncillaryResults(activeShareableResults)).toStrictEqual([]);
    });

    it('should mark an undefined result line unresolved', () => {
      expect(isResolvedDraftResultLine(undefined)).toBeFalsy;
    });
  });
});
