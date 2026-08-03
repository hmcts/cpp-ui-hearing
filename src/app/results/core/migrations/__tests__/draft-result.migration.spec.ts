import { HearingDetail } from '../../../../core';
import { DraftResult, DraftResultWithMetadata } from '../../../results.interfaces';
import { getTargetsForHearing } from '../../helpers';
import { migrateDraftResultToVersion } from '../draft-result';
import { Legacy, V1 } from '../legacy/legacy.interfaces';

jest.mock('../../helpers', () => ({
  ...(jest.requireActual('../../helpers') as any),
  getTargetsForHearing: jest.fn()
}));

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDraftResult(): CustomMatcherResult;
    }
  }
}

describe('Migration – Draft result', () => {
  beforeEach(() => {
    // Custom matcher to assert that there are no orphaned foreign key
    // references in the draft result relations that would cause runtime errors
    // in the UI
    expect.extend({
      toBeValidDraftResult({
        relations,
        resultLines
      }: DraftResultWithMetadata): jest.CustomMatcherResult {
        let pass = true;
        let message = '';

        try {
          for (const relation of relations) {
            if (!resultLines[relation.resultLineId]) {
              throw new Error(`No matching result line found for ${relation.resultLineId}.`);
            }
            for (const childResultLineId of relation.childResultLineIds) {
              if (!resultLines[childResultLineId]) {
                throw new Error(`No matching result line found for ${relation.resultLineId}.`);
              }
            }
          }
        } catch (e) {
          pass = false;
          message = e.toString();
        }

        return {
          message: () => message,
          pass
        };
      }
    });
  });

  const migrate = (
    draftResult: DraftResultWithMetadata | Legacy.DraftResult,
    version: number,
    extras: V1.MigrationFunctionExtras = {
      hearingId: 'hearingId',
      hearingDay: '2020-01-01'
    }
  ) => {
    const isBoxwork = false;
    const firstSharedDate: string = undefined;
    return migrateDraftResultToVersion(draftResult, version, extras, isBoxwork, firstSharedDate);
  };

  it('should resolve immediately when the provided version matches', () => {
    const draftResult: V1.DraftResultWithMetadata = {
      hearingId: '*',
      hearingDay: '2020-01-01',
      relations: [],
      shadowListedOffenceIds: [],
      resultLines: {},
      __metadata__: {
        version: 1
      }
    };
    const migratedDraftResult = migrate(draftResult, 1);

    expect(migratedDraftResult).toBeValidDraftResult();
    expect(migratedDraftResult).toMatchInlineSnapshot(`
      {
        "__metadata__": {
          "version": 1,
        },
        "hearingDay": "2020-01-01",
        "hearingId": "*",
        "relations": [],
        "resultLines": {},
        "shadowListedOffenceIds": [],
      }
    `);
  });

  describe('lastSharedTime', () => {
    it('should write the shared date to the result lines where they are out of sync', () => {
      const draftResult = {
        hearingId: '*',
        hearingDay: '2020-01-01',
        relations: [],
        shadowListedOffenceIds: [],
        resultLines: {
          A: {
            resultLineId: 'A',
            resultDefinitionId: 'resultDefinitionId',
            sharedDate: new Date(2020, 0, 1, 12).toISOString()
          } as V1.ResolvedDraftResultLine
        },
        __metadata__: {
          lastSharedTime: new Date(2020, 0, 1, 13).toISOString(),
          version: 1
        }
      } as DraftResultWithMetadata | Legacy.DraftResult;
      const migratedDraftResult = migrate(draftResult, 1);

      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "lastSharedTime": "2020-01-01T13:00:00.000Z",
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "*",
          "relations": [],
          "resultLines": {
            "A": {
              "resultDefinitionId": "resultDefinitionId",
              "resultLineId": "A",
              "sharedDate": "2020-01-01T13:00:00.000Z",
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should not write the shared date to any shared result lines that are later than the last known shared time', () => {
      const draftResult = {
        hearingId: '*',
        hearingDay: '2020-01-01',
        relations: [],
        shadowListedOffenceIds: [],
        resultLines: {
          A: {
            resultLineId: 'A',
            resultDefinitionId: 'resultDefinitionId',
            sharedDate: new Date(2020, 0, 1, 13).toISOString()
          } as V1.ResolvedDraftResultLine
        },
        __metadata__: {
          lastSharedTime: new Date(2020, 0, 1, 12).toISOString(),
          version: 1
        }
      } as DraftResultWithMetadata | Legacy.DraftResult;
      const migratedDraftResult = migrate(draftResult, 1);

      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "lastSharedTime": "2020-01-01T12:00:00.000Z",
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "*",
          "relations": [],
          "resultLines": {
            "A": {
              "resultDefinitionId": "resultDefinitionId",
              "resultLineId": "A",
              "sharedDate": "2020-01-01T13:00:00.000Z",
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should not write the last shared time to any unresolved result lines', () => {
      const draftResult = {
        hearingId: '*',
        hearingDay: '2020-01-01',
        relations: [],
        shadowListedOffenceIds: [],
        resultLines: {
          A: { resultLineId: 'A' } as V1.UnresolvedDraftResultLine
        },
        __metadata__: {
          lastSharedTime: new Date(2020, 0, 1, 13).toISOString(),
          version: 1
        }
      } as DraftResultWithMetadata | Legacy.DraftResult;
      const migratedDraftResult = migrate(draftResult, 1);

      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "lastSharedTime": "2020-01-01T13:00:00.000Z",
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "*",
          "relations": [],
          "resultLines": {
            "A": {
              "resultLineId": "A",
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });
  });

  describe('hearing integrity', () => {
    it('should discard any targets not found on the hearing', () => {
      const draftResult: V1.DraftResultWithMetadata = {
        hearingId: '*',
        hearingDay: '2020-01-01',
        relations: [
          {
            resultLineId: 'resultLineId1',
            ruleType: 'standalone',
            childResultLineIds: ['resultLineId2']
          },
          {
            resultLineId: 'resultLineId2',
            ruleType: 'oneOf',
            childResultLineIds: []
          },
          {
            resultLineId: 'resultLineId3',
            ruleType: 'standalone',
            childResultLineIds: []
          },
          {
            resultLineId: 'resultLineId4',
            ruleType: 'unknown',
            childResultLineIds: []
          }
        ],
        shadowListedOffenceIds: [],
        resultLines: {
          resultLineId1: {
            applicationId: 'applicationId1',
            resultLineId: 'resultLineId1'
          } as V1.AnyDraftResultLine,
          resultLineId2: {
            applicationId: 'applicationId1',
            resultLineId: 'resultLineId2'
          } as V1.AnyDraftResultLine,
          resultLineId3: {
            offenceId: 'offenceId1',
            resultLineId: 'resultLineId3'
          } as V1.AnyDraftResultLine,
          resultLineId4: {
            offenceId: 'offenceId2',
            resultLineId: 'resultLineId4'
          } as V1.AnyDraftResultLine
        },
        __metadata__: {
          version: 1
        }
      };

      (getTargetsForHearing as jest.Mock).mockReturnValue([{ id: 'offenceId1' }]);

      const migratedDraftResult = migrate(draftResult, 1, {
        hearingDay: '2020-01-01',
        hearingId: 'hearingId',
        hearing: { id: 'hearingId' } as HearingDetail
      });

      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "*",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "resultLineId3",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "resultLineId3": {
              "offenceId": "offenceId1",
              "resultLineId": "resultLineId3",
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });
  });

  describe('legacy migration', () => {
    describe('result prompts', () => {
      const getResultPromptsForOnlyResult = (draftResult: DraftResult) => {
        const resultLine = Object.values(draftResult.resultLines)[0];

        return 'resultPrompts' in resultLine ? resultLine.resultPrompts : null;
      };

      it('should migrate an ADDRESS prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/ADDRESS.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Protected person's address address line 1",
              "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
              "promptRef": "protectedpersonsaddress",
              "type": "ADDRESS",
              "value": [
                {
                  "label": "Protected person's address address line 1",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressAddress1",
                  "type": "TXT",
                  "value": "Address line 1",
                },
                {
                  "label": "Protected person's address address line 2",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressAddress2",
                  "type": "TXT",
                  "value": "Address line 2",
                },
                {
                  "label": "Protected person's address address line 3",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressAddress3",
                  "type": "TXT",
                  "value": "Address line 3",
                },
                {
                  "label": "Protected person's address address line 4",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressAddress4",
                  "type": "TXT",
                  "value": "Address line 4",
                },
                {
                  "label": "Protected person's address address line 5",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressAddress5",
                  "type": "TXT",
                  "value": "Address line 5",
                },
                {
                  "label": "Protected person's address post code",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressPostCode",
                  "type": "TXT",
                  "value": "CR0 1AX",
                },
                {
                  "label": "Protected person's address email address 1",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressEmailAddress1",
                  "type": "TXT",
                  "value": "email1@hmcts.net",
                },
                {
                  "label": "Protected person's address email address 2",
                  "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                  "promptRef": "protectedpersonsaddressEmailAddress2",
                  "type": "TXT",
                  "value": "email2@hmcts.net",
                },
              ],
            },
          ]
        `);
      });

      it('should migrate a BOOLEAN prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/BOOLEAN.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Reserved Judiciary",
              "promptId": "bbc84e23-2543-4211-858f-59ae97800f5a",
              "promptRef": "reservedJudiciary",
              "type": "BOOLEAN",
              "value": true,
            },
          ]
        `);
      });

      it('should migrate a CURR prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/CURR.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Amount of fine",
              "promptId": "7cd1472f-2379-4f5b-9e67-98a43d86e122",
              "promptRef": "AOF",
              "type": "CURR",
              "value": "50",
            },
          ]
        `);
      });

      it('should migrate a DATE prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/DATE.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Start date",
              "promptId": "206a8658-96da-42cb-80a7-ae1c0e440e11",
              "promptRef": "startDate",
              "type": "DATE",
              "value": "2021-10-01",
            },
          ]
        `);
      });

      it('should migrate a DURATION prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/DURATION.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Curfew period",
              "promptId": "82ee7d2f-99b1-476d-8938-2c824549c365",
              "promptRef": "curfewPeriod",
              "type": "DURATION",
              "value": [
                {
                  "label": "Weeks",
                  "promptId": "82ee7d2f-99b1-476d-8938-2c824549c365",
                  "promptRef": "curfewPeriod",
                  "type": "INT",
                  "value": "4",
                  "welshLabel": "Wythnos",
                },
              ],
            },
          ]
        `);
      });

      it('should migrate a DURATION prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/DURATION.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Curfew period",
              "promptId": "82ee7d2f-99b1-476d-8938-2c824549c365",
              "promptRef": "curfewPeriod",
              "type": "DURATION",
              "value": [
                {
                  "label": "Weeks",
                  "promptId": "82ee7d2f-99b1-476d-8938-2c824549c365",
                  "promptRef": "curfewPeriod",
                  "type": "INT",
                  "value": "4",
                  "welshLabel": "Wythnos",
                },
              ],
            },
          ]
        `);
      });

      it('should migrate a FIXL prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/FIXL.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "This order is made on",
              "promptId": "47337f1c-e343-4093-884f-035ba96c4db0",
              "promptRef": "thisOrderIsMadeOn",
              "type": "FIXL",
              "value": "Conviction",
            },
          ]
        `);
      });

      it('should migrate a FIXLM prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/FIXLM.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Countries",
              "promptId": "f77b3b14-91b2-41b7-966b-0f0bad2664e2",
              "promptRef": "countries",
              "type": "FIXLM",
              "value": [
                "Albania",
                "Afghanistan",
              ],
            },
          ]
        `);
      });

      it('should migrate a FIXLOM prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/FIXLOM.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Reason for custody",
              "promptId": "622aa563-a3db-4102-ba7e-21c21cee0110",
              "promptRef": "theReasonsForThis",
              "type": "FIXLOM",
              "value": [
                "the number and nature of the offences shows that the defendant is operating as a professional criminal",
                "an unprovoked attack of a serious nature",
                "other",
                "Blah",
              ],
            },
          ]
        `);
      });

      it('should migrate an HCROOM prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/INT.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Number of sureties",
              "promptId": "5139e711-b645-4b1c-af81-84f5887abdf6",
              "promptRef": "numberOfSureties",
              "type": "INT",
              "value": "27",
            },
          ]
        `);
      });

      it('should migrate an HCROOM prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/HCROOM.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Courtroom",
              "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
              "promptRef": "HCROOM",
              "type": "HCROOM",
              "value": "Courtroom 03",
            },
            {
              "label": "Courtroom",
              "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
              "promptRef": "HCROOM2",
              "type": "HCROOM",
              "value": "Courtroom 01",
            },
          ]
        `);
      });

      it('should migrate a NAMEADRESS prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/NAMEADDRESS01.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Courthouse organisation name",
              "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
              "promptRef": "hCHOUSE",
              "type": "NAMEADDRESS",
              "value": [
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEOrganisationName",
                  "type": "TXT",
                  "value": "Croydon Crown Court",
                },
                {
                  "label": "Courthouse address line 1",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEAddress1",
                  "type": "TXT",
                  "value": "The Law Courts",
                },
                {
                  "label": "Courthouse address line 2",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEAddress2",
                  "type": "TXT",
                  "value": "Altyre Road",
                },
                {
                  "label": "Courthouse address line 3",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEAddress3",
                  "type": "TXT",
                  "value": "Croydon",
                },
                {
                  "label": "Courthouse post code",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEPostCode",
                  "type": "TXT",
                  "value": "CR9 5AB",
                },
                {
                  "label": "Courthouse email address 1",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEEmailAddress1",
                  "type": "TXT",
                  "value": "London.crowncourt@cps.gov.uk",
                },
                {
                  "label": "Courthouse email address 2",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEEmailAddress2",
                  "type": "TXT",
                  "value": "PECSCroydonCombined@serco.com",
                },
              ],
            },
          ]
        `);
      });

      it('should migrate a NAMEADRESS prompt choice with an address type', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/NAMEADDRESS02.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Amount of compensation",
              "promptId": "26985e5b-fe1f-4d7d-a21a-57207c5966e7",
              "promptRef": "AOCOM",
              "type": "CURR",
              "value": "20.00",
            },
            {
              "label": "Major creditor",
              "promptId": "af921cf4-06e7-4f6b-a4ea-dcb58aab0dbe",
              "promptRef": "CREDNAME",
              "type": "ONEOF",
              "value": {
                "label": "Minor creditor",
                "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                "promptRef": "minorcreditornameandaddress",
                "type": "NAMEADDRESS",
                "value": [
                  {
                    "label": "Minor creditor first name",
                    "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                    "promptRef": "minorcreditornameandaddressFirstName",
                    "type": "TXT",
                    "value": "Mynor",
                  },
                  {
                    "label": "Minor creditor last name",
                    "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                    "promptRef": "minorcreditornameandaddressLastName",
                    "type": "TXT",
                    "value": "Krethithor",
                  },
                  {
                    "label": "Minor creditor address line 1",
                    "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                    "promptRef": "minorcreditornameandaddressAddress1",
                    "type": "TXT",
                    "value": "12 Wellesley Drive",
                  },
                  {
                    "label": "Minor creditor post code",
                    "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                    "promptRef": "minorcreditornameandaddressPostCode",
                    "type": "TXT",
                    "value": "CR0 1XG",
                  },
                ],
              },
            },
          ]
        `);
      });

      it('should migrate a NAMEADRESS prompt choice with a legacy HCHOUSE promptRef', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/HCHOUSE.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Courthouse organisation name",
              "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
              "promptRef": "HCHOUSE",
              "type": "NAMEADDRESS",
              "value": [
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEOrganisationName",
                  "type": "TXT",
                  "value": "Westminster Magistrates' Court",
                },
                {
                  "label": "Courthouse address line 1",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEAddress1",
                  "type": "TXT",
                  "value": "181 Marylebone Road",
                },
                {
                  "label": "Courthouse address line 2",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEAddress2",
                  "type": "TXT",
                  "value": "London",
                },
                {
                  "label": "Courthouse post code",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEPostCode",
                  "type": "TXT",
                  "value": "NW1 5BR",
                },
                {
                  "label": "Courthouse email address 1",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEEmailAddress1",
                  "type": "TXT",
                  "value": "London.magistrates@cps.gov.uk",
                },
                {
                  "label": "Courthouse email address 2",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSEEmailAddress2",
                  "type": "TXT",
                  "value": "PECSWestminsterMags@serco.com",
                },
              ],
            },
          ]
        `);
      });

      it('should migrate a ONEOF prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/ONEOF.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "This order lasts until",
              "promptId": "3b0c95d5-9595-4ddd-88b8-1a2e3e70d01f",
              "promptRef": "thisOrderLastsUntil",
              "type": "ONEOF",
              "value": {
                "label": "This order lasts until",
                "promptId": "3b0c95d5-9595-4ddd-88b8-1a2e3e70d01f",
                "promptRef": "thisOrderLastsUntil",
                "type": "DATE",
                "value": "2022-02-01",
              },
            },
          ]
        `);
      });

      it('should migrate a TIME prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/TIME.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Time of hearing",
              "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
              "promptRef": "timeOfHearing",
              "type": "TIME",
              "value": "10:00",
            },
          ]
        `);
      });

      it('should migrate a TXT prompt choice', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/TXT.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`
          [
            {
              "label": "Reason for no costs",
              "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
              "promptRef": "reasonForNoCosts",
              "type": "TXT",
              "value": "ok",
            },
          ]
        `);
      });

      it('should not create result prompts for legacy choices with empty array values', () => {
        const legacyDraftResult = require('./fixtures/legacy/draft-result/prompt-choices/EMPTY.json');
        const migratedDraftResult = migrate(legacyDraftResult, 1);

        expect(getResultPromptsForOnlyResult(migratedDraftResult)).toMatchInlineSnapshot(`[]`);
      });
    });

    it('should migrate to the draft result structure', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/DEFAULT.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "e4e090ae-cd66-467f-80c6-ba56a729df7c",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "e4e090ae-cd66-467f-80c6-ba56a729df7c": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Next hearing in Crown Court",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "NHCCS",
              "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
              "resultLevel": "O",
              "resultLineId": "e4e090ae-cd66-467f-80c6-ba56a729df7c",
              "resultPrompts": [],
              "shortCode": "NHCCS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate a result with a related hearing', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/RELATED.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "1ab60b73-2af1-4ad0-b7f3-9fd300b6b3b5",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "1ab60b73-2af1-4ad0-b7f3-9fd300b6b3b5": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Next hearing in Crown Court",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "NHCCS",
              "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
              "resultLevel": "O",
              "resultLineId": "1ab60b73-2af1-4ad0-b7f3-9fd300b6b3b5",
              "resultPrompts": [
                {
                  "label": "Date and time to be fixed",
                  "promptId": "46257d78-1cbf-42b0-a24b-206826fecfb9",
                  "promptRef": "dateToBeFixed",
                  "type": "ONEOF",
                  "value": {
                    "label": "Fixed Date",
                    "promptId": "aea2ee79-47b4-4023-9a95-1b327e6e03d5",
                    "promptRef": "fixedDate",
                    "type": "DATE",
                    "value": "2022-02-25",
                  },
                },
                {
                  "label": "Time of hearing",
                  "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
                  "promptRef": "timeOfHearing",
                  "type": "TIME",
                  "value": "00:00",
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Lavender Hill Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "176A Lavender Hill",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "London",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW11 1JU",
                    },
                  ],
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Sentence",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Minutes",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "promptRef": "HEST",
                      "type": "INT",
                      "value": 60,
                    },
                  ],
                },
                {
                  "label": "Remand Status",
                  "promptId": "9403f0d7-90b5-4377-84b4-f06a77811362",
                  "promptRef": "remandStatus",
                  "type": "FIXL",
                  "value": "Remand in Custody",
                },
                {
                  "label": "Existing Hearing Id",
                  "promptId": "a0ec3e68-5210-422f-9959-73c1c7ce495a",
                  "promptRef": "existingHearingId",
                  "type": "HIDDEN",
                  "value": "96c17188-81db-4cd0-adbd-623bf9264a3e",
                },
              ],
              "shortCode": "NHCCS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate a result with a scheduled hearing slot', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/HEARINGSLOT.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "1121652a-d75d-4d5f-86ff-0d7bd2516c6e",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "1121652a-d75d-4d5f-86ff-0d7bd2516c6e": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Next hearing in magistrates' court",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "NHMC",
              "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
              "resultLevel": "O",
              "resultLineId": "1121652a-d75d-4d5f-86ff-0d7bd2516c6e",
              "resultPrompts": [
                {
                  "label": "Date of hearing",
                  "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
                  "promptRef": "HDATE",
                  "type": "DATE",
                  "value": "2021-05-06",
                },
                {
                  "label": "Time of hearing",
                  "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
                  "promptRef": "timeOfHearing",
                  "type": "TIME",
                  "value": "14:00",
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Lavender Hill Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "176A Lavender Hill",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "London",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW11 1JU",
                    },
                  ],
                },
                {
                  "label": "Courtroom",
                  "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
                  "promptRef": "HCROOM",
                  "type": "HCROOM",
                  "value": "Courtroom 01",
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Plea and Trial Preparation",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "MINUTES",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "value": 20,
                    },
                  ],
                },
                {
                  "label": "Booking reference",
                  "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
                  "promptRef": "bookingReference",
                  "type": "HIDDEN",
                  "value": "815ea140-6dbf-42ec-af37-cc193187493e",
                },
              ],
              "shortCode": "NHMC",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate the relations of optional and mandatory child result lines', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/CHILDREN.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "409fb2e1-0713-4555-990a-a0d6751034a6",
                "728635a8-221c-4ebd-bf36-5a2572efddbf",
              ],
              "resultLineId": "8b9a5a3a-4512-4c51-80e8-7d2e5269850b",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "409fb2e1-0713-4555-990a-a0d6751034a6",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "728635a8-221c-4ebd-bf36-5a2572efddbf",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "409fb2e1-0713-4555-990a-a0d6751034a6": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Total custodial period",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "timp",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "409fb2e1-0713-4555-990a-a0d6751034a6",
              "resultPrompts": [],
              "shortCode": "timp",
              "unresolvedParts": [],
              "valid": false,
            },
            "728635a8-221c-4ebd-bf36-5a2572efddbf": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Risk or vulnerability factors",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "vulnerability",
              "resultDefinitionId": "66105417-41c8-420d-820f-40b61b507442",
              "resultLevel": "D",
              "resultLineId": "728635a8-221c-4ebd-bf36-5a2572efddbf",
              "resultPrompts": [],
              "shortCode": "vulnerability",
              "unresolvedParts": [],
              "valid": true,
            },
            "8b9a5a3a-4512-4c51-80e8-7d2e5269850b": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Imprisonment",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "IMP",
              "resultDefinitionId": "abb95a52-2a75-40c3-8d3f-a1d75a199c47",
              "resultLevel": "O",
              "resultLineId": "8b9a5a3a-4512-4c51-80e8-7d2e5269850b",
              "resultPrompts": [],
              "shortCode": "IMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate the relations of a oneOf child result line', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/ONEOF.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "9c07e49e-ccb0-4f74-887a-2add8a4c84f9",
              ],
              "resultLineId": "f4622e1f-4c9a-45fe-94c2-b024e1cc01f1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "9c07e49e-ccb0-4f74-887a-2add8a4c84f9",
              "ruleType": "oneOf",
            },
          ],
          "resultLines": {
            "9c07e49e-ccb0-4f74-887a-2add8a4c84f9": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Next hearing in magistrates' court",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "nhmc",
              "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
              "resultLevel": "O",
              "resultLineId": "9c07e49e-ccb0-4f74-887a-2add8a4c84f9",
              "resultPrompts": [],
              "shortCode": "nhmc",
              "unresolvedParts": [],
              "valid": false,
            },
            "f4622e1f-4c9a-45fe-94c2-b024e1cc01f1": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Next hearing",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "NEXH",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "f4622e1f-4c9a-45fe-94c2-b024e1cc01f1",
              "resultPrompts": [],
              "shortCode": "NEXH",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate the relations of an atleastOneOf child result line', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/ATLEASTONEOF.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "d97a80ae-9023-454c-8545-9ed8fc43bc34",
              ],
              "resultLineId": "08c94782-b88d-452d-82a1-229cfd131c53",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "d97a80ae-9023-454c-8545-9ed8fc43bc34",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "08c94782-b88d-452d-82a1-229cfd131c53": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Bail conditions",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "BAIC",
              "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
              "resultLevel": "O",
              "resultLineId": "08c94782-b88d-452d-82a1-229cfd131c53",
              "resultPrompts": [],
              "shortCode": "BAIC",
              "unresolvedParts": [],
              "valid": true,
            },
            "d97a80ae-9023-454c-8545-9ed8fc43bc34": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "Exclusion - not to sit in the front seat of any motor vehicle",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "pore10",
              "resultDefinitionId": "3c98b287-fd01-471a-ac34-e0a56d9e95c2",
              "resultLevel": "O",
              "resultLineId": "d97a80ae-9023-454c-8545-9ed8fc43bc34",
              "resultPrompts": [],
              "shortCode": "pore10",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate an unresolved result', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/UNRESOLVED.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "9976327d-1dbc-454d-beb5-a27584936c60",
              "ruleType": "unknown",
            },
          ],
          "resultLines": {
            "9976327d-1dbc-454d-beb5-a27584936c60": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "X",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "X",
              "resultLineId": "9976327d-1dbc-454d-beb5-a27584936c60",
              "resultPrompts": [],
              "unresolvedParts": [
                {
                  "originalText": "X",
                  "resultPrompts": [],
                  "type": "TXT",
                  "value": "X",
                },
              ],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate a result with unresolved parts', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/PARTS.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "2ce84bf6-33df-4f89-8dc7-2539ebeaf044",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "2ce84bf6-33df-4f89-8dc7-2539ebeaf044": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "No order for costs",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "NCOSTS 50 100",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "2ce84bf6-33df-4f89-8dc7-2539ebeaf044",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [
                {
                  "resultPrompts": [],
                  "type": "INT",
                  "value": "50",
                },
                {
                  "resultPrompts": [],
                  "type": "INT",
                  "value": "100",
                },
              ],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should correctly annotate the valid flag for incomplete prompts', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/INVALID.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "f6f0dc7e-7387-483a-8ad5-adb0e89b519f",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "f6f0dc7e-7387-483a-8ad5-adb0e89b519f": {
              "caseId": "4cb0fa01-ccbe-4b03-816d-0f77af4f26ec",
              "defendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "label": "No order for costs",
              "masterDefendantId": "8205aff0-164d-4e76-a865-3f302a9a78b4",
              "offenceId": "5b786b6a-402e-47d2-b943-b9ebeb1cdf7d",
              "orderedDate": "2021-05-18",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "f6f0dc7e-7387-483a-8ad5-adb0e89b519f",
              "resultPrompts": [
                {
                  "label": "Reason for no costs",
                  "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "promptRef": "reasonForNoCosts",
                  "type": "TXT",
                  "value": "x",
                },
              ],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate a result with an unknown conditional mandatory result', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/CONDMAN01.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "58a9dd5c-cf3b-479e-966c-8b87856c2f4e",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "58a9dd5c-cf3b-479e-966c-8b87856c2f4e": {
              "caseId": "5ec2d372-33ca-46f4-9498-d64707f77125",
              "defendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "label": "Is the passport to be surrendered to Police?",
              "masterDefendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "offenceId": "92a1b7aa-7470-4b61-b7a9-2091925f0633",
              "orderedDate": "2021-05-12",
              "originalText": "PASSPP",
              "resultDefinitionId": "4b80a15f-076f-4247-8f3c-44ce3eb2348d",
              "resultLevel": "O",
              "resultLineId": "58a9dd5c-cf3b-479e-966c-8b87856c2f4e",
              "resultPrompts": [],
              "shortCode": "PASSPP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate a result with a selected conditional mandatory result', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/CONDMAN02.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "1ed140dc-c0f5-40fb-bee9-915927b69e61",
              ],
              "resultLineId": "58a9dd5c-cf3b-479e-966c-8b87856c2f4e",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "1ed140dc-c0f5-40fb-bee9-915927b69e61",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "1ed140dc-c0f5-40fb-bee9-915927b69e61": {
              "caseId": "5ec2d372-33ca-46f4-9498-d64707f77125",
              "defendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "label": "Passport surrender",
              "masterDefendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "offenceId": "92a1b7aa-7470-4b61-b7a9-2091925f0633",
              "orderedDate": "2021-05-12",
              "originalText": "passs",
              "resultDefinitionId": "4b5a2d33-5121-4d09-a8f1-49c7beb2994c",
              "resultLevel": "O",
              "resultLineId": "1ed140dc-c0f5-40fb-bee9-915927b69e61",
              "resultPrompts": [],
              "shortCode": "passs",
              "unresolvedParts": [],
              "valid": false,
            },
            "58a9dd5c-cf3b-479e-966c-8b87856c2f4e": {
              "caseId": "5ec2d372-33ca-46f4-9498-d64707f77125",
              "defendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "label": "Is the passport to be surrendered to Police?",
              "masterDefendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "offenceId": "92a1b7aa-7470-4b61-b7a9-2091925f0633",
              "orderedDate": "2021-05-12",
              "originalText": "PASSPP",
              "resultDefinitionId": "4b80a15f-076f-4247-8f3c-44ce3eb2348d",
              "resultLevel": "O",
              "resultLineId": "58a9dd5c-cf3b-479e-966c-8b87856c2f4e",
              "resultPrompts": [],
              "shortCode": "PASSPP",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate a result with a declined conditional mandatory result', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/CONDMAN03.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "58a9dd5c-cf3b-479e-966c-8b87856c2f4e",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "58a9dd5c-cf3b-479e-966c-8b87856c2f4e": {
              "caseId": "5ec2d372-33ca-46f4-9498-d64707f77125",
              "defendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "label": "Is the passport to be surrendered to Police?",
              "masterDefendantId": "5e24c7fd-bb1e-44b5-8138-040ca9c4c4ef",
              "offenceId": "92a1b7aa-7470-4b61-b7a9-2091925f0633",
              "orderedDate": "2021-05-12",
              "originalText": "PASSPP",
              "resultDefinitionId": "4b80a15f-076f-4247-8f3c-44ce3eb2348d",
              "resultLevel": "O",
              "resultLineId": "58a9dd5c-cf3b-479e-966c-8b87856c2f4e",
              "resultPrompts": [],
              "shortCode": "PASSPP",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should handle migrate a deeply nested result with conditional mandatory children', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/CONDMAN04.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "6acb52b1-2512-455f-94e3-04942167863a",
                "b4699395-aaae-45bf-bf71-7ee4b87314f3",
              ],
              "resultLineId": "2117592d-6e6c-46dd-8cba-386ac504f086",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "a1143f32-d0d0-412b-9918-392f300a7faf",
              ],
              "resultLineId": "6acb52b1-2512-455f-94e3-04942167863a",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "a1143f32-d0d0-412b-9918-392f300a7faf",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "b4699395-aaae-45bf-bf71-7ee4b87314f3",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "2117592d-6e6c-46dd-8cba-386ac504f086": {
              "caseId": "fb146f22-c25b-4fb0-a1bd-a957b59377ee",
              "defendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "label": "Driving Disq - Reduction for course (discretionary)",
              "masterDefendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "offenceId": "abdcaaee-e09e-4407-b0f6-a5918ec47e43",
              "orderedDate": "2021-08-13",
              "originalText": "DDRCD",
              "resultDefinitionId": "90ef1e35-b19a-4ad9-a4e1-e511e9d1d00e",
              "resultLevel": "O",
              "resultLineId": "2117592d-6e6c-46dd-8cba-386ac504f086",
              "resultPrompts": [
                {
                  "label": "Defendant driving licence number",
                  "promptId": "a593ae4a-9d69-45b9-9585-c11aeed28404",
                  "promptRef": "defendantDrivingLicenceNumber",
                  "type": "TXT",
                  "value": "DAREC709136TC8GZ",
                },
                {
                  "label": "Name of course organisation name",
                  "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                  "promptRef": "nameofcourse",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Name of course organisation name",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcourseOrganisationName",
                      "type": "TXT",
                      "value": "ISM Psychological Services Ltd.",
                    },
                    {
                      "label": "Name of course address line 1",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcourseAddress1",
                      "type": "TXT",
                      "value": "Ramsay House",
                    },
                    {
                      "label": "Name of course address line 2",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcourseAddress2",
                      "type": "TXT",
                      "value": "Fairbairn Place",
                    },
                    {
                      "label": "Name of course address line 3",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcourseAddress3",
                      "type": "TXT",
                      "value": "Livingston Village",
                    },
                    {
                      "label": "Name of course address line 4",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcourseAddress4",
                      "type": "TXT",
                      "value": "Livingston",
                    },
                    {
                      "label": "Name of course post code",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcoursePostCode",
                      "type": "TXT",
                      "value": "EH54 6TN",
                    },
                    {
                      "label": "Name of course email address 1",
                      "promptId": "7326f05d-54b3-450e-92dd-a5bc0710f8f7",
                      "promptRef": "nameofcourseEmailAddress1",
                      "type": "TXT",
                      "value": "referral.ddrs@ismpsych.cjsm.net",
                    },
                  ],
                },
                {
                  "label": "Date by which course must be completed",
                  "promptId": "286cc674-a4f8-408e-aa6d-8dbc175ab968",
                  "promptRef": "dateByWhichCourseMustBeCompleted",
                  "type": "DATE",
                  "value": "2022-06-30",
                },
                {
                  "label": "Disqualification period",
                  "promptId": "2bf54447-328c-4c1b-a123-341adbd52172",
                  "promptRef": "disqualificationPeriod",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Months",
                      "promptId": "2bf54447-328c-4c1b-a123-341adbd52172",
                      "promptRef": "disqualificationPeriod",
                      "type": "INT",
                      "value": "6",
                      "welshLabel": "Mis",
                    },
                  ],
                },
                {
                  "label": "Disqualification reduction period",
                  "promptId": "7b36c6fc-eb8e-4651-b88b-944843741c7c",
                  "promptRef": "disqualificationReductionPeriod",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Days",
                      "promptId": "7b36c6fc-eb8e-4651-b88b-944843741c7c",
                      "promptRef": "disqualificationReductionPeriod",
                      "type": "INT",
                      "value": "30",
                      "welshLabel": "Niwrnod",
                    },
                  ],
                },
                {
                  "label": "Defendant's home telephone number",
                  "promptId": "e2ae845f-12f4-498e-bddf-a90c8cb499ba",
                  "promptRef": "defendantsHomeTelephoneNumber",
                  "type": "INT",
                  "value": "802-343-4047",
                },
              ],
              "shortCode": "DDRCD",
              "unresolvedParts": [],
              "valid": true,
            },
            "6acb52b1-2512-455f-94e3-04942167863a": {
              "caseId": "fb146f22-c25b-4fb0-a1bd-a957b59377ee",
              "defendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "label": "Licence produced in court",
              "masterDefendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "offenceId": "abdcaaee-e09e-4407-b0f6-a5918ec47e43",
              "orderedDate": "2021-08-13",
              "originalText": "lpc",
              "resultDefinitionId": "ea1ee5a4-be13-48dc-8411-78f22e01c236",
              "resultLevel": "O",
              "resultLineId": "6acb52b1-2512-455f-94e3-04942167863a",
              "resultPrompts": [],
              "shortCode": "lpc",
              "unresolvedParts": [],
              "valid": true,
            },
            "a1143f32-d0d0-412b-9918-392f300a7faf": {
              "caseId": "fb146f22-c25b-4fb0-a1bd-a957b59377ee",
              "defendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "label": "1: Prov DVLA produced",
              "masterDefendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "offenceId": "abdcaaee-e09e-4407-b0f6-a5918ec47e43",
              "orderedDate": "2021-08-13",
              "originalText": "prov",
              "resultDefinitionId": "4b850aa9-984c-4a15-a1ae-b2f861cfcbe8",
              "resultLevel": "O",
              "resultLineId": "a1143f32-d0d0-412b-9918-392f300a7faf",
              "resultPrompts": [
                {
                  "label": "Licence issue number",
                  "promptId": "11a939b1-71e6-4065-8c29-007e4b52da7a",
                  "promptRef": "licenceIssueNumber",
                  "type": "INT",
                  "value": "115",
                },
              ],
              "shortCode": "prov",
              "unresolvedParts": [],
              "valid": true,
            },
            "b4699395-aaae-45bf-bf71-7ee4b87314f3": {
              "caseId": "fb146f22-c25b-4fb0-a1bd-a957b59377ee",
              "defendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "label": "Was there an interim disqualification?",
              "masterDefendantId": "31c2a7f2-9c6a-484a-b17a-d891a5491cb7",
              "offenceId": "abdcaaee-e09e-4407-b0f6-a5918ec47e43",
              "orderedDate": "2021-08-13",
              "originalText": "intd",
              "resultDefinitionId": "429fb553-4fb3-45eb-a700-7e5e69d1ca29",
              "resultLevel": "O",
              "resultLineId": "b4699395-aaae-45bf-bf71-7ee4b87314f3",
              "resultPrompts": [],
              "shortCode": "intd",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate results deleted via amendments', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/DELETED01.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "5370e08d-941b-4558-ba1b-cd3858dbbd59",
                "e4946965-9878-4a52-8b4c-3a2c906c7b12",
              ],
              "resultLineId": "0c69721e-0706-47ee-b207-534c647b8ae6",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "478ffbda-c204-4fbf-96a5-e43527830a0c",
              ],
              "resultLineId": "5370e08d-941b-4558-ba1b-cd3858dbbd59",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "478ffbda-c204-4fbf-96a5-e43527830a0c",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [
                "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36",
              ],
              "resultLineId": "e4946965-9878-4a52-8b4c-3a2c906c7b12",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "e4c16159-86fa-4699-8c5f-0bc4abbc4d8c",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "0c69721e-0706-47ee-b207-534c647b8ae6": {
              "amendmentDate": "2021-05-21T01:40:51.499Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Adjournment",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "A",
              "resultDefinitionId": "d278650c-e429-11e8-9f32-f2801f1b9fd1",
              "resultLevel": "O",
              "resultLineId": "0c69721e-0706-47ee-b207-534c647b8ae6",
              "resultPrompts": [
                {
                  "label": "Defendant to attend the next hearing",
                  "promptId": "61f951c3-f18d-4a44-ae4a-0cad4efb4133",
                  "promptRef": "defendantToAttendTheNextHearing",
                  "type": "ONEOF",
                  "value": {
                    "label": "Defendant to attend the next hearing",
                    "promptId": "61f951c3-f18d-4a44-ae4a-0cad4efb4133",
                    "promptRef": "defendantToAttendTheNextHearing",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
              ],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "A",
              "unresolvedParts": [],
              "valid": true,
            },
            "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36": {
              "amendmentDate": "2021-05-21T01:40:51.499Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Insufficient court time to hear the case",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "insuf",
              "resultDefinitionId": "a1f2e6d7-7a21-41f8-9a9a-854b25a606d4",
              "resultLevel": "O",
              "resultLineId": "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36",
              "resultPrompts": [],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "insuf",
              "unresolvedParts": [],
              "valid": true,
            },
            "478ffbda-c204-4fbf-96a5-e43527830a0c": {
              "amendmentDate": "2021-05-21T01:40:51.499Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Next hearing in Crown Court",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "nhccs",
              "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
              "resultLevel": "O",
              "resultLineId": "478ffbda-c204-4fbf-96a5-e43527830a0c",
              "resultPrompts": [
                {
                  "label": "Date and time to be fixed",
                  "promptId": "46257d78-1cbf-42b0-a24b-206826fecfb9",
                  "promptRef": "dateToBeFixed",
                  "type": "ONEOF",
                  "value": {
                    "label": "Fixed Date",
                    "promptId": "aea2ee79-47b4-4023-9a95-1b327e6e03d5",
                    "promptRef": "fixedDate",
                    "type": "DATE",
                    "value": "2021-05-13",
                  },
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Lavender Hill Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "176A Lavender Hill",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "London",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW11 1JU",
                    },
                    {
                      "label": "Courthouse email address 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEEmailAddress1",
                      "type": "TXT",
                      "value": "London.magistrates@cps.gov.uk",
                    },
                    {
                      "label": "Courthouse email address 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEEmailAddress2",
                      "type": "TXT",
                      "value": "periodicwarrants@geoamey.co.uk",
                    },
                  ],
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Application (Ex Parte)",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Hours",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "promptRef": "HEST",
                      "type": "INT",
                      "value": "1",
                    },
                  ],
                },
                {
                  "label": "Remand Status",
                  "promptId": "9403f0d7-90b5-4377-84b4-f06a77811362",
                  "promptRef": "remandStatus",
                  "type": "FIXL",
                  "value": "Defendant not Present",
                },
              ],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "nhccs",
              "unresolvedParts": [],
              "valid": true,
            },
            "5370e08d-941b-4558-ba1b-cd3858dbbd59": {
              "amendmentDate": "2021-05-21T01:40:51.499Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Next hearing",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "nexh",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "5370e08d-941b-4558-ba1b-cd3858dbbd59",
              "resultPrompts": [],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "nexh",
              "unresolvedParts": [],
              "valid": true,
            },
            "e4946965-9878-4a52-8b4c-3a2c906c7b12": {
              "amendmentDate": "2021-05-21T01:40:51.499Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Adjournment reasons",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "adjr",
              "resultDefinitionId": "7fc17a01-2f5a-4433-aae9-28e0c959f73b",
              "resultLevel": "O",
              "resultLineId": "e4946965-9878-4a52-8b4c-3a2c906c7b12",
              "resultPrompts": [],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "adjr",
              "unresolvedParts": [],
              "valid": true,
            },
            "e4c16159-86fa-4699-8c5f-0bc4abbc4d8c": {
              "amendmentDate": "2021-05-21T01:40:59.774Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "label": "Total custodial period",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "e4c16159-86fa-4699-8c5f-0bc4abbc4d8c",
              "resultPrompts": [
                {
                  "label": "Total custodial period",
                  "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
                  "promptRef": "totalCustodialPeriod",
                  "type": "ONEOF",
                  "value": {
                    "label": "Total custodial period is life",
                    "promptId": "9dbe839c-3804-4c47-bf9e-5be6f9b9b3bb",
                    "promptRef": "totalCustodialPeriodIsLife",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
                {
                  "label": "Prison organisation name",
                  "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                  "promptRef": "prison",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Prison organisation name",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonOrganisationName",
                      "type": "TXT",
                      "value": "HMP/YOI Pentonville",
                    },
                    {
                      "label": "Prison email address 1",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonEmailAddress1",
                      "type": "TXT",
                      "value": "Warrants.pentonville@justice.gov.uk",
                    },
                    {
                      "label": "Prison email address 2",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonEmailAddress2",
                      "type": "TXT",
                      "value": "Reception.Pentonville@justice.gov.uk",
                    },
                  ],
                },
                {
                  "label": "Conveyor / custodian name organisation name",
                  "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                  "promptRef": "conveyorcustodianname",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Conveyor / custodian name organisation name",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameOrganisationName",
                      "type": "TXT",
                      "value": "asd",
                    },
                    {
                      "label": "Conveyor / custodian name email address 1",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameEmailAddress1",
                      "type": "TXT",
                      "value": "asd@asda.co.uk",
                    },
                  ],
                },
                {
                  "label": "Probation team to be notified organisation name",
                  "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                  "promptRef": "probationteamtobenotified",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Probation team to be notified organisation name",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedOrganisationName",
                      "type": "TXT",
                      "value": "asdasd",
                    },
                    {
                      "label": "Probation team to be notified email address 1",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedEmailAddress1",
                      "type": "TXT",
                      "value": "asd@asda.co.uk",
                    },
                  ],
                },
              ],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate deleted results already reshared', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/DELETED02.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "27f03296-1009-4db6-8096-a9964127d7b2",
                "67693b3d-98b6-4e6c-9f64-832b9ffbae7a",
              ],
              "resultLineId": "6a4e44d1-9718-41cb-a906-a52cb5642afe",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "eea3492e-f740-4155-af02-2892a5104e0a",
                "8853b6b1-2a4d-4263-b67b-7395ac5c0f12",
              ],
              "resultLineId": "27f03296-1009-4db6-8096-a9964127d7b2",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "eea3492e-f740-4155-af02-2892a5104e0a",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "8853b6b1-2a4d-4263-b67b-7395ac5c0f12",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [
                "f53d97b0-d89c-4a95-aa68-b91ab7b3cce2",
                "3adbfc7a-56a1-48f2-b5eb-d4c4cefe30b8",
              ],
              "resultLineId": "67693b3d-98b6-4e6c-9f64-832b9ffbae7a",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "f53d97b0-d89c-4a95-aa68-b91ab7b3cce2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "3adbfc7a-56a1-48f2-b5eb-d4c4cefe30b8",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "27f03296-1009-4db6-8096-a9964127d7b2": {
              "amendmentDate": "2021-10-03T17:00:09.316Z",
              "amendmentReason": {
                "id": "a02018a1-915c-3343-95ad-abc5f99b339a",
                "reasonDescription": "Error or Omission in result announced in court (Amendment under the Slip rule)",
              },
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "label": "Next hearing",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "nexh",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "27f03296-1009-4db6-8096-a9964127d7b2",
              "resultPrompts": [],
              "sharedDate": "2021-10-03T17:00:09.316Z",
              "shortCode": "nexh",
              "unresolvedParts": [],
              "valid": true,
            },
            "3adbfc7a-56a1-48f2-b5eb-d4c4cefe30b8": {
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "label": "To attend or a warrant to issue",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "awi",
              "resultDefinitionId": "69ff04d5-84e8-4a61-8478-82c2999c1969",
              "resultLevel": "O",
              "resultLineId": "3adbfc7a-56a1-48f2-b5eb-d4c4cefe30b8",
              "resultPrompts": [],
              "sharedDate": "2021-10-03T00:00:00.000Z",
              "shortCode": "awi",
              "unresolvedParts": [],
              "valid": true,
            },
            "67693b3d-98b6-4e6c-9f64-832b9ffbae7a": {
              "amendmentDate": "2021-10-03T17:00:09.316Z",
              "amendmentReason": {
                "id": "a02018a1-915c-3343-95ad-abc5f99b339a",
                "reasonDescription": "Error or Omission in result announced in court (Amendment under the Slip rule)",
              },
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "label": "Adjournment reasons",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "adjr",
              "resultDefinitionId": "7fc17a01-2f5a-4433-aae9-28e0c959f73b",
              "resultLevel": "O",
              "resultLineId": "67693b3d-98b6-4e6c-9f64-832b9ffbae7a",
              "resultPrompts": [],
              "sharedDate": "2021-10-03T17:00:09.316Z",
              "shortCode": "adjr",
              "unresolvedParts": [],
              "valid": true,
            },
            "6a4e44d1-9718-41cb-a906-a52cb5642afe": {
              "amendmentDate": "2021-10-03T17:00:09.316Z",
              "amendmentReason": {
                "id": "a02018a1-915c-3343-95ad-abc5f99b339a",
                "reasonDescription": "Error or Omission in result announced in court (Amendment under the Slip rule)",
              },
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "label": "Adjournment",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "a",
              "resultDefinitionId": "d278650c-e429-11e8-9f32-f2801f1b9fd1",
              "resultLevel": "O",
              "resultLineId": "6a4e44d1-9718-41cb-a906-a52cb5642afe",
              "resultPrompts": [
                {
                  "label": "Defendant to attend the next hearing",
                  "promptId": "61f951c3-f18d-4a44-ae4a-0cad4efb4133",
                  "promptRef": "defendantToAttendTheNextHearing",
                  "type": "ONEOF",
                  "value": {
                    "label": "Defendant to attend the next hearing",
                    "promptId": "61f951c3-f18d-4a44-ae4a-0cad4efb4133",
                    "promptRef": "defendantToAttendTheNextHearing",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
              ],
              "sharedDate": "2021-10-03T17:00:09.316Z",
              "shortCode": "a",
              "unresolvedParts": [],
              "valid": true,
            },
            "8853b6b1-2a4d-4263-b67b-7395ac5c0f12": {
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "label": "Next hearing in Crown Court",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "nhccs",
              "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
              "resultLevel": "O",
              "resultLineId": "8853b6b1-2a4d-4263-b67b-7395ac5c0f12",
              "resultPrompts": [
                {
                  "label": "Date and time to be fixed",
                  "promptId": "46257d78-1cbf-42b0-a24b-206826fecfb9",
                  "promptRef": "dateToBeFixed",
                  "type": "ONEOF",
                  "value": {
                    "label": "Fixed Date",
                    "promptId": "aea2ee79-47b4-4023-9a95-1b327e6e03d5",
                    "promptRef": "fixedDate",
                    "type": "DATE",
                    "value": "2021-10-22",
                  },
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Derby Crown Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "Derby Combined Court Centre",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "Morledge",
                    },
                    {
                      "label": "Courthouse address line 3",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress3",
                      "type": "TXT",
                      "value": "Derby",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "DE1 2XE",
                    },
                    {
                      "label": "Courthouse email address 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEEmailAddress1",
                      "type": "TXT",
                      "value": "EMCorrespondence@cps.gov.uk",
                    },
                    {
                      "label": "Courthouse email address 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEEmailAddress2",
                      "type": "TXT",
                      "value": "derbycc@geoamey.co.uk",
                    },
                  ],
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Plea and Trial Preparation",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Hours",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "promptRef": "HEST",
                      "type": "INT",
                      "value": "3",
                    },
                  ],
                },
                {
                  "label": "Remand Status",
                  "promptId": "9403f0d7-90b5-4377-84b4-f06a77811362",
                  "promptRef": "remandStatus",
                  "type": "FIXL",
                  "value": "Defendant not Present",
                },
              ],
              "sharedDate": "2021-10-03T00:00:00.000Z",
              "shortCode": "nhccs",
              "unresolvedParts": [],
              "valid": true,
            },
            "eea3492e-f740-4155-af02-2892a5104e0a": {
              "amendmentDate": "2021-10-03T17:00:09.316Z",
              "amendmentReason": {
                "id": "a02018a1-915c-3343-95ad-abc5f99b339a",
                "reasonDescription": "Error or Omission in result announced in court (Amendment under the Slip rule)",
              },
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "deleted": true,
              "label": "Next hearing in magistrates' court",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "nhmc",
              "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
              "resultLevel": "O",
              "resultLineId": "eea3492e-f740-4155-af02-2892a5104e0a",
              "resultPrompts": [
                {
                  "label": "Date of hearing",
                  "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
                  "promptRef": "HDATE",
                  "type": "DATE",
                  "value": "2021-10-06",
                },
                {
                  "label": "Time of hearing",
                  "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
                  "promptRef": "timeOfHearing",
                  "type": "TIME",
                  "value": "10:00",
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Wimbledon Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "The Law Courts",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "Alexandra Road",
                    },
                    {
                      "label": "Courthouse address line 3",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress3",
                      "type": "TXT",
                      "value": "Wimbledon",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW19 7JP",
                    },
                  ],
                },
                {
                  "label": "Courtroom",
                  "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
                  "promptRef": "HCROOM",
                  "type": "HCROOM",
                  "value": "Courtroom 05",
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Review",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "MINUTES",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "value": 20,
                    },
                  ],
                },
                {
                  "label": "Booking reference",
                  "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
                  "promptRef": "bookingReference",
                  "type": "HIDDEN",
                  "value": "f6083f97-6a9c-45ec-b7d2-4e8aa2ffce37",
                },
              ],
              "sharedDate": "2021-10-03T17:00:09.316Z",
              "shortCode": "nhmc",
              "unresolvedParts": [],
              "valid": true,
            },
            "f53d97b0-d89c-4a95-aa68-b91ab7b3cce2": {
              "amendmentDate": "2021-10-03T17:00:09.316Z",
              "amendmentReason": {
                "id": "a02018a1-915c-3343-95ad-abc5f99b339a",
                "reasonDescription": "Error or Omission in result announced in court (Amendment under the Slip rule)",
              },
              "caseId": "df454229-6c3e-49fe-9858-b5f551e3e589",
              "defendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "label": "Insufficient court time to hear the case",
              "masterDefendantId": "9c0a1295-7318-4b29-a89e-560ea4de773b",
              "offenceId": "048fbf8e-6810-442d-8887-0434a8561a99",
              "orderedDate": "2021-10-03",
              "originalText": "insuf",
              "resultDefinitionId": "a1f2e6d7-7a21-41f8-9a9a-854b25a606d4",
              "resultLevel": "O",
              "resultLineId": "f53d97b0-d89c-4a95-aa68-b91ab7b3cce2",
              "resultPrompts": [],
              "sharedDate": "2021-10-03T17:00:09.316Z",
              "shortCode": "insuf",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate deleted child results of non-deleted parents', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/DELETED03.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "e826cf6a-9f64-465a-a566-e36adad3de69",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8",
                "031af84a-da7e-42e0-b882-7c900fdf48a9",
                "d30116fb-a6aa-446e-b4fa-d1c139bf958d",
                "d5e976b3-2144-4b2b-9d8d-f388b1804313",
              ],
              "resultLineId": "a2d51fa2-1f7a-4b24-a0ca-2edff3c703e4",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "012a32fa-7870-4876-8762-00eb1a49f1c2",
              ],
              "resultLineId": "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "012a32fa-7870-4876-8762-00eb1a49f1c2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "7848828d-ad47-4083-adcc-6db75202ffd5",
              ],
              "resultLineId": "031af84a-da7e-42e0-b882-7c900fdf48a9",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "7848828d-ad47-4083-adcc-6db75202ffd5",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [
                "1ded518e-ab4d-4a5d-a5b7-920e393286e0",
                "fe599c9d-d672-493c-a0cd-fb0ea23126c7",
              ],
              "resultLineId": "d30116fb-a6aa-446e-b4fa-d1c139bf958d",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "1ded518e-ab4d-4a5d-a5b7-920e393286e0",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "fe599c9d-d672-493c-a0cd-fb0ea23126c7",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "6480ca61-273b-4dee-8cde-4c60241e2188",
              ],
              "resultLineId": "d5e976b3-2144-4b2b-9d8d-f388b1804313",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "6480ca61-273b-4dee-8cde-4c60241e2188",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "012a32fa-7870-4876-8762-00eb1a49f1c2": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "For the trial to take place",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "trial",
              "resultDefinitionId": "4958de15-8a0a-4d2b-9f7e-56e037cf03da",
              "resultLevel": "O",
              "resultLineId": "012a32fa-7870-4876-8762-00eb1a49f1c2",
              "resultPrompts": [],
              "shortCode": "trial",
              "unresolvedParts": [],
              "valid": true,
            },
            "031af84a-da7e-42e0-b882-7c900fdf48a9": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Next hearing",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "nexh",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "031af84a-da7e-42e0-b882-7c900fdf48a9",
              "resultPrompts": [],
              "shortCode": "nexh",
              "unresolvedParts": [],
              "valid": true,
            },
            "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Adjournment reasons",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "adjr",
              "resultDefinitionId": "7fc17a01-2f5a-4433-aae9-28e0c959f73b",
              "resultLevel": "O",
              "resultLineId": "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8",
              "resultPrompts": [],
              "shortCode": "adjr",
              "unresolvedParts": [],
              "valid": true,
            },
            "1ded518e-ab4d-4a5d-a5b7-920e393286e0": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Exclusion - not to enter a place",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "pore5",
              "resultDefinitionId": "c1d490ed-1754-43b8-a485-fdab1a25f8cb",
              "resultLevel": "O",
              "resultLineId": "1ded518e-ab4d-4a5d-a5b7-920e393286e0",
              "resultPrompts": [
                {
                  "label": "Place or area",
                  "promptId": "1559b30a-b931-4e3d-86e9-88ab8b116a81",
                  "promptRef": "place",
                  "type": "TXT",
                  "value": "Central London",
                },
              ],
              "shortCode": "pore5",
              "unresolvedParts": [],
              "valid": true,
            },
            "6480ca61-273b-4dee-8cde-4c60241e2188": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Notification of electronic monitoring order (bail)",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "nordr",
              "resultDefinitionId": "86857bb0-aaa6-4a76-b226-812a9987fcb2",
              "resultLevel": "O",
              "resultLineId": "6480ca61-273b-4dee-8cde-4c60241e2188",
              "resultPrompts": [
                {
                  "label": "Electronic monitoring contractor organisation name",
                  "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                  "promptRef": "electronicmonitoringcontractor",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Electronic monitoring contractor organisation name",
                      "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                      "promptRef": "electronicmonitoringcontractorOrganisationName",
                      "type": "TXT",
                      "value": "G4S Scotland Monitoring Technologies & Services",
                    },
                    {
                      "label": "Electronic monitoring contractor email address 1",
                      "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                      "promptRef": "electronicmonitoringcontractorEmailAddress1",
                      "type": "TXT",
                      "value": "EM.Scotland.Notifications@uk.g4s.com.cjsm.net",
                    },
                  ],
                },
                {
                  "label": "First notification of electronic monitoring",
                  "promptId": "5ce30920-b300-471c-8fd7-67f3a193476a",
                  "promptRef": "firstNotificationOfElectronicMonitoring",
                  "type": "ONEOF",
                  "value": {
                    "label": "First notification of electronic monitoring",
                    "promptId": "5ce30920-b300-471c-8fd7-67f3a193476a",
                    "promptRef": "firstNotificationOfElectronicMonitoring",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
                {
                  "label": "Was an interpreter used?",
                  "promptId": "cdc4f47c-612d-4f81-b321-a2b5861d6e19",
                  "promptRef": "wasAnInterpreterUsed",
                  "type": "BOOLEAN",
                  "value": false,
                },
                {
                  "label": "Does the offender have any special needs?",
                  "promptId": "5a386999-b2d9-45f4-9b68-57000ba2d6ef",
                  "promptRef": "doesTheOffenderHaveAnySpecialNeeds",
                  "type": "BOOLEAN",
                  "value": false,
                },
              ],
              "shortCode": "nordr",
              "unresolvedParts": [],
              "valid": true,
            },
            "7848828d-ad47-4083-adcc-6db75202ffd5": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Next hearing in magistrates' court",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "nhmc",
              "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
              "resultLevel": "O",
              "resultLineId": "7848828d-ad47-4083-adcc-6db75202ffd5",
              "resultPrompts": [
                {
                  "label": "Date of hearing",
                  "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
                  "promptRef": "HDATE",
                  "type": "DATE",
                  "value": "2021-10-07",
                },
                {
                  "label": "Time of hearing",
                  "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
                  "promptRef": "timeOfHearing",
                  "type": "TIME",
                  "value": "10:00",
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Lavender Hill Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "176A Lavender Hill",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "London",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW11 1JU",
                    },
                  ],
                },
                {
                  "label": "Courtroom",
                  "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
                  "promptRef": "HCROOM",
                  "type": "HCROOM",
                  "value": "Courtroom 01",
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Trial - no witnesses",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "MINUTES",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "value": 0,
                    },
                  ],
                },
                {
                  "label": "Booking reference",
                  "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
                  "promptRef": "bookingReference",
                  "type": "HIDDEN",
                  "value": "29d8208b-0fec-4e35-835d-437f769dc5f7",
                },
              ],
              "shortCode": "nhmc",
              "unresolvedParts": [],
              "valid": true,
            },
            "a2d51fa2-1f7a-4b24-a0ca-2edff3c703e4": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Remanded on conditional bail",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "RC",
              "resultDefinitionId": "3a529001-2f43-45ba-a0a8-d3ced7e9e7ad",
              "resultLevel": "O",
              "resultLineId": "a2d51fa2-1f7a-4b24-a0ca-2edff3c703e4",
              "resultPrompts": [
                {
                  "label": "Bail condition reason",
                  "promptId": "80be59c8-ffaa-4570-b40a-f3a085058208",
                  "promptRef": "bailConditionReason",
                  "type": "FIXLM",
                  "value": [
                    "To prevent offending",
                  ],
                },
              ],
              "shortCode": "RC",
              "unresolvedParts": [],
              "valid": true,
            },
            "d30116fb-a6aa-446e-b4fa-d1c139bf958d": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Bail conditions",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "baic",
              "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
              "resultLevel": "O",
              "resultLineId": "d30116fb-a6aa-446e-b4fa-d1c139bf958d",
              "resultPrompts": [],
              "shortCode": "baic",
              "unresolvedParts": [],
              "valid": true,
            },
            "d5e976b3-2144-4b2b-9d8d-f388b1804313": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Is electronic monitoring required (bail)",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "elmondet",
              "resultDefinitionId": "3ec4f7a9-50e8-4e9f-90ad-fd8c411b7ed2",
              "resultLevel": "O",
              "resultLineId": "d5e976b3-2144-4b2b-9d8d-f388b1804313",
              "resultPrompts": [],
              "shortCode": "elmondet",
              "unresolvedParts": [],
              "valid": true,
            },
            "e826cf6a-9f64-465a-a566-e36adad3de69": {
              "amendmentDate": "2021-10-03T15:58:47.651Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "deleted": true,
              "label": "Remanded on conditional bail",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "RC",
              "resultDefinitionId": "3a529001-2f43-45ba-a0a8-d3ced7e9e7ad",
              "resultLevel": "O",
              "resultLineId": "e826cf6a-9f64-465a-a566-e36adad3de69",
              "resultPrompts": [
                {
                  "label": "Bail condition reason",
                  "promptId": "80be59c8-ffaa-4570-b40a-f3a085058208",
                  "promptRef": "bailConditionReason",
                  "type": "FIXLM",
                  "value": [
                    "To prevent offending",
                  ],
                },
              ],
              "sharedDate": "2021-10-03T00:00:00.000Z",
              "shortCode": "RC",
              "unresolvedParts": [],
              "valid": true,
            },
            "fe599c9d-d672-493c-a0cd-fb0ea23126c7": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Exclusion - not to leave",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "pore11",
              "resultDefinitionId": "ac44c4ed-c77c-4552-aed7-b4f05f1dc9db",
              "resultLevel": "O",
              "resultLineId": "fe599c9d-d672-493c-a0cd-fb0ea23126c7",
              "resultPrompts": [
                {
                  "label": "Place or area",
                  "promptId": "1559b30a-b931-4e3d-86e9-88ab8b116a81",
                  "promptRef": "place",
                  "type": "TXT",
                  "value": "Home Town",
                },
              ],
              "shortCode": "pore11",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should strip childResultLineIds of deleted migrated children', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/DELETED04.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "e826cf6a-9f64-465a-a566-e36adad3de69",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8",
                "031af84a-da7e-42e0-b882-7c900fdf48a9",
                "d30116fb-a6aa-446e-b4fa-d1c139bf958d",
                "d5e976b3-2144-4b2b-9d8d-f388b1804313",
              ],
              "resultLineId": "a2d51fa2-1f7a-4b24-a0ca-2edff3c703e4",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "012a32fa-7870-4876-8762-00eb1a49f1c2",
              ],
              "resultLineId": "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "012a32fa-7870-4876-8762-00eb1a49f1c2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "7848828d-ad47-4083-adcc-6db75202ffd5",
              ],
              "resultLineId": "031af84a-da7e-42e0-b882-7c900fdf48a9",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "7848828d-ad47-4083-adcc-6db75202ffd5",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [
                "1ded518e-ab4d-4a5d-a5b7-920e393286e0",
                "fe599c9d-d672-493c-a0cd-fb0ea23126c7",
              ],
              "resultLineId": "d30116fb-a6aa-446e-b4fa-d1c139bf958d",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "1ded518e-ab4d-4a5d-a5b7-920e393286e0",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "fe599c9d-d672-493c-a0cd-fb0ea23126c7",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "6480ca61-273b-4dee-8cde-4c60241e2188",
              ],
              "resultLineId": "d5e976b3-2144-4b2b-9d8d-f388b1804313",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "6480ca61-273b-4dee-8cde-4c60241e2188",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "012a32fa-7870-4876-8762-00eb1a49f1c2": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "For the trial to take place",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "trial",
              "resultDefinitionId": "4958de15-8a0a-4d2b-9f7e-56e037cf03da",
              "resultLevel": "O",
              "resultLineId": "012a32fa-7870-4876-8762-00eb1a49f1c2",
              "resultPrompts": [],
              "shortCode": "trial",
              "unresolvedParts": [],
              "valid": true,
            },
            "031af84a-da7e-42e0-b882-7c900fdf48a9": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Next hearing",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "nexh",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "031af84a-da7e-42e0-b882-7c900fdf48a9",
              "resultPrompts": [],
              "shortCode": "nexh",
              "unresolvedParts": [],
              "valid": true,
            },
            "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Adjournment reasons",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "adjr",
              "resultDefinitionId": "7fc17a01-2f5a-4433-aae9-28e0c959f73b",
              "resultLevel": "O",
              "resultLineId": "0cd4ed7f-16e3-4cd5-ba96-5ed433fce2e8",
              "resultPrompts": [],
              "shortCode": "adjr",
              "unresolvedParts": [],
              "valid": true,
            },
            "1ded518e-ab4d-4a5d-a5b7-920e393286e0": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Exclusion - not to enter a place",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "pore5",
              "resultDefinitionId": "c1d490ed-1754-43b8-a485-fdab1a25f8cb",
              "resultLevel": "O",
              "resultLineId": "1ded518e-ab4d-4a5d-a5b7-920e393286e0",
              "resultPrompts": [
                {
                  "label": "Place or area",
                  "promptId": "1559b30a-b931-4e3d-86e9-88ab8b116a81",
                  "promptRef": "place",
                  "type": "TXT",
                  "value": "Central London",
                },
              ],
              "shortCode": "pore5",
              "unresolvedParts": [],
              "valid": true,
            },
            "6480ca61-273b-4dee-8cde-4c60241e2188": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Notification of electronic monitoring order (bail)",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "nordr",
              "resultDefinitionId": "86857bb0-aaa6-4a76-b226-812a9987fcb2",
              "resultLevel": "O",
              "resultLineId": "6480ca61-273b-4dee-8cde-4c60241e2188",
              "resultPrompts": [
                {
                  "label": "Electronic monitoring contractor organisation name",
                  "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                  "promptRef": "electronicmonitoringcontractor",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Electronic monitoring contractor organisation name",
                      "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                      "promptRef": "electronicmonitoringcontractorOrganisationName",
                      "type": "TXT",
                      "value": "G4S Scotland Monitoring Technologies & Services",
                    },
                    {
                      "label": "Electronic monitoring contractor email address 1",
                      "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                      "promptRef": "electronicmonitoringcontractorEmailAddress1",
                      "type": "TXT",
                      "value": "EM.Scotland.Notifications@uk.g4s.com.cjsm.net",
                    },
                  ],
                },
                {
                  "label": "First notification of electronic monitoring",
                  "promptId": "5ce30920-b300-471c-8fd7-67f3a193476a",
                  "promptRef": "firstNotificationOfElectronicMonitoring",
                  "type": "ONEOF",
                  "value": {
                    "label": "First notification of electronic monitoring",
                    "promptId": "5ce30920-b300-471c-8fd7-67f3a193476a",
                    "promptRef": "firstNotificationOfElectronicMonitoring",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
                {
                  "label": "Was an interpreter used?",
                  "promptId": "cdc4f47c-612d-4f81-b321-a2b5861d6e19",
                  "promptRef": "wasAnInterpreterUsed",
                  "type": "BOOLEAN",
                  "value": false,
                },
                {
                  "label": "Does the offender have any special needs?",
                  "promptId": "5a386999-b2d9-45f4-9b68-57000ba2d6ef",
                  "promptRef": "doesTheOffenderHaveAnySpecialNeeds",
                  "type": "BOOLEAN",
                  "value": false,
                },
              ],
              "shortCode": "nordr",
              "unresolvedParts": [],
              "valid": true,
            },
            "7848828d-ad47-4083-adcc-6db75202ffd5": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Next hearing in magistrates' court",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "nhmc",
              "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
              "resultLevel": "O",
              "resultLineId": "7848828d-ad47-4083-adcc-6db75202ffd5",
              "resultPrompts": [
                {
                  "label": "Date of hearing",
                  "promptId": "d27a5d86-d51f-4c6e-914b-cb4b0abc4283",
                  "promptRef": "HDATE",
                  "type": "DATE",
                  "value": "2021-10-07",
                },
                {
                  "label": "Time of hearing",
                  "promptId": "4d125a5a-acbc-461d-a657-ba5643af85a6",
                  "promptRef": "timeOfHearing",
                  "type": "TIME",
                  "value": "10:00",
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Lavender Hill Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "176A Lavender Hill",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "London",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW11 1JU",
                    },
                  ],
                },
                {
                  "label": "Courtroom",
                  "promptId": "49ec9b26-dd63-4637-b2e9-55ba9948a90f",
                  "promptRef": "HCROOM",
                  "type": "HCROOM",
                  "value": "Courtroom 01",
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Trial - no witnesses",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "MINUTES",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "value": 0,
                    },
                  ],
                },
                {
                  "label": "Booking reference",
                  "promptId": "e73e6ab8-9bfe-4135-9fe6-f526544584d6",
                  "promptRef": "bookingReference",
                  "type": "HIDDEN",
                  "value": "29d8208b-0fec-4e35-835d-437f769dc5f7",
                },
              ],
              "shortCode": "nhmc",
              "unresolvedParts": [],
              "valid": true,
            },
            "a2d51fa2-1f7a-4b24-a0ca-2edff3c703e4": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Remanded on conditional bail",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "RC",
              "resultDefinitionId": "3a529001-2f43-45ba-a0a8-d3ced7e9e7ad",
              "resultLevel": "O",
              "resultLineId": "a2d51fa2-1f7a-4b24-a0ca-2edff3c703e4",
              "resultPrompts": [
                {
                  "label": "Bail condition reason",
                  "promptId": "80be59c8-ffaa-4570-b40a-f3a085058208",
                  "promptRef": "bailConditionReason",
                  "type": "FIXLM",
                  "value": [
                    "To prevent offending",
                  ],
                },
              ],
              "shortCode": "RC",
              "unresolvedParts": [],
              "valid": true,
            },
            "d30116fb-a6aa-446e-b4fa-d1c139bf958d": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Bail conditions",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "baic",
              "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
              "resultLevel": "O",
              "resultLineId": "d30116fb-a6aa-446e-b4fa-d1c139bf958d",
              "resultPrompts": [],
              "shortCode": "baic",
              "unresolvedParts": [],
              "valid": true,
            },
            "d5e976b3-2144-4b2b-9d8d-f388b1804313": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Is electronic monitoring required (bail)",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "elmondet",
              "resultDefinitionId": "3ec4f7a9-50e8-4e9f-90ad-fd8c411b7ed2",
              "resultLevel": "O",
              "resultLineId": "d5e976b3-2144-4b2b-9d8d-f388b1804313",
              "resultPrompts": [],
              "shortCode": "elmondet",
              "unresolvedParts": [],
              "valid": true,
            },
            "e826cf6a-9f64-465a-a566-e36adad3de69": {
              "amendmentDate": "2021-10-03T15:58:47.651Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "deleted": true,
              "label": "Remanded on conditional bail",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "RC",
              "resultDefinitionId": "3a529001-2f43-45ba-a0a8-d3ced7e9e7ad",
              "resultLevel": "O",
              "resultLineId": "e826cf6a-9f64-465a-a566-e36adad3de69",
              "resultPrompts": [
                {
                  "label": "Bail condition reason",
                  "promptId": "80be59c8-ffaa-4570-b40a-f3a085058208",
                  "promptRef": "bailConditionReason",
                  "type": "FIXLM",
                  "value": [
                    "To prevent offending",
                  ],
                },
              ],
              "sharedDate": "2021-10-03T00:00:00.000Z",
              "shortCode": "RC",
              "unresolvedParts": [],
              "valid": true,
            },
            "fe599c9d-d672-493c-a0cd-fb0ea23126c7": {
              "caseId": "d9c528cf-ee17-4204-afba-73ec4e025e08",
              "defendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "label": "Exclusion - not to leave",
              "masterDefendantId": "71aac808-fa1f-4a1d-82c0-1fa728153859",
              "offenceId": "9bb55136-f029-451a-8619-8115ef05d63e",
              "orderedDate": "2021-10-03",
              "originalText": "pore11",
              "resultDefinitionId": "ac44c4ed-c77c-4552-aed7-b4f05f1dc9db",
              "resultLevel": "O",
              "resultLineId": "fe599c9d-d672-493c-a0cd-fb0ea23126c7",
              "resultPrompts": [
                {
                  "label": "Place or area",
                  "promptId": "1559b30a-b931-4e3d-86e9-88ab8b116a81",
                  "promptRef": "place",
                  "type": "TXT",
                  "value": "Home Town",
                },
              ],
              "shortCode": "pore11",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate the legacy form of the amendment date', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/AMENDDATE.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "5370e08d-941b-4558-ba1b-cd3858dbbd59",
                "e4946965-9878-4a52-8b4c-3a2c906c7b12",
              ],
              "resultLineId": "0c69721e-0706-47ee-b207-534c647b8ae6",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "478ffbda-c204-4fbf-96a5-e43527830a0c",
              ],
              "resultLineId": "5370e08d-941b-4558-ba1b-cd3858dbbd59",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "478ffbda-c204-4fbf-96a5-e43527830a0c",
              "ruleType": "oneOf",
            },
            {
              "childResultLineIds": [
                "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36",
              ],
              "resultLineId": "e4946965-9878-4a52-8b4c-3a2c906c7b12",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "e4c16159-86fa-4699-8c5f-0bc4abbc4d8c",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "0c69721e-0706-47ee-b207-534c647b8ae6": {
              "amendmentDate": "2021-05-21T00:00:00.000Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Adjournment",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "A",
              "resultDefinitionId": "d278650c-e429-11e8-9f32-f2801f1b9fd1",
              "resultLevel": "O",
              "resultLineId": "0c69721e-0706-47ee-b207-534c647b8ae6",
              "resultPrompts": [
                {
                  "label": "Defendant to attend the next hearing",
                  "promptId": "61f951c3-f18d-4a44-ae4a-0cad4efb4133",
                  "promptRef": "defendantToAttendTheNextHearing",
                  "type": "ONEOF",
                  "value": {
                    "label": "Defendant to attend the next hearing",
                    "promptId": "61f951c3-f18d-4a44-ae4a-0cad4efb4133",
                    "promptRef": "defendantToAttendTheNextHearing",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
              ],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "A",
              "unresolvedParts": [],
              "valid": true,
            },
            "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36": {
              "amendmentDate": "2021-05-21T00:00:00.000Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Insufficient court time to hear the case",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "insuf",
              "resultDefinitionId": "a1f2e6d7-7a21-41f8-9a9a-854b25a606d4",
              "resultLevel": "O",
              "resultLineId": "2b2ae058-0ab9-46ba-bc8b-0a4d81587e36",
              "resultPrompts": [],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "insuf",
              "unresolvedParts": [],
              "valid": true,
            },
            "478ffbda-c204-4fbf-96a5-e43527830a0c": {
              "amendmentDate": "2021-05-21T00:00:00.000Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Next hearing in Crown Court",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "nhccs",
              "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
              "resultLevel": "O",
              "resultLineId": "478ffbda-c204-4fbf-96a5-e43527830a0c",
              "resultPrompts": [
                {
                  "label": "Date and time to be fixed",
                  "promptId": "46257d78-1cbf-42b0-a24b-206826fecfb9",
                  "promptRef": "dateToBeFixed",
                  "type": "ONEOF",
                  "value": {
                    "label": "Fixed Date",
                    "promptId": "aea2ee79-47b4-4023-9a95-1b327e6e03d5",
                    "promptRef": "fixedDate",
                    "type": "DATE",
                    "value": "2021-05-13",
                  },
                },
                {
                  "label": "Courthouse organisation name",
                  "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                  "promptRef": "hCHOUSE",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Courthouse organisation name",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEOrganisationName",
                      "type": "TXT",
                      "value": "Lavender Hill Magistrates' Court",
                    },
                    {
                      "label": "Courthouse address line 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress1",
                      "type": "TXT",
                      "value": "176A Lavender Hill",
                    },
                    {
                      "label": "Courthouse address line 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEAddress2",
                      "type": "TXT",
                      "value": "London",
                    },
                    {
                      "label": "Courthouse post code",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEPostCode",
                      "type": "TXT",
                      "value": "SW11 1JU",
                    },
                    {
                      "label": "Courthouse email address 1",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEEmailAddress1",
                      "type": "TXT",
                      "value": "London.magistrates@cps.gov.uk",
                    },
                    {
                      "label": "Courthouse email address 2",
                      "promptId": "66868c04-72c4-46d9-a4fc-860a82107475",
                      "promptRef": "hCHOUSEEmailAddress2",
                      "type": "TXT",
                      "value": "periodicwarrants@geoamey.co.uk",
                    },
                  ],
                },
                {
                  "label": "Hearing type",
                  "promptId": "c1116d12-dd35-4171-807a-2cb845357d22",
                  "promptRef": "HTYPE",
                  "type": "FIXL",
                  "value": "Application (Ex Parte)",
                },
                {
                  "label": "Estimated duration",
                  "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                  "promptRef": "HEST",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Hours",
                      "promptId": "d85cc2d7-66c8-471e-b6ff-c1bc60c6cdac",
                      "promptRef": "HEST",
                      "type": "INT",
                      "value": "1",
                    },
                  ],
                },
                {
                  "label": "Remand Status",
                  "promptId": "9403f0d7-90b5-4377-84b4-f06a77811362",
                  "promptRef": "remandStatus",
                  "type": "FIXL",
                  "value": "Defendant not Present",
                },
              ],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "nhccs",
              "unresolvedParts": [],
              "valid": true,
            },
            "5370e08d-941b-4558-ba1b-cd3858dbbd59": {
              "amendmentDate": "2021-05-21T00:00:00.000Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Next hearing",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "nexh",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "5370e08d-941b-4558-ba1b-cd3858dbbd59",
              "resultPrompts": [],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "nexh",
              "unresolvedParts": [],
              "valid": true,
            },
            "e4946965-9878-4a52-8b4c-3a2c906c7b12": {
              "amendmentDate": "2021-05-21T00:00:00.000Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "deleted": true,
              "label": "Adjournment reasons",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "adjr",
              "resultDefinitionId": "7fc17a01-2f5a-4433-aae9-28e0c959f73b",
              "resultLevel": "O",
              "resultLineId": "e4946965-9878-4a52-8b4c-3a2c906c7b12",
              "resultPrompts": [],
              "sharedDate": "2021-05-12T00:00:00.000Z",
              "shortCode": "adjr",
              "unresolvedParts": [],
              "valid": true,
            },
            "e4c16159-86fa-4699-8c5f-0bc4abbc4d8c": {
              "amendmentDate": "2021-05-21T00:00:00.000Z",
              "amendmentReason": {
                "id": "ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0",
                "reasonDescription": "Admin error on shared result (a result recorded incorrectly)",
              },
              "caseId": "ecfbadfc-9df6-4a2e-9fd7-56cf42bc1558",
              "defendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "label": "Total custodial period",
              "masterDefendantId": "58315425-391f-4b53-8f92-4cb01a33c7fd",
              "offenceId": "8cdca5db-40b4-41bb-b5f0-2e15a279f5f5",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "e4c16159-86fa-4699-8c5f-0bc4abbc4d8c",
              "resultPrompts": [
                {
                  "label": "Total custodial period",
                  "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
                  "promptRef": "totalCustodialPeriod",
                  "type": "ONEOF",
                  "value": {
                    "label": "Total custodial period is life",
                    "promptId": "9dbe839c-3804-4c47-bf9e-5be6f9b9b3bb",
                    "promptRef": "totalCustodialPeriodIsLife",
                    "type": "BOOLEAN",
                    "value": true,
                  },
                },
                {
                  "label": "Prison organisation name",
                  "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                  "promptRef": "prison",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Prison organisation name",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonOrganisationName",
                      "type": "TXT",
                      "value": "HMP/YOI Pentonville",
                    },
                    {
                      "label": "Prison email address 1",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonEmailAddress1",
                      "type": "TXT",
                      "value": "Warrants.pentonville@justice.gov.uk",
                    },
                    {
                      "label": "Prison email address 2",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonEmailAddress2",
                      "type": "TXT",
                      "value": "Reception.Pentonville@justice.gov.uk",
                    },
                  ],
                },
                {
                  "label": "Conveyor / custodian name organisation name",
                  "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                  "promptRef": "conveyorcustodianname",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Conveyor / custodian name organisation name",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameOrganisationName",
                      "type": "TXT",
                      "value": "asd",
                    },
                    {
                      "label": "Conveyor / custodian name email address 1",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameEmailAddress1",
                      "type": "TXT",
                      "value": "asd@asda.co.uk",
                    },
                  ],
                },
                {
                  "label": "Probation team to be notified organisation name",
                  "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                  "promptRef": "probationteamtobenotified",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Probation team to be notified organisation name",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedOrganisationName",
                      "type": "TXT",
                      "value": "asdasd",
                    },
                    {
                      "label": "Probation team to be notified email address 1",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedEmailAddress1",
                      "type": "TXT",
                      "value": "asd@asda.co.uk",
                    },
                  ],
                },
              ],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });

    it('should migrate an application-based result', () => {
      const legacyDraftResult = require('./fixtures/legacy/draft-result/APPLICATION.json');
      const migratedDraftResult = migrate(legacyDraftResult, 1);

      expect(migratedDraftResult).toBeValidDraftResult();
      expect(migratedDraftResult).toMatchInlineSnapshot(`
        {
          "__metadata__": {
            "version": 1,
          },
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "d366c5d6-1f1c-471a-98ba-4951ead7b677",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "d366c5d6-1f1c-471a-98ba-4951ead7b677": {
              "applicationId": "ff8eab78-9a7b-4d24-af75-0ed57dd91b66",
              "label": "No order for costs",
              "orderedDate": "2021-05-28",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "d366c5d6-1f1c-471a-98ba-4951ead7b677",
              "resultPrompts": [
                {
                  "label": "Reason for no costs",
                  "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "promptRef": "reasonForNoCosts",
                  "type": "TXT",
                  "value": "No reason",
                },
              ],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
        }
      `);
    });
  });
});
