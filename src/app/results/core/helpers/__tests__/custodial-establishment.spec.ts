import { CustodyEstablishment, HearingDetail } from '../../../../core';
import {
  DraftResultPrompt,
  NameAddressPromptChoice,
  PromptChoice
} from '../../../results.interfaces';
import {
  applyCustodialEstablishmentToResultPrompts,
  createPrisonResultPromptForCustodialEstablishment,
  getCustodialEstablishmentForTarget,
  getPrisonPromptChoice
} from '../custodial-establishment';

const establishment = (name: string): CustodyEstablishment => ({
  id: name,
  name,
  custody: 'Prison'
});

const defendant = (id: string, caseId: string, masterDefendantId: string, prison?: string) => ({
  id,
  prosecutionCaseId: caseId,
  masterDefendantId,
  personDefendant: prison ? { custodialEstablishment: establishment(prison) } : {}
});

const hearing = {
  prosecutionCases: [
    {
      id: 'case1',
      defendants: [
        defendant('d1-case1', 'case1', 'MD1', 'HMP Bristol'),
        defendant('d2-case1', 'case1', 'MD2'),
        defendant('d3-case1', 'case1', 'MD3')
      ]
    },
    {
      id: 'case2',
      defendants: [
        defendant('d2-case2', 'case2', 'MD2', 'HMP/YOI Eastwood Park'),
        defendant('d3-case2', 'case2', 'MD3')
      ]
    }
  ]
} as unknown as HearingDetail;

const prisonPromptChoice = {
  code: 'prison-code',
  promptRef: 'prison',
  label: 'Prison',
  type: 'NAMEADDRESS',
  promptOrder: 300,
  addressType: 'Organisation',
  listLabel: 'Select Prison',
  required: true,
  children: [
    {
      code: 'prison-code',
      label: 'Prison organisation name',
      type: 'TXT',
      promptRef: 'prisonOrganisationName',
      partName: 'OrganisationName'
    },
    {
      code: 'prison-code',
      label: 'Prison email address 1',
      type: 'TXT',
      promptRef: 'prisonEmailAddress1',
      partName: 'EmailAddress1'
    },
    {
      code: 'prison-code',
      label: 'Prison email address 2',
      type: 'TXT',
      promptRef: 'prisonEmailAddress2',
      partName: 'EmailAddress2'
    }
  ],
  nameAddressList: [
    {
      label: 'HMP/YOI Eastwood Park',
      addressParts: {
        OrganisationName: 'HMP/YOI Eastwood Park',
        EmailAddress1: 'Custody.Eastwoodpark@justice.gov.uk',
        EmailAddress2: 'Reception.EastwoodPark@justice.gov.uk'
      }
    }
  ]
} as unknown as NameAddressPromptChoice;

const dateChoice = { promptRef: 'date', type: 'DATE', promptOrder: 100 } as unknown as PromptChoice;
const promptChoices = [dateChoice, prisonPromptChoice] as PromptChoice[];

const dateResultPrompt = {
  promptRef: 'date',
  type: 'DATE',
  value: '2026-11-13'
} as DraftResultPrompt;
const cachedPrisonPrompt = {
  promptRef: 'prison',
  type: 'NAMEADDRESS',
  value: [{ promptRef: 'prisonOrganisationName', type: 'TXT', value: 'HMP High Down' }]
} as DraftResultPrompt;

const prisonName = (prompts: DraftResultPrompt[]) =>
  (prompts.find(prompt => prompt.promptRef === 'prison')?.value as DraftResultPrompt[])?.find(
    child => child.promptRef === 'prisonOrganisationName'
  )?.value;

describe('custodial-establishment helpers (CHD-2714)', () => {
  describe('getPrisonPromptChoice', () => {
    it('should find the NAMEADDRESS prompt choice with promptRef "prison"', () => {
      expect(getPrisonPromptChoice(promptChoices)).toBe(prisonPromptChoice);
    });

    it('should ignore results without a prison prompt', () => {
      expect(getPrisonPromptChoice([dateChoice])).toBeUndefined();
      expect(getPrisonPromptChoice(undefined)).toBeUndefined();
    });

    it('should ignore a "prison" prompt that is not a NAMEADDRESS', () => {
      expect(
        getPrisonPromptChoice([{ promptRef: 'prison', type: 'TXT' } as PromptChoice])
      ).toBeUndefined();
    });
  });

  describe('getCustodialEstablishmentForTarget', () => {
    it("should use the defendant's own custodial establishment (AC1)", () => {
      expect(
        getCustodialEstablishmentForTarget(hearing, {
          caseId: 'case1',
          defendantId: 'd1-case1',
          masterDefendantId: 'MD1'
        })?.name
      ).toBe('HMP Bristol');
    });

    it('should use a matched case in the same hearing when the own case is blank (AC9a)', () => {
      expect(
        getCustodialEstablishmentForTarget(hearing, {
          caseId: 'case1',
          defendantId: 'd2-case1',
          masterDefendantId: 'MD2'
        })?.name
      ).toBe('HMP/YOI Eastwood Park');
    });

    it('should return nothing when no case in the hearing has an establishment (AC2, AC9c, AC9e)', () => {
      expect(
        getCustodialEstablishmentForTarget(hearing, {
          caseId: 'case1',
          defendantId: 'd3-case1',
          masterDefendantId: 'MD3'
        })
      ).toBeUndefined();
      expect(
        getCustodialEstablishmentForTarget(hearing, { masterDefendantId: 'OTHER' })
      ).toBeUndefined();
    });

    it('should return nothing without a master defendant (e.g. an application target) or hearing', () => {
      expect(getCustodialEstablishmentForTarget(hearing, { caseId: 'case1' })).toBeUndefined();
      expect(
        getCustodialEstablishmentForTarget(undefined, { masterDefendantId: 'MD1' })
      ).toBeUndefined();
      expect(
        getCustodialEstablishmentForTarget(
          { prosecutionCases: undefined },
          { masterDefendantId: 'MD1' }
        )
      ).toBeUndefined();
    });

    describe('application subjects in the hearing (AC11a)', () => {
      const subject = (masterDefendantId: string, prison?: string) => ({
        id: `app-${masterDefendantId}`,
        subject: {
          id: `subject-${masterDefendantId}`,
          masterDefendant: {
            masterDefendantId,
            personDefendant: prison ? { custodialEstablishment: establishment(prison) } : {}
          }
        }
      });
      const applicationHearing = (
        prosecutionCases: unknown[],
        courtApplications: unknown[]
      ): HearingDetail => ({ prosecutionCases, courtApplications } as unknown as HearingDetail);

      it('should use the establishment of the application subject when no case in the hearing has one', () => {
        expect(
          getCustodialEstablishmentForTarget(
            applicationHearing([], [subject('MD9', 'HMP Bristol')]),
            { caseId: 'inactive', defendantId: 'd9', masterDefendantId: 'MD9' }
          )?.name
        ).toBe('HMP Bristol');
      });

      it('should prefer a case in the hearing over the application subject', () => {
        expect(
          getCustodialEstablishmentForTarget(
            applicationHearing(hearing.prosecutionCases, [subject('MD1', 'HMP Wandsworth')]),
            { caseId: 'case1', defendantId: 'd1-case1', masterDefendantId: 'MD1' }
          )?.name
        ).toBe('HMP Bristol');
      });

      it('should return nothing when the subject has no establishment or is another defendant (AC11a: never the old case value)', () => {
        const withSubjects = applicationHearing(
          [],
          [subject('MD9'), subject('MD8', 'HMP Bristol')]
        );

        expect(
          getCustodialEstablishmentForTarget(withSubjects, { masterDefendantId: 'MD9' })
        ).toBeUndefined();
      });
    });

    describe('most recently updated establishment (AC9b, AC9d)', () => {
      const dated = (name: string, lastUpdated?: string): CustodyEstablishment => ({
        ...establishment(name),
        ...(lastUpdated ? { lastUpdated } : {})
      });
      const onCase = (
        caseId: string,
        id: string,
        masterDefendantId: string,
        custodialEstablishment?: CustodyEstablishment
      ) => ({
        id,
        prosecutionCaseId: caseId,
        masterDefendantId,
        personDefendant: custodialEstablishment ? { custodialEstablishment } : {}
      });
      const hearingOf = (
        defendants: ReturnType<typeof onCase>[],
        courtApplications: unknown[] = []
      ): HearingDetail =>
        ({
          prosecutionCases: [...new Set(defendants.map(d => d.prosecutionCaseId))].map(id => ({
            id,
            defendants: defendants.filter(d => d.prosecutionCaseId === id)
          })),
          courtApplications
        } as unknown as HearingDetail);
      const nameFor = (h: HearingDetail, caseId: string, defendantId: string) =>
        getCustodialEstablishmentForTarget(h, { caseId, defendantId, masterDefendantId: 'MD' })
          ?.name;

      it('AC9b: should pre-populate both cases with the most recently updated establishment', () => {
        const both = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-10-01T09:00:00Z')),
          onCase('case2', 'd-case2', 'MD', dated('HMP/YOI Eastwood Park', '2026-11-01T09:00:00Z'))
        ]);

        // the newer matched case wins over the defendant's own case
        expect(nameFor(both, 'case1', 'd-case1')).toBe('HMP/YOI Eastwood Park');
        expect(nameFor(both, 'case2', 'd-case2')).toBe('HMP/YOI Eastwood Park');
      });

      it('AC9d: own case blank, should use the matched case with the most recent update (case 2 – Bristol)', () => {
        const three = hearingOf([
          onCase('case1', 'd-case1', 'MD'),
          onCase('case2', 'd-case2', 'MD', dated('HMP Bristol', '2026-11-10T09:00:00Z')),
          onCase('case3', 'd-case3', 'MD', dated('HMP/YOI Eastwood Park', '2026-10-10T09:00:00Z'))
        ]);

        expect(nameFor(three, 'case1', 'd-case1')).toBe('HMP Bristol');
      });

      it('AC9d: should not depend on the order of the cases in the hearing', () => {
        const three = hearingOf([
          onCase('case1', 'd-case1', 'MD'),
          onCase('case2', 'd-case2', 'MD', dated('HMP Bristol', '2026-10-10T09:00:00Z')),
          onCase('case3', 'd-case3', 'MD', dated('HMP/YOI Eastwood Park', '2026-11-10T09:00:00Z'))
        ]);

        expect(nameFor(three, 'case1', 'd-case1')).toBe('HMP/YOI Eastwood Park');
      });

      it('should compare the dates as instants, not as text (time zones)', () => {
        const zones = hearingOf([
          // 09:00Z
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-11-01T11:00:00+02:00')),
          // 10:00Z – the most recent
          onCase('case2', 'd-case2', 'MD', dated('HMP/YOI Eastwood Park', '2026-11-01T10:00:00Z'))
        ]);

        expect(nameFor(zones, 'case1', 'd-case1')).toBe('HMP/YOI Eastwood Park');
      });

      it('should prefer an establishment with a date over one without (only changes are dated)', () => {
        const mixed = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol')),
          onCase('case2', 'd-case2', 'MD', dated('HMP/YOI Eastwood Park', '2026-11-01T09:00:00Z'))
        ]);

        expect(nameFor(mixed, 'case1', 'd-case1')).toBe('HMP/YOI Eastwood Park');
      });

      it('should keep the own case first when the dates are equal', () => {
        const same = '2026-11-01T09:00:00Z';
        const tie = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', same)),
          onCase('case2', 'd-case2', 'MD', dated('HMP/YOI Eastwood Park', same))
        ]);

        expect(nameFor(tie, 'case1', 'd-case1')).toBe('HMP Bristol');
        expect(nameFor(tie, 'case2', 'd-case2')).toBe('HMP/YOI Eastwood Park');
      });

      it('should keep the own case first when there are no dates (e.g. data before the BE change)', () => {
        const undated = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol')),
          onCase('case2', 'd-case2', 'MD', dated('HMP/YOI Eastwood Park'))
        ]);

        expect(nameFor(undated, 'case1', 'd-case1')).toBe('HMP Bristol');
        expect(nameFor(undated, 'case2', 'd-case2')).toBe('HMP/YOI Eastwood Park');
      });

      it('should treat an invalid date as no date', () => {
        const invalid = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-10-01T09:00:00Z')),
          onCase('case2', 'd-case2', 'MD', dated('HMP/YOI Eastwood Park', 'not-a-date'))
        ]);

        expect(nameFor(invalid, 'case2', 'd-case2')).toBe('HMP Bristol');
      });

      it('should ignore a more recent establishment with a blank name', () => {
        const blank = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-10-01T09:00:00Z')),
          onCase('case2', 'd-case2', 'MD', dated('  ', '2026-11-01T09:00:00Z'))
        ]);

        expect(nameFor(blank, 'case2', 'd-case2')).toBe('HMP Bristol');
      });

      it('should ignore a more recent establishment of another defendant', () => {
        const other = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-10-01T09:00:00Z')),
          onCase('case1', 'other', 'OTHER', dated('HMP/YOI Eastwood Park', '2026-11-01T09:00:00Z'))
        ]);

        expect(nameFor(other, 'case1', 'd-case1')).toBe('HMP Bristol');
      });

      it('should use the application subject when it was updated most recently (AC11a)', () => {
        const subject = {
          id: 'app',
          subject: {
            id: 'subject',
            masterDefendant: {
              masterDefendantId: 'MD',
              personDefendant: {
                custodialEstablishment: dated('HMP Wandsworth', '2026-11-15T09:00:00Z')
              }
            }
          }
        };
        const withApplication = hearingOf(
          [onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-10-01T09:00:00Z'))],
          [subject]
        );
        const caseNewer = hearingOf(
          [onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-11-20T09:00:00Z'))],
          [subject]
        );

        expect(nameFor(withApplication, 'case1', 'd-case1')).toBe('HMP Wandsworth');
        expect(nameFor(caseNewer, 'case1', 'd-case1')).toBe('HMP Bristol');
      });

      it('should return the establishment with its date', () => {
        const one = hearingOf([
          onCase('case1', 'd-case1', 'MD', dated('HMP Bristol', '2026-10-01T09:00:00Z'))
        ]);

        expect(
          getCustodialEstablishmentForTarget(one, { caseId: 'case1', masterDefendantId: 'MD' })
        ).toEqual(dated('HMP Bristol', '2026-10-01T09:00:00Z'));
      });
    });

    it('should ignore an establishment with a blank name', () => {
      const blank = {
        prosecutionCases: [{ id: 'c', defendants: [defendant('d', 'c', 'MD', '  ')] }]
      } as unknown as HearingDetail;

      expect(
        getCustodialEstablishmentForTarget(blank, { defendantId: 'd', masterDefendantId: 'MD' })
      ).toBeUndefined();
    });
  });

  describe('createPrisonResultPromptForCustodialEstablishment', () => {
    it('should fill every part from the matching prison list item, ignoring case and spaces', () => {
      expect(
        createPrisonResultPromptForCustodialEstablishment(
          prisonPromptChoice,
          establishment(' hmp/yoi eastwood park ')
        )
      ).toEqual({
        promptRef: 'prison',
        promptId: 'prison-code',
        label: 'Prison',
        type: 'NAMEADDRESS',
        value: [
          {
            promptRef: 'prisonOrganisationName',
            promptId: 'prison-code',
            label: 'Prison organisation name',
            type: 'TXT',
            value: 'HMP/YOI Eastwood Park'
          },
          {
            promptRef: 'prisonEmailAddress1',
            promptId: 'prison-code',
            label: 'Prison email address 1',
            type: 'TXT',
            value: 'Custody.Eastwoodpark@justice.gov.uk'
          },
          {
            promptRef: 'prisonEmailAddress2',
            promptId: 'prison-code',
            label: 'Prison email address 2',
            type: 'TXT',
            value: 'Reception.EastwoodPark@justice.gov.uk'
          }
        ]
      });
    });

    it('should only set the organisation name when the prison is not in the list', () => {
      expect(
        createPrisonResultPromptForCustodialEstablishment(
          prisonPromptChoice,
          establishment('HMP Bristol')
        ).value
      ).toEqual([
        {
          promptRef: 'prisonOrganisationName',
          promptId: 'prison-code',
          label: 'Prison organisation name',
          type: 'TXT',
          value: 'HMP Bristol'
        }
      ]);
    });
  });

  describe('applyCustodialEstablishmentToResultPrompts', () => {
    it('should add the prison prompt in prompt order when there is none (AC1)', () => {
      const result = applyCustodialEstablishmentToResultPrompts(
        promptChoices,
        [dateResultPrompt],
        establishment('HMP Bristol')
      );

      expect(result.map(prompt => prompt.promptRef)).toEqual(['date', 'prison']);
      expect(prisonName(result)).toBe('HMP Bristol');
    });

    it('should take precedence over the prison from the session cache (precedence 1 over 2)', () => {
      const result = applyCustodialEstablishmentToResultPrompts(
        promptChoices,
        [dateResultPrompt, cachedPrisonPrompt],
        establishment('HMP Bristol')
      );

      expect(result).toHaveLength(2);
      expect(prisonName(result)).toBe('HMP Bristol');
    });

    it('should keep the session cache prison when there is no establishment (AC3)', () => {
      const prompts = [dateResultPrompt, cachedPrisonPrompt];

      expect(applyCustodialEstablishmentToResultPrompts(promptChoices, prompts, undefined)).toBe(
        prompts
      );
    });

    it('should not override a prison typed in the notepad text', () => {
      const prompts = [dateResultPrompt, cachedPrisonPrompt];

      expect(
        applyCustodialEstablishmentToResultPrompts(
          promptChoices,
          prompts,
          establishment('HMP Bristol'),
          [cachedPrisonPrompt]
        )
      ).toBe(prompts);
    });

    it('should leave results without a prison prompt untouched', () => {
      const prompts = [dateResultPrompt];

      expect(
        applyCustodialEstablishmentToResultPrompts(
          [dateChoice],
          prompts,
          establishment('HMP Bristol')
        )
      ).toBe(prompts);
    });
  });
});
