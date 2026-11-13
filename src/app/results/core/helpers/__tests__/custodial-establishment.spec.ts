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
