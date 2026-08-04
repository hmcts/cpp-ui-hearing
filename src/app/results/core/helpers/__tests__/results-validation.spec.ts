import { Defendant } from '../../../../core/model/defendant';
import { HearingDetail } from '../../../../core/model/hearing-detail';
import { DraftResult, ResolvedDraftResultLine } from '../../../results.interfaces';
import { ResultsLineValidation } from '../../../results-validation.interfaces';
import { buildResultsValidationRequest } from '../results-validation';

describe('buildResultsValidationRequest', () => {
  const createMinimalHearing = (overrides: Partial<HearingDetail> = {}): HearingDetail =>
    ({
      id: 'hearingId1',
      jurisdictionType: 'MAGISTRATES',
      prosecutionCases: [],
      ...overrides
    } as HearingDetail);

  const createDefendant = (overrides: Partial<Defendant> = {}): Defendant =>
    ({
      id: 'defendantId1',
      masterDefendantId: 'masterDefendantId1',
      personDefendant: {
        personDetails: {
          firstName: 'Alice',
          lastName: 'Smith'
        }
      },
      offences: [],
      associatedPersons: [],
      prosecutionCaseId: 'prosecutionCaseId1',
      numberOfPreviousConvictionsCited: 0,
      prosecutionAuthorityReference: '',
      witnessStatement: '',
      witnessStatementWelsh: '',
      mitigation: '',
      mitigationWelsh: '',
      ...overrides
    } as Defendant);

  const createResolvedResultLine = (
    overrides: Partial<ResolvedDraftResultLine> = {}
  ): ResolvedDraftResultLine =>
    ({
      resultLineId: 'resultLineId1',
      shortCode: 'IMP',
      label: 'Imprisonment',
      orderedDate: '2020-01-01',
      originalText: 'IMP',
      resultDefinitionId: 'resultDefinitionId1',
      resultLevel: 'O',
      resultPrompts: [],
      unresolvedParts: [],
      valid: true,
      caseId: 'caseId1',
      defendantId: 'defendantId1',
      masterDefendantId: 'masterDefendantId1',
      offenceId: 'offenceId1',
      ...overrides
    } as ResolvedDraftResultLine);

  const createDraftResult = (
    resultLines: Record<string, ResolvedDraftResultLine>,
    overrides: Partial<DraftResult> = {}
  ): DraftResult => ({
    hearingId: 'hearingId1',
    hearingDay: '2020-01-01',
    resultLines,
    relations: [],
    shadowListedOffenceIds: [],
    ...overrides
  });

  describe('resultLines mapping', () => {
    describe('category field', () => {
      it('should include category "A" (Ancillary) when present on the result line', () => {
        const line = createResolvedResultLine({ category: 'A' });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toEqual([
          expect.objectContaining<Partial<ResultsLineValidation>>({
            resultLineId: 'resultLineId1',
            category: 'A'
          })
        ]);
      });

      it('should include category "I" (Intermediary) when present on the result line', () => {
        const line = createResolvedResultLine({ category: 'I' });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toEqual([
          expect.objectContaining<Partial<ResultsLineValidation>>({
            resultLineId: 'resultLineId1',
            category: 'I'
          })
        ]);
      });

      it('should include category "F" (Final) when present on the result line', () => {
        const line = createResolvedResultLine({ category: 'F' });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toEqual([
          expect.objectContaining<Partial<ResultsLineValidation>>({
            resultLineId: 'resultLineId1',
            category: 'F'
          })
        ]);
      });

      it('should NOT include category when it is undefined on the result line', () => {
        const line = createResolvedResultLine({ category: undefined });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toHaveLength(1);
        expect(request.resultLines[0]).not.toHaveProperty('category');
      });

      it('should NOT include category when the field is absent from the result line', () => {
        const line = createResolvedResultLine();
        delete (line as any).category;
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toHaveLength(1);
        expect(request.resultLines[0]).not.toHaveProperty('category');
      });
    });

    describe('core fields', () => {
      it('should map id, shortCode, label, defendantId and offenceId from the result line', () => {
        const line = createResolvedResultLine({
          resultLineId: 'resultLineId2',
          shortCode: 'EMONE',
          label: 'Electronic Monitoring',
          defendantId: 'defendantId2',
          offenceId: 'offenceId2'
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0]).toEqual(
          expect.objectContaining({
            resultLineId: 'resultLineId2',
            shortCode: 'EMONE',
            label: 'Electronic Monitoring',
            defendantId: 'defendantId2',
            offenceId: 'offenceId2'
          })
        );
      });
    });

    describe('isConcurrent field', () => {
      it('should include isConcurrent when the concurrent prompt is present', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'BOOLEAN',
              promptId: 'promptId1',
              promptRef: 'concurrent',
              label: 'Concurrent',
              value: true
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0].isConcurrent).toBe(true);
      });

      it('should NOT include isConcurrent when no concurrent prompt exists', () => {
        const line = createResolvedResultLine({ resultPrompts: [] });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0]).not.toHaveProperty('isConcurrent');
      });
    });

    describe('consecutiveToOffence field', () => {
      it('should include consecutiveToOffence when the prompt is present with a value', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'TXT',
              promptId: 'promptId2',
              promptRef: 'consecutiveToOffenceNumber',
              label: 'Consecutive to',
              value: 'offenceId3'
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0].consecutiveToOffence).toBe('offenceId3');
      });

      it('should NOT include consecutiveToOffence when the prompt value is empty', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'TXT',
              promptId: 'promptId2',
              promptRef: 'consecutiveToOffenceNumber',
              label: 'Consecutive to',
              value: ''
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0]).not.toHaveProperty('consecutiveToOffence');
      });
    });

    describe('combined fields', () => {
      it('should map all optional fields together when all are present', () => {
        const line = createResolvedResultLine({
          resultLineId: 'resultLineId3',
          shortCode: 'IMP',
          label: 'Imprisonment',
          defendantId: 'defendantId1',
          offenceId: 'offenceId1',
          category: 'F',
          resultPrompts: [
            {
              type: 'BOOLEAN',
              promptId: 'promptId1',
              promptRef: 'concurrent',
              label: 'Concurrent',
              value: false
            },
            {
              type: 'TXT',
              promptId: 'promptId2',
              promptRef: 'consecutiveToOffenceNumber',
              label: 'Consecutive to',
              value: 'offenceId2'
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0]).toEqual({
          resultLineId: 'resultLineId3',
          shortCode: 'IMP',
          label: 'Imprisonment',
          defendantId: 'defendantId1',
          offenceId: 'offenceId1',
          isConcurrent: false,
          consecutiveToOffence: 'offenceId2',
          category: 'F',
          prompts: [
            { promptRef: 'concurrent', promptValue: 'false' },
            { promptRef: 'consecutiveToOffenceNumber', promptValue: 'offenceId2' }
          ]
        });
      });
    });

    describe('prompts field', () => {
      it('should include string-valued prompts in the prompts array', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'DATE',
              promptId: 'p1',
              promptRef: 'endDate',
              label: 'End date',
              value: '2026-10-30'
            },
            {
              type: 'DATE',
              promptId: 'p2',
              promptRef: 'endDateOfTagging',
              label: 'End date of tag',
              value: '2026-12-15'
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0].prompts).toEqual([
          { promptRef: 'endDate', promptValue: '2026-10-30' },
          { promptRef: 'endDateOfTagging', promptValue: '2026-12-15' }
        ]);
      });

      it('should stringify numeric and boolean prompt values', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'BOOLEAN',
              promptId: 'p1',
              promptRef: 'concurrent',
              label: 'Concurrent',
              value: true
            },
            {
              type: 'NUMBER' as never,
              promptId: 'p2',
              promptRef: 'someNumber',
              label: 'Some number',
              value: 42 as never
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0].prompts).toEqual([
          { promptRef: 'concurrent', promptValue: 'true' },
          { promptRef: 'someNumber', promptValue: '42' }
        ]);
      });

      it('should filter out prompts whose value is an array or object (non-primitive)', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'DATE',
              promptId: 'p1',
              promptRef: 'endDate',
              label: 'End date',
              value: '2026-10-30'
            },
            {
              type: 'DURATION' as never,
              promptId: 'p2',
              promptRef: 'duration',
              label: 'Duration',
              value: [{ type: 'months', value: 12 }] as never
            },
            {
              type: 'ONEOF' as never,
              promptId: 'p3',
              promptRef: 'oneOf',
              label: 'OneOf',
              value: { nested: 'value' } as never
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0].prompts).toEqual([
          { promptRef: 'endDate', promptValue: '2026-10-30' }
        ]);
      });

      it('should NOT include the prompts field when resultPrompts is empty', () => {
        const line = createResolvedResultLine({ resultPrompts: [] });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0]).not.toHaveProperty('prompts');
      });

      it('should NOT include the prompts field when all values are non-primitive', () => {
        const line = createResolvedResultLine({
          resultPrompts: [
            {
              type: 'DURATION' as never,
              promptId: 'p1',
              promptRef: 'duration',
              label: 'Duration',
              value: [{ type: 'months', value: 12 }] as never
            }
          ]
        });
        const draftResult = createDraftResult({ [line.resultLineId]: line });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines[0]).not.toHaveProperty('prompts');
      });
    });

    describe('filtering', () => {
      it('should exclude deleted result lines', () => {
        const activeLine = createResolvedResultLine({ resultLineId: 'resultLineId1' });
        const deletedLine = createResolvedResultLine({
          resultLineId: 'resultLineId2',
          deleted: true,
          category: 'F'
        });
        const draftResult = createDraftResult({
          [activeLine.resultLineId]: activeLine,
          [deletedLine.resultLineId]: deletedLine
        });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toHaveLength(1);
        expect(request.resultLines[0].resultLineId).toBe('resultLineId1');
      });

      it('should exclude result lines without an offenceId (application-level)', () => {
        const offenceLine = createResolvedResultLine({
          resultLineId: 'resultLineId1',
          offenceId: 'offenceId1'
        });
        const appLine = createResolvedResultLine({
          resultLineId: 'resultLineId2',
          applicationId: 'applicationId1'
        } as any);
        // Remove offenceId to simulate an application-level line
        delete (appLine as any).offenceId;

        const draftResult = createDraftResult({
          [offenceLine.resultLineId]: offenceLine,
          [appLine.resultLineId]: appLine
        });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toHaveLength(1);
        expect(request.resultLines[0].resultLineId).toBe('resultLineId1');
      });

      it('should return an empty array when there are no result lines', () => {
        const draftResult = createDraftResult({});

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toEqual([]);
      });

      it('should handle null/undefined resultLines gracefully', () => {
        const draftResult = createDraftResult({});
        (draftResult as any).resultLines = undefined;

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toEqual([]);
      });
    });

    describe('multiple result lines with different categories', () => {
      it('should correctly map category per result line when multiple lines exist', () => {
        const ancillaryLine = createResolvedResultLine({
          resultLineId: 'resultLineId1',
          shortCode: 'ADJ',
          label: 'Adjournment',
          category: 'A'
        });
        const intermediaryLine = createResolvedResultLine({
          resultLineId: 'resultLineId2',
          shortCode: 'PLEA',
          label: 'Plea',
          category: 'I'
        });
        const finalLine = createResolvedResultLine({
          resultLineId: 'resultLineId3',
          shortCode: 'IMP',
          label: 'Imprisonment',
          category: 'F'
        });
        const noCategoryLine = createResolvedResultLine({
          resultLineId: 'resultLineId4',
          shortCode: 'TEXT',
          label: 'Text'
        });

        const draftResult = createDraftResult({
          [ancillaryLine.resultLineId]: ancillaryLine,
          [intermediaryLine.resultLineId]: intermediaryLine,
          [finalLine.resultLineId]: finalLine,
          [noCategoryLine.resultLineId]: noCategoryLine
        });

        const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), [
          createDefendant()
        ]);

        expect(request.resultLines).toHaveLength(4);

        const byId = (id: string) => request.resultLines.find(rl => rl.resultLineId === id)!;

        expect(byId('resultLineId1').category).toBe('A');
        expect(byId('resultLineId2').category).toBe('I');
        expect(byId('resultLineId3').category).toBe('F');
        expect(byId('resultLineId4')).not.toHaveProperty('category');
      });
    });
  });

  describe('top-level request fields', () => {
    it('should map hearingId and hearingDay from the draft result', () => {
      const draftResult = createDraftResult(
        {},
        { hearingId: 'hearingId2', hearingDay: '2025-06-15' }
      );

      const request = buildResultsValidationRequest(draftResult, createMinimalHearing(), []);

      expect(request.hearingId).toBe('hearingId2');
      expect(request.hearingDay).toBe('2025-06-15');
    });

    it('should map courtType from the hearing jurisdictionType', () => {
      const request = buildResultsValidationRequest(
        createDraftResult({}),
        createMinimalHearing({ jurisdictionType: 'CROWN' }),
        []
      );

      expect(request.courtType).toBe('CROWN');
    });
  });

  describe('defendants mapping', () => {
    it('should map person defendant fields', () => {
      const defendant = createDefendant({
        id: 'defendantId2',
        masterDefendantId: 'masterDefendantId2',
        personDefendant: {
          personDetails: { firstName: 'Bob', lastName: 'Jones' }
        } as any
      });

      const request = buildResultsValidationRequest(createDraftResult({}), createMinimalHearing(), [
        defendant
      ]);

      expect(request.defendants).toEqual([
        {
          defendantId: 'defendantId2',
          firstName: 'Bob',
          lastName: 'Jones',
          masterDefendantId: 'masterDefendantId2'
        }
      ]);
    });

    it('should deduplicate defendants by id', () => {
      const def1 = createDefendant({ id: 'defendantId1' });
      const def1Dup = createDefendant({ id: 'defendantId1' });
      const def2 = createDefendant({ id: 'defendantId2' });

      const request = buildResultsValidationRequest(createDraftResult({}), createMinimalHearing(), [
        def1,
        def1Dup,
        def2
      ]);

      expect(request.defendants).toHaveLength(2);
    });

    it('should use organisation name for legal entity defendants', () => {
      const defendant = createDefendant({
        id: 'defendantId3',
        personDefendant: undefined as any,
        legalEntityDefendant: {
          organisation: { name: 'ACME Corp' }
        } as any
      });

      const request = buildResultsValidationRequest(createDraftResult({}), createMinimalHearing(), [
        defendant
      ]);

      expect(request.defendants[0].firstName).toBe('ACME Corp');
      expect(request.defendants[0].lastName).toBe('');
    });

    it('should fallback to empty string when defendant has no personDefendant and no legalEntityDefendant', () => {
      const defendant = createDefendant({
        id: 'defendantId4',
        personDefendant: undefined as any,
        legalEntityDefendant: undefined as any
      });

      const request = buildResultsValidationRequest(createDraftResult({}), createMinimalHearing(), [
        defendant
      ]);

      expect(request.defendants[0].firstName).toBe('');
      expect(request.defendants[0].lastName).toBe('');
    });
  });

  describe('offences mapping', () => {
    it('should map offences from prosecution cases in the hearing', () => {
      const hearing = createMinimalHearing({
        prosecutionCases: [
          {
            id: 'prosecutionCaseId1',
            prosecutionCaseIdentifier: { caseURN: 'caseURN1' },
            defendants: [
              createDefendant({
                offences: [
                  {
                    id: 'offenceId1',
                    offenceCode: 'TH68001',
                    offenceTitle: 'Theft',
                    orderIndex: 1
                  } as any
                ]
              })
            ]
          } as any
        ]
      });

      const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

      expect(request.offences).toEqual([
        {
          offenceId: 'offenceId1',
          offenceCode: 'TH68001',
          offenceTitle: 'Theft',
          orderIndex: 1,
          caseUrn: 'caseURN1',
          hasExistingCtlRecord: false,
          isConvicted: false
        }
      ]);
    });

    it('should deduplicate offences by id', () => {
      const offence = {
        id: 'offenceId1',
        offenceCode: 'TH68001',
        offenceTitle: 'Theft',
        orderIndex: 1
      } as any;

      const hearing = createMinimalHearing({
        prosecutionCases: [
          {
            id: 'prosecutionCaseId1',
            prosecutionCaseIdentifier: { caseURN: 'caseURN1' },
            defendants: [
              createDefendant({ offences: [offence] }),
              createDefendant({ id: 'defendantId2', offences: [offence] })
            ]
          } as any
        ]
      });

      const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

      expect(request.offences).toHaveLength(1);
    });

    it('should handle hearing with undefined prosecutionCases', () => {
      const hearing = createMinimalHearing({
        prosecutionCases: undefined as any
      });

      const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

      expect(request.offences).toEqual([]);
    });

    it('should handle prosecution case with undefined defendants', () => {
      const hearing = createMinimalHearing({
        prosecutionCases: [
          {
            id: 'prosecutionCaseId1',
            prosecutionCaseIdentifier: { caseURN: 'caseURN1' },
            defendants: undefined
          } as any
        ]
      });

      const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

      expect(request.offences).toEqual([]);
    });

    it('should handle defendant with undefined offences', () => {
      const hearing = createMinimalHearing({
        prosecutionCases: [
          {
            id: 'prosecutionCaseId1',
            prosecutionCaseIdentifier: { caseURN: 'caseURN1' },
            defendants: [createDefendant({ offences: undefined as any })]
          } as any
        ]
      });

      const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

      expect(request.offences).toEqual([]);
    });

    describe('CTL and conviction flags', () => {
      const buildHearingWithOffence = (offence: object) =>
        createMinimalHearing({
          prosecutionCases: [
            {
              id: 'prosecutionCaseId1',
              prosecutionCaseIdentifier: { caseURN: 'caseURN1' },
              defendants: [createDefendant({ offences: [offence as any] })]
            } as any
          ]
        });

      it('should set hasExistingCtlRecord=false and isConvicted=false when neither is populated', () => {
        const hearing = buildHearingWithOffence({
          id: 'offenceId1',
          offenceCode: 'TH68001',
          offenceTitle: 'Theft',
          orderIndex: 1
        });

        const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

        expect(request.offences[0]).toEqual(
          expect.objectContaining({ hasExistingCtlRecord: false, isConvicted: false })
        );
      });

      it('should set hasExistingCtlRecord=true when offence.custodyTimeLimit is populated', () => {
        const hearing = buildHearingWithOffence({
          id: 'offenceId1',
          offenceCode: 'TH68001',
          offenceTitle: 'Theft',
          orderIndex: 1,
          custodyTimeLimit: { timeLimit: '2026-06-01', daysSpent: 10 }
        });

        const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

        expect(request.offences[0]).toEqual(
          expect.objectContaining({ hasExistingCtlRecord: true, isConvicted: false })
        );
      });

      it('should set isConvicted=true when offence.convictionDate is populated', () => {
        const hearing = buildHearingWithOffence({
          id: 'offenceId1',
          offenceCode: 'TH68001',
          offenceTitle: 'Theft',
          orderIndex: 1,
          convictionDate: '2026-05-18'
        });

        const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

        expect(request.offences[0]).toEqual(
          expect.objectContaining({ hasExistingCtlRecord: false, isConvicted: true })
        );
      });

      it('should set both flags true when both fields are populated', () => {
        const hearing = buildHearingWithOffence({
          id: 'offenceId1',
          offenceCode: 'TH68001',
          offenceTitle: 'Theft',
          orderIndex: 1,
          custodyTimeLimit: { timeLimit: '2026-06-01', daysSpent: 0 },
          convictionDate: '2026-05-18'
        });

        const request = buildResultsValidationRequest(createDraftResult({}), hearing, []);

        expect(request.offences[0]).toEqual(
          expect.objectContaining({ hasExistingCtlRecord: true, isConvicted: true })
        );
      });
    });
  });
});
