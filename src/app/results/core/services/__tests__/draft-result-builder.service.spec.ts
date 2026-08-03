import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppState, reducers } from '../../../../core';
import { RemoteUnresolvedPartForResult, UnresolvedPromptPart } from '../../../results.interfaces';
import { createDraftResultPromptsForShortcode, DraftResultBuilder } from '../../testing';
import { provideCppCoreHttpServices } from '@cpp/core';
import { DraftResultBuilderService } from '../draft-result-builder.service';
import { NotepadParserService } from '../notepad-parser.service';
import { ReusableInfoService } from '../reusable-info.service';
import { FullNamePipe } from '../../../../shared';
import { UserDetails } from '@cpp/users-groups';
import { InvalidResulLinesError } from '../../../results.interfaces';

describe('DraftResultBuilderService', () => {
  let draftResultBuilder: DraftResultBuilder;

  const orderedDate = '2021-01-01';
  const userDetails: UserDetails = {
    userId: 'userId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: '1@1.com'
  } as UserDetails;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
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
        provideRouter([]),
        DraftResultBuilderService,
        {
          provide: ReusableInfoService,
          useValue: {
            getValuesForResultLine: jest.fn(() => of([])),
            getValuesForHierarchy: jest.fn(() => of({}))
          }
        },
        NotepadParserService,
        FullNamePipe
      ],
      teardown: { destroyAfterEach: false }
    });
    draftResultBuilder = new DraftResultBuilder(TestBed.inject(DraftResultBuilderService));
  });

  describe('add child result', () => {
    it('should group a "oneOf" child result definition with its parent', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'RT',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        orderedDate,
        shortCode: 'rinstl'
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "oneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "RT",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rinstl",
            },
          },
        }
      `);
    });

    it('should group an "atleastOneOf" child result definition with its parent', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'CRS',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        orderedDate,
        shortCode: 'rr'
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "CRS",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rr",
            },
          },
        }
      `);
    });

    it('should inherit the amendment status of its parent', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'BAIC',
        orderedDate: '2020-01-01',
        applicationId: 'applicationId'
      });
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({
        id: '*',
        reasonDescription: '*'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'PORE10',
        orderedDate: '2020-01-01'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "*",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "*",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": false,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Bail conditions",
              "orderedDate": "2021-05-12",
              "originalText": "BAIC",
              "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "sharedDate": "2020-01-01",
              "shortCode": "BAIC",
              "unresolvedParts": [],
              "valid": true,
            },
            "UUID:2": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "*",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "*",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Exclusion - not to sit in the front seat of any motor vehicle",
              "orderedDate": "2021-05-12",
              "originalText": "PORE10",
              "resultDefinitionId": "3c98b287-fd01-471a-ac34-e0a56d9e95c2",
              "resultLevel": "O",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "PORE10",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('copy results', () => {
    it('should copy a single result line', async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        originalText: 'TIMP',
        orderedDate
      });
      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          applicationId: 'applicationId2'
        }
      ]);

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": "applicationId",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "applicationId": "applicationId2",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should copy a hierarchy of result lines', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        defendantId: ':defendantId',
        originalText: 'IMP',
        orderedDate
      });
      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          caseId: 'caseId',
          masterDefendantId: 'masterDefendantId2',
          defendantId: ':defendantId2',
          offenceId: 'offenceId2'
        }
      ]);

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [
                "UUID:5",
                "UUID:6",
              ],
              "resultLineId": "UUID:4",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:5",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:6",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": "caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "IMP",
            },
            "UUID:2": {
              "caseId": "caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "timp",
            },
            "UUID:3": {
              "caseId": "caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "vulnerability",
            },
            "UUID:4": {
              "caseId": "caseId",
              "defendantId": ":defendantId2",
              "masterDefendantId": "masterDefendantId2",
              "offenceId": "offenceId2",
              "originalText": "IMP",
            },
            "UUID:5": {
              "caseId": "caseId",
              "defendantId": ":defendantId2",
              "masterDefendantId": "masterDefendantId2",
              "offenceId": "offenceId2",
              "originalText": "timp",
            },
            "UUID:6": {
              "caseId": "caseId",
              "defendantId": ":defendantId2",
              "masterDefendantId": "masterDefendantId2",
              "offenceId": "offenceId2",
              "originalText": "vulnerability",
            },
          },
        }
      `);
    });

    it('should copy from an offence to an application target', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId',
        defendantId: ':defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        originalText: 'TIMP',
        orderedDate
      });
      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          applicationId: 'applicationId'
        }
      ]);

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": "caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "TIMP",
            },
            "UUID:2": {
              "applicationId": "applicationId",
              "originalText": "TIMP",
            },
          },
        }
      `);
    });

    it('should copy from an application to an offence target', async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        originalText: 'TIMP',
        orderedDate
      });
      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          caseId: 'caseId',
          defendantId: ':defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId'
        }
      ]);

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "applicationId": "applicationId",
              "originalText": "TIMP",
            },
            "UUID:2": {
              "caseId": "caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "TIMP",
            },
          },
        }
      `);
    });

    it('should strip any amendment / sharing data copied to an unshared target', async () => {
      await draftResultBuilder.parseTextOptions({
        applicationId: 'applicationId',
        orderedDate,
        originalText: 'TIMP'
      });
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-02');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({ id: 'amendmentReasonId' });
      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          applicationId: 'applicationId2'
        }
      ]);

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
              },
              "amendmentsLog": undefined,
              "applicationId": "applicationId",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "sharedDate": "2020-01-02",
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "applicationId": "applicationId2",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should retain any amend / sharing data copied to a shared target', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          applicationId: 'applicationId',
          orderedDate,
          originalText: 'TIMP'
        },
        {
          applicationId: 'applicationId2',
          orderedDate,
          originalText: 'AD'
        }
      );
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-02');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({ id: 'amendmentReasonId' });
      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          applicationId: 'applicationId2'
        }
      ]);

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
              },
              "amendmentsLog": undefined,
              "applicationId": "applicationId",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "sharedDate": "2020-01-02",
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
              },
              "amendmentsLog": undefined,
              "applicationId": "applicationId2",
              "label": "Absolute discharge",
              "orderedDate": "2021-08-30",
              "originalText": "AD",
              "resultDefinitionId": "b9c6047b-fb84-4b12-97a1-2175e4b8bbac",
              "resultLevel": "O",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "sharedDate": "2020-01-02",
              "shortCode": "ad",
              "unresolvedParts": [],
              "valid": true,
            },
            "UUID:3": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
              },
              "amendmentsLog": undefined,
              "applicationId": "applicationId2",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:3",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should throw error copying a defendant level result to the same defendant different offence', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId1',
        masterDefendantId: '',
        offenceId: 'offenceId',
        defendantId: ':defendantId',
        originalText: 'TIMP',
        orderedDate
      });

      try {
        await draftResultBuilder.copyResultLines([
          {
            originalResultLineId: 'UUID:1',
            caseId: 'caseId1',
            masterDefendantId: '',
            defendantId: ':defendantId',
            offenceId: 'offenceId2'
          }
        ]);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidResulLinesError);
      }
    });

    it('should throw error copying a defendant level result to a matched defendant', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId1',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        defendantId: ':defendantId',
        originalText: 'TIMP',
        orderedDate
      });

      try {
        await draftResultBuilder.copyResultLines([
          {
            originalResultLineId: 'UUID:1',
            caseId: 'caseId2',
            masterDefendantId: 'masterDefendantId',
            defendantId: ':defendantId2',
            offenceId: 'offenceId5'
          }
        ]);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidResulLinesError);
      }
    });

    it('should throw error copying a case-defendant level result to the same defendant in the same case', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId1',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        defendantId: ':defendantId',
        originalText: 'NCOSTS',
        orderedDate
      });

      try {
        await draftResultBuilder.copyResultLines([
          {
            originalResultLineId: 'UUID:1',
            caseId: 'caseId',
            masterDefendantId: 'masterDefendantId',
            defendantId: ':defendantId',
            offenceId: 'offenceId2'
          }
        ]);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidResulLinesError);
      }
    });

    it('should not throw error copying a case-defendant level result to the same defendant in the a different case', async () => {
      await draftResultBuilder.parseTextOptions({
        caseId: 'caseId1',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        defendantId: ':defendantId',
        originalText: 'NCOSTS',
        orderedDate
      });

      await draftResultBuilder.copyResultLines([
        {
          originalResultLineId: 'UUID:1',
          caseId: 'caseId2',
          masterDefendantId: 'masterDefendantId',
          defendantId: ':defendantId',
          offenceId: 'offenceId2'
        }
      ]);

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": "caseId1",
              "defendantId": ":defendantId",
              "label": "No order for costs",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "caseId": "caseId2",
              "defendantId": ":defendantId",
              "label": "No order for costs",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId2",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    describe('Standalone results that (as an exception) can be copied multiple times to any other offence', () => {
      it('should not throw error copying a NHMC twice to another offence', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            caseId: 'caseId1',
            masterDefendantId: 'masterDefendantId',
            offenceId: 'offenceId',
            defendantId: ':defendantId',
            originalText: 'NHMC',
            orderedDate
          },
          {
            caseId: 'caseId1',
            masterDefendantId: 'masterDefendantId',
            offenceId: 'offenceId',
            defendantId: ':defendantId',
            originalText: 'NHMC',
            orderedDate
          }
        );

        await draftResultBuilder.copyResultLines([
          {
            originalResultLineId: 'UUID:1',
            caseId: 'caseId',
            masterDefendantId: 'masterDefendantId',
            defendantId: ':defendantId',
            offenceId: 'offenceId2'
          },
          {
            originalResultLineId: 'UUID:2',
            caseId: 'caseId',
            masterDefendantId: 'masterDefendantId',
            defendantId: ':defendantId',
            offenceId: 'offenceId2'
          }
        ]);

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:2",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:3",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:4",
                "ruleType": "standalone",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentsLog": undefined,
                "caseId": "caseId1",
                "defendantId": ":defendantId",
                "label": "Next hearing in magistrates' court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-25",
                "originalText": "NHMC",
                "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
                "resultLevel": "O",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "shortCode": "NHMC",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:2": {
                "amendmentsLog": undefined,
                "caseId": "caseId1",
                "defendantId": ":defendantId",
                "label": "Next hearing in magistrates' court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-25",
                "originalText": "NHMC",
                "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
                "resultLevel": "O",
                "resultLineId": "UUID:2",
                "resultPrompts": [],
                "shortCode": "NHMC",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:3": {
                "amendmentsLog": undefined,
                "caseId": "caseId",
                "defendantId": ":defendantId",
                "label": "Next hearing in magistrates' court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId2",
                "orderedDate": "2021-05-25",
                "originalText": "NHMC",
                "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
                "resultLevel": "O",
                "resultLineId": "UUID:3",
                "resultPrompts": [],
                "shortCode": "NHMC",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:4": {
                "amendmentsLog": undefined,
                "caseId": "caseId",
                "defendantId": ":defendantId",
                "label": "Next hearing in magistrates' court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId2",
                "orderedDate": "2021-05-25",
                "originalText": "NHMC",
                "resultDefinitionId": "70c98fa6-804d-11e8-adc0-fa7ae01bbebc",
                "resultLevel": "O",
                "resultLineId": "UUID:4",
                "resultPrompts": [],
                "shortCode": "NHMC",
                "unresolvedParts": [],
                "valid": false,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });

      it('should not throw error copying a NHCCS twice to another offence', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            caseId: 'caseId1',
            masterDefendantId: 'masterDefendantId',
            offenceId: 'offenceId',
            defendantId: ':defendantId',
            originalText: 'NHCCS',
            orderedDate
          },
          {
            caseId: 'caseId1',
            masterDefendantId: 'masterDefendantId',
            offenceId: 'offenceId',
            defendantId: ':defendantId',
            originalText: 'NHCCS',
            orderedDate
          }
        );

        await draftResultBuilder.copyResultLines([
          {
            originalResultLineId: 'UUID:1',
            caseId: 'caseId',
            masterDefendantId: 'masterDefendantId',
            defendantId: ':defendantId',
            offenceId: 'offenceId2'
          },
          {
            originalResultLineId: 'UUID:2',
            caseId: 'caseId',
            masterDefendantId: 'masterDefendantId',
            defendantId: ':defendantId',
            offenceId: 'offenceId2'
          }
        ]);

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:2",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:3",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:4",
                "ruleType": "standalone",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentsLog": undefined,
                "caseId": "caseId1",
                "defendantId": ":defendantId",
                "label": "Next hearing in Crown Court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-06-04",
                "originalText": "NHCCS",
                "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
                "resultLevel": "O",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "shortCode": "NHCCS",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:2": {
                "amendmentsLog": undefined,
                "caseId": "caseId1",
                "defendantId": ":defendantId",
                "label": "Next hearing in Crown Court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-06-04",
                "originalText": "NHCCS",
                "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
                "resultLevel": "O",
                "resultLineId": "UUID:2",
                "resultPrompts": [],
                "shortCode": "NHCCS",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:3": {
                "amendmentsLog": undefined,
                "caseId": "caseId",
                "defendantId": ":defendantId",
                "label": "Next hearing in Crown Court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId2",
                "orderedDate": "2021-06-04",
                "originalText": "NHCCS",
                "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
                "resultLevel": "O",
                "resultLineId": "UUID:3",
                "resultPrompts": [],
                "shortCode": "NHCCS",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:4": {
                "amendmentsLog": undefined,
                "caseId": "caseId",
                "defendantId": ":defendantId",
                "label": "Next hearing in Crown Court",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId2",
                "orderedDate": "2021-06-04",
                "originalText": "NHCCS",
                "resultDefinitionId": "fbed768b-ee95-4434-87c8-e81cbc8d24c8",
                "resultLevel": "O",
                "resultLineId": "UUID:4",
                "resultPrompts": [],
                "shortCode": "NHCCS",
                "unresolvedParts": [],
                "valid": false,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });
    });
  });

  describe('destroy result', () => {
    describe('when the result line has no amendment', () => {
      it('should remove a standalone result', async () => {
        await draftResultBuilder.parseTextOptions({
          originalText: 'TIMP',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        });
        await draftResultBuilder.destroyResultLine('UUID:1');

        expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
          {
            "relations": [],
            "resultLines": {},
          }
        `);
      });

      it('should remove a child result', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            originalText: 'RT',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          },
          {
            originalText: 'rinstl',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          }
        );
        await draftResultBuilder.destroyResultLine('UUID:2');

        expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
          {
            "relations": [
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "caseId": ":caseId",
                "defendantId": ":defendantId",
                "masterDefendantId": ":masterDefendantId",
                "offenceId": ":offenceId",
                "originalText": "RT",
              },
            },
          }
        `);
      });

      it('should remove a result with child results', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            originalText: 'RT',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          },
          {
            originalText: 'rinstl',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          }
        );
        await draftResultBuilder.destroyResultLine('UUID:1');

        expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
          {
            "relations": [],
            "resultLines": {},
          }
        `);
      });

      it('should rebuild child results when a child result is removed', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            originalText: 'RT',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          },
          {
            originalText: 'rinstl',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          },
          {
            originalText: 'rinstl 2',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          }
        );
        await draftResultBuilder.destroyResultLine('UUID:2');

        expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
          {
            "relations": [
              {
                "childResultLineIds": [
                  "UUID:3",
                ],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:3",
                "ruleType": "oneOf",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "caseId": ":caseId",
                "defendantId": ":defendantId",
                "masterDefendantId": ":masterDefendantId",
                "offenceId": ":offenceId",
                "originalText": "RT",
              },
              "UUID:3": {
                "caseId": ":caseId",
                "defendantId": ":defendantId",
                "masterDefendantId": ":masterDefendantId",
                "offenceId": ":offenceId",
                "originalText": "rinstl 2",
              },
            },
          }
        `);
      });

      it('should maintain the relations between the remaining children', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            originalText: 'BAIC',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          },
          {
            originalText: 'PORE10',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          },
          {
            originalText: 'porr3',
            orderedDate,
            offenceId: ':offenceId',
            masterDefendantId: ':masterDefendantId',
            defendantId: ':defendantId',
            caseId: ':caseId'
          }
        );
        await draftResultBuilder.destroyResultLine('UUID:2');

        expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
          {
            "relations": [
              {
                "childResultLineIds": [
                  "UUID:3",
                ],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:3",
                "ruleType": "atleastOneOf",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "caseId": ":caseId",
                "defendantId": ":defendantId",
                "masterDefendantId": ":masterDefendantId",
                "offenceId": ":offenceId",
                "originalText": "BAIC",
              },
              "UUID:3": {
                "caseId": ":caseId",
                "defendantId": ":defendantId",
                "masterDefendantId": ":masterDefendantId",
                "offenceId": ":offenceId",
                "originalText": "porr3",
              },
            },
          }
        `);
      });
    });

    describe('when the result line has been shared', () => {
      it('should flag a standalone result as deleted', async () => {
        await draftResultBuilder.parseTextOptions({
          applicationId: 'applicationId',
          orderedDate,
          originalText: 'TIMP'
        });
        await draftResultBuilder.setSharedDateForAllResultLines('2020-01-02');
        await draftResultBuilder.setAmendmentReasonForAllResultLines({ id: 'amendmentReasonId' });
        await draftResultBuilder.destroyResultLine('UUID:1');

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": undefined,
                "applicationId": "applicationId",
                "deleted": true,
                "label": "Total custodial period",
                "orderedDate": "2021-05-12",
                "originalText": "TIMP",
                "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
                "resultLevel": "D",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "sharedDate": "2020-01-02",
                "shortCode": "TIMP",
                "unresolvedParts": [],
                "valid": false,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });

      it('should remove an unshared child result', async () => {
        await draftResultBuilder.parseTextOptions({
          originalText: 'BAIC',
          orderedDate: '2020-01-01',
          applicationId: 'applicationId'
        });
        await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
        await draftResultBuilder.setAmendmentReasonForAllResultLines({
          id: '*',
          reasonDescription: '*'
        });
        await draftResultBuilder.addChild({
          belongsToResultLineId: 'UUID:1',
          shortCode: 'PORE10',
          orderedDate: '2020-01-01'
        });
        await draftResultBuilder.destroyResultLine('UUID:2');

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "*",
                  "reasonDescription": "*",
                },
                "amendmentsLog": {
                  "amendmentsRecord": [
                    {
                      "amendedBy": "FirstName lastName",
                      "amendmentDate": "2020-01-02",
                      "amendmentReason": {
                        "id": "*",
                        "reasonDescription": "*",
                      },
                      "resultPromptsRecord": [],
                    },
                  ],
                  "isAmended": true,
                  "isCurrentlyAdded": false,
                  "resultWithoutPrompts": true,
                },
                "applicationId": "applicationId",
                "label": "Bail conditions",
                "orderedDate": "2021-05-12",
                "originalText": "BAIC",
                "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
                "resultLevel": "O",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "BAIC",
                "unresolvedParts": [],
                "valid": true,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });

      it('should remove a shared child result', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            applicationId: 'applicationId',
            originalText: 'RT',
            orderedDate
          },
          {
            applicationId: 'applicationId',
            originalText: 'rinstl',
            orderedDate
          }
        );
        await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
        await draftResultBuilder.setAmendmentReasonForAllResultLines({ id: 'amendmentReasonId' });
        await draftResultBuilder.destroyResultLine('UUID:2');

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [
                  "UUID:2",
                ],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:2",
                "ruleType": "oneOf",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": undefined,
                "applicationId": "applicationId",
                "category": "I",
                "label": "Reserve Terms",
                "orderedDate": "2021-05-12",
                "originalText": "RT",
                "resultDefinitionId": "4871697d-6dd1-4da2-8894-707e6b13c361",
                "resultLevel": "D",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "RT",
                "unresolvedParts": [],
                "valid": true,
              },
              "UUID:2": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": undefined,
                "applicationId": "applicationId",
                "deleted": true,
                "label": "Reserve Terms Instalments only",
                "orderedDate": "2021-05-12",
                "originalText": "rinstl",
                "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
                "resultLevel": "D",
                "resultLineId": "UUID:2",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "rinstl",
                "unresolvedParts": [],
                "valid": false,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });

      it('should remove a result with child results', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            applicationId: 'applicationId',
            originalText: 'RT',
            orderedDate
          },
          {
            applicationId: 'applicationId',
            originalText: 'rinstl',
            orderedDate
          }
        );
        await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
        await draftResultBuilder.setAmendmentReasonForAllResultLines({ id: 'amendmentReasonId' });
        await draftResultBuilder.destroyResultLine('UUID:1');

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [
                  "UUID:2",
                ],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:2",
                "ruleType": "oneOf",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": undefined,
                "applicationId": "applicationId",
                "category": "I",
                "deleted": true,
                "label": "Reserve Terms",
                "orderedDate": "2021-05-12",
                "originalText": "RT",
                "resultDefinitionId": "4871697d-6dd1-4da2-8894-707e6b13c361",
                "resultLevel": "D",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "RT",
                "unresolvedParts": [],
                "valid": true,
              },
              "UUID:2": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": undefined,
                "applicationId": "applicationId",
                "deleted": true,
                "label": "Reserve Terms Instalments only",
                "orderedDate": "2021-05-12",
                "originalText": "rinstl",
                "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
                "resultLevel": "D",
                "resultLineId": "UUID:2",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "rinstl",
                "unresolvedParts": [],
                "valid": false,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });

      it('should rebuild child results when a child result is removed', async () => {
        await draftResultBuilder.parseTextOptions(
          {
            applicationId: 'applicationId',
            originalText: 'RT',
            orderedDate
          },
          {
            applicationId: 'applicationId',
            originalText: 'rinstl',
            orderedDate
          },
          {
            applicationId: 'applicationId',
            originalText: 'rinstl 2',
            orderedDate
          }
        );
        await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
        await draftResultBuilder.setAmendmentReasonForAllResultLines({ id: 'amendmentReasonId' });
        await draftResultBuilder.destroyResultLine('UUID:2');

        expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
          {
            "hearingDay": "2020-01-01",
            "hearingId": "hearingId",
            "relations": [
              {
                "childResultLineIds": [
                  "UUID:2",
                  "UUID:3",
                ],
                "resultLineId": "UUID:1",
                "ruleType": "standalone",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:2",
                "ruleType": "oneOf",
              },
              {
                "childResultLineIds": [],
                "resultLineId": "UUID:3",
                "ruleType": "oneOf",
              },
            ],
            "resultLines": {
              "UUID:1": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": {
                  "amendmentsRecord": [
                    {
                      "amendedBy": "FirstName lastName",
                      "amendmentDate": "2020-01-02",
                      "amendmentReason": {
                        "id": "amendmentReasonId",
                      },
                      "resultPromptsRecord": [],
                    },
                  ],
                  "isAmended": true,
                  "isCurrentlyAdded": false,
                  "resultWithoutPrompts": true,
                },
                "applicationId": "applicationId",
                "category": "I",
                "label": "Reserve Terms",
                "orderedDate": "2021-05-12",
                "originalText": "RT",
                "resultDefinitionId": "4871697d-6dd1-4da2-8894-707e6b13c361",
                "resultLevel": "D",
                "resultLineId": "UUID:1",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "RT",
                "unresolvedParts": [],
                "valid": true,
              },
              "UUID:2": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": {
                  "amendmentsRecord": [
                    {
                      "amendedBy": "FirstName lastName",
                      "amendmentDate": "2020-01-02",
                      "amendmentReason": {
                        "id": "amendmentReasonId",
                      },
                      "resultPromptsRecord": [],
                    },
                  ],
                  "isAmended": true,
                  "isCurrentlyAdded": false,
                  "resultWithoutPrompts": true,
                },
                "applicationId": "applicationId",
                "deleted": true,
                "label": "Reserve Terms Instalments only",
                "orderedDate": "2021-05-12",
                "originalText": "rinstl",
                "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
                "resultLevel": "D",
                "resultLineId": "UUID:2",
                "resultPrompts": [],
                "sharedDate": "2020-01-01",
                "shortCode": "rinstl",
                "unresolvedParts": [],
                "valid": false,
              },
              "UUID:3": {
                "amendmentDate": "2020-01-02",
                "amendmentReason": {
                  "id": "amendmentReasonId",
                },
                "amendmentsLog": {
                  "amendmentsRecord": [
                    {
                      "amendedBy": "FirstName lastName",
                      "amendmentDate": "2020-01-02",
                      "amendmentReason": {
                        "id": "amendmentReasonId",
                      },
                      "resultPromptsRecord": [
                        {
                          "label": "Instalment amount",
                          "promptId": "1393acda-7a35-4d65-859d-6298e1470cf1",
                          "promptRef": "IAMT",
                          "type": "CURR",
                          "value": "2",
                        },
                      ],
                    },
                  ],
                  "isAmended": true,
                  "isCurrentlyAdded": false,
                  "resultWithoutPrompts": false,
                },
                "applicationId": "applicationId",
                "label": "Reserve Terms Instalments only",
                "orderedDate": "2021-05-12",
                "originalText": "rinstl 2",
                "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
                "resultLevel": "D",
                "resultLineId": "UUID:3",
                "resultPrompts": [
                  {
                    "label": "Instalment amount",
                    "promptId": "1393acda-7a35-4d65-859d-6298e1470cf1",
                    "promptRef": "IAMT",
                    "type": "CURR",
                    "value": "2",
                  },
                ],
                "sharedDate": "2020-01-01",
                "shortCode": "rinstl",
                "unresolvedParts": [],
                "valid": false,
              },
            },
            "shadowListedOffenceIds": [],
            "version": 1,
          }
        `);
      });
    });
  });

  describe('destroy unresolved parts', () => {
    it('should remove the only part from an unresolved result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'UNKNOWN',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.destroyPart({
        resultLineId: 'UUID:1',
        partIndex: 0
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [],
          "resultLines": {},
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should remove the only part from a resolved result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'TIMP 20',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.destroyPart({ resultLineId: 'UUID:1', partIndex: 0 });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Reason for sentence without PSR",
                  "promptId": "21549bc3-5be9-4a91-abc7-57d8ed1b1676",
                  "promptRef": "reasonForSentenceWithoutPSR",
                  "type": "TXT",
                  "value": "20",
                },
              ],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should remove one of many parts from an unresolved result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'UNKNOWN X',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.destroyPart({
        resultLineId: 'UUID:1',
        partIndex: 0
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "unknown",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-01-01",
              "originalText": " X",
              "resultLineId": "UUID:1",
              "unresolvedParts": [
                {
                  "originalText": "X",
                  "state": "UNRESOLVED",
                  "type": "TXT",
                  "value": "X",
                },
              ],
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should remove one of many parts from a resolved result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'TIMP A B A',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.destroyPart({ resultLineId: 'UUID:1', partIndex: 0 });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP  B A",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [
                {
                  "originalText": "B",
                  "resultPrompts": [
                    {
                      "label": "Reason for sentence without PSR",
                      "promptId": "21549bc3-5be9-4a91-abc7-57d8ed1b1676",
                      "promptRef": "reasonForSentenceWithoutPSR",
                      "type": "TXT",
                      "value": "B",
                    },
                  ],
                  "type": "TXT",
                  "value": "B",
                },
                {
                  "originalText": "A",
                  "resultPrompts": [
                    {
                      "label": "Reason for sentence without PSR",
                      "promptId": "21549bc3-5be9-4a91-abc7-57d8ed1b1676",
                      "promptRef": "reasonForSentenceWithoutPSR",
                      "type": "TXT",
                      "value": "A",
                    },
                  ],
                  "type": "TXT",
                  "value": "A",
                },
              ],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('parse result definitions', () => {
    it('should parse a single result', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'TIMP',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with determinable parameters', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS A',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "No order for costs",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS A",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Reason for no costs",
                  "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "promptRef": "reasonForNoCosts",
                  "type": "TXT",
                  "value": "A",
                },
              ],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with non-determinable parameters', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS A B',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "No order for costs",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS A B",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [
                {
                  "originalText": "A",
                  "resultPrompts": [
                    {
                      "label": "Reason for no costs",
                      "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "promptRef": "reasonForNoCosts",
                      "type": "TXT",
                      "value": "A",
                    },
                  ],
                  "type": "TXT",
                  "value": "A",
                },
                {
                  "originalText": "B",
                  "resultPrompts": [
                    {
                      "label": "Reason for no costs",
                      "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "promptRef": "reasonForNoCosts",
                      "type": "TXT",
                      "value": "B",
                    },
                  ],
                  "type": "TXT",
                  "value": "B",
                },
              ],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with a shorthand date parameter', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl 01/01/2020',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl 01/01/2020",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Instalment start date",
                  "promptId": "b487696e-dfc9-4c89-80d3-337a4319e925",
                  "promptRef": "instalmentStartDate",
                  "type": "DATE",
                  "value": "2020-01-01",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with a condensed shorthand date parameter', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl 1/8/20',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl 1/8/20",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Instalment start date",
                  "promptId": "b487696e-dfc9-4c89-80d3-337a4319e925",
                  "promptRef": "instalmentStartDate",
                  "type": "DATE",
                  "value": "2020-08-01",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with a currency parameter', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl £50',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl £50",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "rinstl",
              "unresolvedParts": [
                {
                  "originalText": "£50",
                  "resultPrompts": [],
                  "type": "TXT",
                  "value": "£50",
                },
              ],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with a fixed list parameter', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl monthly',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl monthly",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Payment frequency",
                  "promptId": "f2a61e80-c13e-4f44-8e91-8ce23e85596b",
                  "promptRef": "PF",
                  "type": "FIXL",
                  "value": "monthly",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with a shorthand currency parameter', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl 50',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl 50",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Instalment amount",
                  "promptId": "1393acda-7a35-4d65-859d-6298e1470cf1",
                  "promptRef": "IAMT",
                  "type": "CURR",
                  "value": "50",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with a shorthand date parameter', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl 01/01/2020',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl 01/01/2020",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Instalment start date",
                  "promptId": "b487696e-dfc9-4c89-80d3-337a4319e925",
                  "promptRef": "instalmentStartDate",
                  "type": "DATE",
                  "value": "2020-01-01",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with indeterminable shorthand parameters', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'FO 90 100',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "category": "F",
              "label": "Fine",
              "orderedDate": "2021-09-29",
              "originalText": "FO 90 100",
              "resultDefinitionId": "969f150c-cd05-46b0-9dd9-30891efcc766",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "fo",
              "unresolvedParts": [
                {
                  "originalText": "90",
                  "resultPrompts": [
                    {
                      "label": "Amount of fine",
                      "promptId": "7cd1472f-2379-4f5b-9e67-98a43d86e122",
                      "promptRef": "AOF",
                      "type": "CURR",
                      "value": "90",
                    },
                  ],
                  "type": "INT",
                  "value": "90",
                },
                {
                  "originalText": "100",
                  "resultPrompts": [
                    {
                      "label": "Amount of fine",
                      "promptId": "7cd1472f-2379-4f5b-9e67-98a43d86e122",
                      "promptRef": "AOF",
                      "type": "CURR",
                      "value": "100",
                    },
                  ],
                  "type": "INT",
                  "value": "100",
                },
              ],
              "valid": false,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Collection order",
              "orderedDate": "2021-09-29",
              "originalText": "collo",
              "resultDefinitionId": "9ea0d845-5096-44f6-9ce0-8ae801141eac",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "collo",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:3": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "No collection order reason",
              "orderedDate": "2021-09-29",
              "originalText": "nocollo",
              "resultDefinitionId": "615313b5-0647-4d61-b7b8-6b36265d8929",
              "resultLevel": "D",
              "resultLineId": "UUID:3",
              "resultPrompts": [],
              "shortCode": "nocollo",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:4": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Account Consolidated",
              "orderedDate": "2021-09-29",
              "originalText": "acon",
              "resultDefinitionId": "923f8b82-d4b5-4c9b-8b54-6d1ec8e16dd6",
              "resultLevel": "D",
              "resultLineId": "UUID:4",
              "resultPrompts": [],
              "shortCode": "acon",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse multiple determinable parameters', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl 20 monthly 01/01/2020',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Reserve Terms Instalments only",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl 20 monthly 01/01/2020",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Instalment amount",
                  "promptId": "1393acda-7a35-4d65-859d-6298e1470cf1",
                  "promptRef": "IAMT",
                  "type": "CURR",
                  "value": "20",
                },
                {
                  "label": "Payment frequency",
                  "promptId": "f2a61e80-c13e-4f44-8e91-8ce23e85596b",
                  "promptRef": "PF",
                  "type": "FIXL",
                  "value": "monthly",
                },
                {
                  "label": "Instalment start date",
                  "promptId": "b487696e-dfc9-4c89-80d3-337a4319e925",
                  "promptRef": "instalmentStartDate",
                  "type": "DATE",
                  "value": "2020-01-01",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse an unknown result definition', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'UNKNOWN',
        orderedDate,
        applicationId: 'applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "unknown",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "applicationId": "applicationId",
              "orderedDate": "2021-01-01",
              "originalText": "UNKNOWN",
              "resultLineId": "UUID:1",
              "unresolvedParts": [
                {
                  "resultChoices": [
                    {
                      "code": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
                      "label": "Total custodial period",
                      "level": "D",
                      "shortCode": "TIMP",
                      "type": "RESULT",
                    },
                  ],
                  "state": "UNRESOLVED",
                  "value": "UNKNOWN",
                },
              ],
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result added as an amendment', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS',
        orderedDate,
        applicationId: 'applicationId',
        amendmentReason: { id: 'amendmentReasonId', reasonDescription: '*' },
        amendmentDate: '2020-01-02'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "No order for costs",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse an unknown result definition added as an amendment', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'UNKNOWN',
        orderedDate,
        applicationId: 'applicationId',
        amendmentReason: { id: 'amendmentReasonId', reasonDescription: '*' },
        amendmentDate: '2020-01-02'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "unknown",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "applicationId": "applicationId",
              "orderedDate": "2021-01-01",
              "originalText": "UNKNOWN",
              "resultLineId": "UUID:1",
              "unresolvedParts": [
                {
                  "resultChoices": [
                    {
                      "code": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
                      "label": "Total custodial period",
                      "level": "D",
                      "shortCode": "TIMP",
                      "type": "RESULT",
                    },
                  ],
                  "state": "UNRESOLVED",
                  "value": "UNKNOWN",
                },
              ],
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse multiple standalone results', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'NCOSTS',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "NCOSTS",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "IMP",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "timp",
            },
            "UUID:4": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "vulnerability",
            },
          },
        }
      `);
    });

    it('should parse a result with "optional" and "mandatory" children', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'IMP',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Imprisonment",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "IMP",
              "resultDefinitionId": "abb95a52-2a75-40c3-8d3f-a1d75a199c47",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "IMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "timp",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:3": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Risk or vulnerability factors",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "vulnerability",
              "resultDefinitionId": "66105417-41c8-420d-820f-40b61b507442",
              "resultLevel": "D",
              "resultLineId": "UUID:3",
              "resultPrompts": [],
              "shortCode": "vulnerability",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse a result with conditional mandatory children', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'EMREQ',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Is electronic monitoring required",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "EMREQ",
              "resultDefinitionId": "d38d9766-c141-4d6b-bb4a-249a9bb88636",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "EMREQ",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should not introduce any "oneOf" or "atleastOneOf" child result definitions', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'CREFT',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "CREFT",
            },
          },
        }
      `);
    });

    it('should group a "oneOf" child result definition that is parsed with its parent', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'RT',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'rinstl',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "oneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "RT",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rinstl",
            },
          },
        }
      `);
    });

    it('should group an "atleastOneOf" child result definition that is parsed with its parent', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'CRS',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'rr',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "CRS",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rr",
            },
          },
        }
      `);
    });

    it('should only group child result definitions when they do not yet exist on a parent', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'CRS',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'rr',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'rr',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "CRS",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rr",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rr",
            },
          },
        }
      `);
    });

    it('should group a "mandatory" child result definition that is parsed with its parent', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'TIMP 50',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "IMP",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "TIMP 50",
            },
            "UUID:4": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "vulnerability",
            },
          },
        }
      `);
    });

    it('should group child definitions at any depth', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'PBVAR',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'BAIC',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'PORE10',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "UUID:3",
              ],
              "resultLineId": "UUID:2",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "PBVAR",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "BAIC",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "PORE10",
            },
          },
        }
      `);
    });

    it('should group child definitions at two level siblings', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'CO',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'UPWR',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "CO",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "UPWR",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "crs",
            },
            "UUID:4": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "emreq",
            },
          },
        }
      `);
    });

    it('should group child definitions at two level siblings on different offences', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'CO',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'UPWR',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'CO',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'UPWR',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:5",
                "UUID:6",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "UUID:7",
                "UUID:8",
              ],
              "resultLineId": "UUID:3",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:5",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:6",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [
                "UUID:4",
              ],
              "resultLineId": "UUID:7",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:8",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "CO",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "UPWR",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "CO",
            },
            "UUID:4": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "UPWR",
            },
            "UUID:5": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "crs",
            },
            "UUID:6": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "emreq",
            },
            "UUID:7": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "crs",
            },
            "UUID:8": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "emreq",
            },
          },
        }
      `);
    });

    it('should not duplicate offence level results for the same offence', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'ABDC',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'ABDC 2',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "ABDC",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "ABDC 2",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rt",
            },
          },
        }
      `);
    });

    it('should duplicate offence level results across different offences', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'ABDC',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'ABDC 2',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "ABDC",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "ABDC 2",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rt",
            },
          },
        }
      `);
    });

    it('should not duplicate defendant level results on the same defendant', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'AEOC',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'AEOC 2',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "AEOC",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "AEOC 2",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rt",
            },
          },
        }
      `);
    });

    it('should duplicate defendant level results across different defendants', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'AEOC',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'AEOC 2',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId2',
          defendantId: ':defendantId2',
          caseId: ':caseId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "UUID:4",
              ],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "AEOC",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId2",
              "offenceId": ":offenceId2",
              "originalText": "AEOC 2",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "rt",
            },
            "UUID:4": {
              "caseId": ":caseId",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId2",
              "offenceId": ":offenceId2",
              "originalText": "rt",
            },
          },
        }
      `);
    });

    it('should duplicate defendant level children across defendants', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId1',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId2',
          caseId: ':caseId1'
        },
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId2',
          defendantId: ':defendantId2',
          caseId: ':caseId2'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "UUID:5",
                "UUID:6",
              ],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:5",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:6",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId1",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId1",
              "originalText": "IMP",
            },
            "UUID:2": {
              "caseId": ":caseId2",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId2",
              "offenceId": ":offenceId2",
              "originalText": "IMP",
            },
            "UUID:3": {
              "caseId": ":caseId1",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId1",
              "originalText": "timp",
            },
            "UUID:4": {
              "caseId": ":caseId1",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId1",
              "originalText": "vulnerability",
            },
            "UUID:5": {
              "caseId": ":caseId2",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId2",
              "offenceId": ":offenceId2",
              "originalText": "timp",
            },
            "UUID:6": {
              "caseId": ":caseId2",
              "defendantId": ":defendantId2",
              "masterDefendantId": ":masterDefendantId2",
              "offenceId": ":offenceId2",
              "originalText": "vulnerability",
            },
          },
        }
      `);
    });

    it('should not duplicate defendant level children across offences', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId1',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId1'
        },
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId2',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId2'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId1",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId1",
              "originalText": "IMP",
            },
            "UUID:2": {
              "caseId": ":caseId2",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId2",
              "originalText": "IMP",
            },
            "UUID:3": {
              "caseId": ":caseId1",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId1",
              "originalText": "timp",
            },
            "UUID:4": {
              "caseId": ":caseId1",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId1",
              "originalText": "vulnerability",
            },
          },
        }
      `);
    });

    it('should not duplicate defendant level results across offences and applications', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'IMP',
          orderedDate,
          offenceId: ':offenceId',
          masterDefendantId: ':masterDefendantId',
          defendantId: ':defendantId',
          caseId: ':caseId'
        },
        {
          originalText: 'IMP',
          orderedDate,
          applicationId: 'applicationId',
          caseId: ':caseId',
          masterDefendantId: ':masterDefendantId'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "IMP",
            },
            "UUID:2": {
              "applicationId": "applicationId",
              "caseId": ":caseId",
              "masterDefendantId": ":masterDefendantId",
              "originalText": "IMP",
            },
            "UUID:3": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "timp",
            },
            "UUID:4": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "vulnerability",
            },
          },
        }
      `);
    });

    it('should maintain unique relations throughout a child hierarchy', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'CCII',
        orderedDate,
        applicationId: ':applicationId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [
                "UUID:4",
                "UUID:5",
                "UUID:6",
                "UUID:7",
              ],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:4",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:5",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:6",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:7",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Sent to Crown Court for trial in custody",
              "orderedDate": "2021-09-01",
              "originalText": "CCII",
              "resultDefinitionId": "4ea1c855-03cc-48f8-8d58-970ea673f15d",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "ccii",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Sent to Crown Court for trial",
              "orderedDate": "2021-09-01",
              "originalText": "scc",
              "resultDefinitionId": "491e30e9-2508-4e3a-9291-dfaf16d975ab",
              "resultLevel": "O",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "scc",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:3": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Remanded in custody",
              "orderedDate": "2021-09-01",
              "originalText": "ri",
              "resultDefinitionId": "d0a369c9-5a28-40ec-99cb-da7943550b18",
              "resultLevel": "O",
              "resultLineId": "UUID:3",
              "resultPrompts": [],
              "shortCode": "ri",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:4": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Next hearing",
              "orderedDate": "2021-09-01",
              "originalText": "nexh",
              "resultDefinitionId": "f00359b5-7303-403b-b59e-0b1a1daa89bc",
              "resultLevel": "O",
              "resultLineId": "UUID:4",
              "resultPrompts": [],
              "shortCode": "nexh",
              "unresolvedParts": [],
              "valid": true,
            },
            "UUID:5": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Remanded for medical reports",
              "orderedDate": "2021-09-01",
              "originalText": "remmed",
              "resultDefinitionId": "16a25613-487d-4359-8fc6-9a3968ff669f",
              "resultLevel": "O",
              "resultLineId": "UUID:5",
              "resultPrompts": [],
              "shortCode": "remmed",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:6": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Risk or vulnerability factors",
              "orderedDate": "2021-05-12",
              "originalText": "vulnerability",
              "resultDefinitionId": "66105417-41c8-420d-820f-40b61b507442",
              "resultLevel": "D",
              "resultLineId": "UUID:6",
              "resultPrompts": [],
              "shortCode": "vulnerability",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:7": {
              "amendmentsLog": undefined,
              "applicationId": ":applicationId",
              "label": "Adjournment reasons",
              "orderedDate": "2021-09-01",
              "originalText": "adjr",
              "resultDefinitionId": "7fc17a01-2f5a-4433-aae9-28e0c959f73b",
              "resultLevel": "O",
              "resultLineId": "UUID:7",
              "resultPrompts": [],
              "shortCode": "adjr",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should parse duplicate result definitions on offences introduced by an application', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'COV',
          orderedDate,
          applicationId: 'applicationId',
          caseId: 'caseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId'
        },
        {
          originalText: 'COV',
          orderedDate,
          applicationId: 'applicationId',
          caseId: 'caseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId2'
        }
      );

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:3",
                "UUID:4",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [
                "UUID:6",
                "UUID:7",
              ],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [
                "UUID:5",
              ],
              "resultLineId": "UUID:4",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:5",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:6",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [
                "UUID:8",
              ],
              "resultLineId": "UUID:7",
              "ruleType": "optional",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:8",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "COV",
            },
            "UUID:2": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId2",
              "originalText": "COV",
            },
            "UUID:3": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "emreq",
            },
            "UUID:4": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "nvr",
            },
            "UUID:5": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "originalText": "crs",
            },
            "UUID:6": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId2",
              "originalText": "emreq",
            },
            "UUID:7": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId2",
              "originalText": "nvr",
            },
            "UUID:8": {
              "applicationId": "applicationId",
              "caseId": "caseId",
              "defendantId": "defendantId",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId2",
              "originalText": "crs",
            },
          },
        }
      `);
    });
  });

  describe('replace result', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'vulnerability',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
    });

    it('should replace an existing result with a newly parsed result', async () => {
      await draftResultBuilder.replaceResultLine({
        resultLineId: 'UUID:1',
        orderedDate,
        originalText: 'TIMP'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:2": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should preserve an amendment on the replaced result', async () => {
      await draftResultBuilder.setAmendmentReasonForAllResultLines({
        id: 'amendmentReasonId',
        reasonDescription: '*'
      });
      await draftResultBuilder.replaceResultLine({
        resultLineId: 'UUID:1',
        orderedDate,
        originalText: 'TIMP'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:2": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('resolve unresolved part', () => {
    it('should resolve a result from a part', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'UNKNOWN',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      const part = draftResultBuilder.getResultLineById('UUID:1')
        .unresolvedParts[0] as RemoteUnresolvedPartForResult;

      await draftResultBuilder.resolvePart({
        resultLineId: 'UUID:1',
        partIndex: 0,
        choice: part.resultChoices[0]
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "TIMP",
            },
          },
        }
      `);
    });

    it('should forward any outstanding part values from the unresolved result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'UNKNOWN 20',
        orderedDate,
        applicationId: 'applicationId'
      });

      const part = draftResultBuilder.getResultLineById('UUID:1')
        .unresolvedParts[0] as RemoteUnresolvedPartForResult;

      await draftResultBuilder.resolvePart({
        resultLineId: 'UUID:1',
        partIndex: 0,
        choice: part.resultChoices[0]
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:2": {
              "applicationId": "applicationId",
              "originalText": "TIMP 20",
            },
          },
        }
      `);
    });

    it('should resolve a result prompt from a part', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS A B',
        orderedDate,
        applicationId: 'applicationId'
      });

      const partIndex = 1;
      const part = draftResultBuilder.getResultLineById('UUID:1').unresolvedParts[
        partIndex
      ] as UnresolvedPromptPart;

      await draftResultBuilder.resolvePart({
        resultLineId: 'UUID:1',
        partIndex,
        choice: part.resultPrompts[0]
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": "applicationId",
              "label": "No order for costs",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS A B",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Reason for no costs",
                  "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "promptRef": "reasonForNoCosts",
                  "type": "TXT",
                  "value": "B",
                },
              ],
              "shortCode": "NCOSTS",
              "unresolvedParts": [
                {
                  "originalText": "A",
                  "resultPrompts": [
                    {
                      "label": "Reason for no costs",
                      "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "promptRef": "reasonForNoCosts",
                      "type": "TXT",
                      "value": "A",
                    },
                  ],
                  "type": "TXT",
                  "value": "A",
                },
              ],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('set delegated powers', () => {
    it('should set the delegated powers for unshared results', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS',
        orderedDate,
        applicationId: 'applicationId'
      });
      await draftResultBuilder.setDelegatedPowers({ delegatedPowers: true, userDetails });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "delegatedPowers": true,
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "applicationId": "applicationId",
              "label": "No order for costs",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should set the delegated powers with an amendment', async () => {
      await draftResultBuilder.parseTextOptions(
        {
          originalText: 'NCOSTS',
          orderedDate,
          applicationId: 'applicationId'
        },
        {
          originalText: 'vulnerability',
          orderedDate,
          applicationId: 'applicationId'
        }
      );
      await draftResultBuilder.setDelegatedPowers({
        delegatedPowers: true,
        amendmentReason: { id: 'amendmentReasonId', reasonDescription: '*' },
        amendmentDate: '2020-01-02',
        userDetails
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "delegatedPowers": true,
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "No order for costs",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Risk or vulnerability factors",
              "orderedDate": "2021-05-12",
              "originalText": "vulnerability",
              "resultDefinitionId": "66105417-41c8-420d-820f-40b61b507442",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "vulnerability",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('set amendment reason', () => {
    it('should set the amendment reason for a result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'TIMP',
        orderedDate,
        applicationId: 'applicationId'
      });
      await draftResultBuilder.setAmendmentReason({
        resultLineId: 'UUID:1',
        amendmentReason: { id: 'amendmentReasonId', reasonDescription: '*' },
        amendmentDate: '2020-01-02',
        userDetails
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should apply the amendment reason to the child hierarchy of a result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'IMP',
        orderedDate,
        applicationId: 'applicationId'
      });
      await draftResultBuilder.setAmendmentReason({
        resultLineId: 'UUID:1',
        amendmentReason: { id: 'amendmentReasonId', reasonDescription: '*' },
        amendmentDate: '2020-01-02',
        userDetails
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "mandatory",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "optional",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Imprisonment",
              "orderedDate": "2021-05-12",
              "originalText": "IMP",
              "resultDefinitionId": "abb95a52-2a75-40c3-8d3f-a1d75a199c47",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "IMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:2": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Total custodial period",
              "orderedDate": "2021-05-12",
              "originalText": "timp",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": false,
            },
            "UUID:3": {
              "amendmentDate": "2020-01-02",
              "amendmentReason": {
                "id": "amendmentReasonId",
                "reasonDescription": "*",
              },
              "amendmentsLog": {
                "amendmentsRecord": [
                  {
                    "amendedBy": "FirstName lastName",
                    "amendmentDate": "2020-01-02",
                    "amendmentReason": {
                      "id": "amendmentReasonId",
                      "reasonDescription": "*",
                    },
                    "resultPromptsRecord": [],
                  },
                ],
                "isAmended": true,
                "isCurrentlyAdded": true,
                "resultWithoutPrompts": true,
              },
              "applicationId": "applicationId",
              "label": "Risk or vulnerability factors",
              "orderedDate": "2021-05-12",
              "originalText": "vulnerability",
              "resultDefinitionId": "66105417-41c8-420d-820f-40b61b507442",
              "resultLevel": "D",
              "resultLineId": "UUID:3",
              "resultPrompts": [],
              "shortCode": "vulnerability",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('shadow listed offences', () => {
    it('should update the shadow listed offences', async () => {
      await draftResultBuilder.setShadowListedOffenceIds([':offenceId']);

      expect(draftResultBuilder.snapshot.shadowListedOffenceIds).toMatchInlineSnapshot(`
        [
          ":offenceId",
        ]
      `);
    });
  });

  describe('toggling conditional mandatory child', () => {
    beforeEach(async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'EMREQ',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
    });

    it('should handle selecting the conditional mandatory child', async () => {
      await draftResultBuilder.toggleConditionalMandatory({
        resultLineId: 'UUID:1',
        selected: true
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "mandatory",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Is electronic monitoring required",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "EMREQ",
              "resultDefinitionId": "d38d9766-c141-4d6b-bb4a-249a9bb88636",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "EMREQ",
              "unresolvedParts": [],
              "valid": true,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Notification of electronic monitoring order (requirement)",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "nordrc",
              "resultDefinitionId": "dada120c-160a-49a9-b040-e8b6b7128d67",
              "resultLevel": "O",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "nordrc",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should handle deselecting the conditional mandatory child', async () => {
      await draftResultBuilder.toggleConditionalMandatory({
        resultLineId: 'UUID:1',
        selected: true
      });
      await draftResultBuilder.toggleConditionalMandatory({
        resultLineId: 'UUID:1',
        selected: false
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "EMREQ",
            },
          },
        }
      `);
    });

    it('should handle rejecting the conditional mandatory child', async () => {
      await draftResultBuilder.toggleConditionalMandatory({
        resultLineId: 'UUID:1',
        selected: false
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Is electronic monitoring required",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "EMREQ",
              "resultDefinitionId": "d38d9766-c141-4d6b-bb4a-249a9bb88636",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "EMREQ",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('update result prompts', () => {
    it('should update the result prompts', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'vulnerability',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('vulnerability')
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Risk or vulnerability factors",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "vulnerability",
              "resultDefinitionId": "66105417-41c8-420d-820f-40b61b507442",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Risk or vulnerability factors",
                  "promptId": "6b8c8f13-b8d1-4f72-85e8-cc9128e5ec71",
                  "promptRef": "riskOrVulnerabilityFactors",
                  "type": "TXT",
                  "value": "*",
                },
              ],
              "shortCode": "vulnerability",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should order the saved result prompts according to their `promptOrder`', async () => {
      const [a, b, c, d, ...other] = createDraftResultPromptsForShortcode('TIMP');

      await draftResultBuilder.parseTextOptions({
        originalText: 'TIMP',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: [a, d, c, b, ...other]
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Total custodial period",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "TIMP",
              "resultDefinitionId": "6cb15971-c945-4398-b7c9-3f8b743a4de3",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
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
                  "label": "Consecutive to sentence imposed on",
                  "promptId": "83b92cfe-9160-4e46-baa1-b9a1e99b41cc",
                  "promptRef": "consecutiveToSentenceImposedOn",
                  "type": "DATE",
                  "value": "2020-01-01",
                },
                {
                  "label": "which was imposed by",
                  "promptId": "3e7dab34-bb9d-46df-9a45-139113ee0b09",
                  "promptRef": "whichWasImpBy",
                  "type": "FIXL",
                  "value": "Cardiff Magistrates' Court",
                },
                {
                  "label": "Minimum term",
                  "promptId": "8f2984fe-9270-4175-9f2e-79d1ec7d3a38",
                  "promptRef": "minimumTerm",
                  "type": "DURATION",
                  "value": [
                    {
                      "label": "Minutes",
                      "type": "INT",
                      "value": 60,
                    },
                  ],
                },
                {
                  "label": "Early release provisions apply",
                  "promptId": "10ec0c03-a0a9-41fc-9314-1cec010e12cf",
                  "promptRef": "earlyReleaseProvisionsApply",
                  "type": "BOOLEAN",
                  "value": true,
                },
                {
                  "label": "Early release provisions do not apply - sentence is a whole life order",
                  "promptId": "ddaa31d2-352a-47ca-95c4-6588faabf099",
                  "promptRef": "earlyReleaseProvisionsDoNotApply",
                  "type": "BOOLEAN",
                  "value": true,
                },
                {
                  "label": "Prison",
                  "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                  "promptRef": "prison",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Prison organisation name",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonOrganisationName",
                      "type": "TXT",
                      "value": "*",
                    },
                    {
                      "label": "Prison address line 1",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonAddress1",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Prison address line 2",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonAddress2",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Prison address line 3",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonAddress3",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Prison address line 4",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonAddress4",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Prison address line 5",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonAddress5",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Prison post code",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonPostCode",
                      "type": "TXT",
                      "value": "CR0 1XN",
                    },
                    {
                      "label": "Prison email address 1",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonEmailAddress1",
                      "type": "TXT",
                      "value": "foo@bar.org",
                    },
                    {
                      "label": "Prison email address 2",
                      "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                      "promptRef": "prisonEmailAddress2",
                      "type": "TXT",
                      "value": "foo@bar.org",
                    },
                  ],
                },
                {
                  "label": "Conveyor / custodian name",
                  "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                  "promptRef": "conveyorcustodianname",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Conveyor / custodian name organisation name",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameOrganisationName",
                      "type": "TXT",
                      "value": "*",
                    },
                    {
                      "label": "Conveyor / custodian name address line 1",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameAddress1",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Conveyor / custodian name address line 2",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameAddress2",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Conveyor / custodian name address line 3",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameAddress3",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Conveyor / custodian name address line 4",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameAddress4",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Conveyor / custodian name address line 5",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameAddress5",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Conveyor / custodian name post code",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannamePostCode",
                      "type": "TXT",
                      "value": "CR0 1XN",
                    },
                    {
                      "label": "Conveyor / custodian name email address 1",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameEmailAddress1",
                      "type": "TXT",
                      "value": "foo@bar.org",
                    },
                    {
                      "label": "Conveyor / custodian name email address 2",
                      "promptId": "6927b6ac-4c85-4532-838d-88ac00ea83f9",
                      "promptRef": "conveyorcustodiannameEmailAddress2",
                      "type": "TXT",
                      "value": "foo@bar.org",
                    },
                  ],
                },
                {
                  "label": "Reason for sentence without PSR",
                  "promptId": "21549bc3-5be9-4a91-abc7-57d8ed1b1676",
                  "promptRef": "reasonForSentenceWithoutPSR",
                  "type": "TXT",
                  "value": "*",
                },
                {
                  "label": "Probation team to be notified",
                  "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                  "promptRef": "probationteamtobenotified",
                  "type": "NAMEADDRESS",
                  "value": [
                    {
                      "label": "Probation team to be notified organisation name",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedOrganisationName",
                      "type": "TXT",
                      "value": "*",
                    },
                    {
                      "label": "Probation team to be notified address line 1",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedAddress1",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Probation team to be notified address line 2",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedAddress2",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Probation team to be notified address line 3",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedAddress3",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Probation team to be notified address line 4",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedAddress4",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Probation team to be notified address line 5",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedAddress5",
                      "type": "TXT",
                      "value": "X",
                    },
                    {
                      "label": "Probation team to be notified post code",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedPostCode",
                      "type": "TXT",
                      "value": "CR0 1XN",
                    },
                    {
                      "label": "Probation team to be notified email address 1",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedEmailAddress1",
                      "type": "TXT",
                      "value": "foo@bar.org",
                    },
                    {
                      "label": "Probation team to be notified email address 2",
                      "promptId": "68c92035-27fd-4ee6-b03c-fe18ea6dbcb0",
                      "promptRef": "probationteamtobenotifiedEmailAddress2",
                      "type": "TXT",
                      "value": "foo@bar.org",
                    },
                  ],
                },
                {
                  "label": "Sentenced in absence",
                  "promptId": "2395831b-5044-451f-acaf-259d00e01bea",
                  "promptRef": "sentencedInAbsence",
                  "type": "BOOLEAN",
                  "value": true,
                },
              ],
              "shortCode": "TIMP",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });

  describe('caching', () => {
    it('should install the result prompts on a new result', async () => {
      TestBed.inject(ReusableInfoService).getValuesForResultLine = () =>
        of(createDraftResultPromptsForShortcode('NCOSTS'));

      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "No order for costs",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Reason for no costs",
                  "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "promptRef": "reasonForNoCosts",
                  "type": "TXT",
                  "value": "*",
                },
              ],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should prioritize parsed result prompts over the cache', async () => {
      TestBed.inject(ReusableInfoService).getValuesForResultLine = () =>
        of(createDraftResultPromptsForShortcode('NCOSTS'));

      await draftResultBuilder.parseTextOptions({
        originalText: 'NCOSTS FROM_PARSER',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "No order for costs",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-20",
              "originalText": "NCOSTS FROM_PARSER",
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLevel": "C",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Reason for no costs",
                  "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "promptRef": "reasonForNoCosts",
                  "type": "TXT",
                  "value": "FROM_PARSER",
                },
              ],
              "shortCode": "NCOSTS",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should install a cached hierarchy', async () => {
      TestBed.inject(ReusableInfoService).getValuesForHierarchy = () =>
        of({
          BAIC: [],
          porr3: createDraftResultPromptsForShortcode('porr3'),
          pore10: []
        });

      await draftResultBuilder.parseTextOptions({
        originalText: 'BAIC',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
                "UUID:3",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:3",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Bail conditions",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "BAIC",
              "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
              "resultLevel": "O",
              "resultLineId": "UUID:1",
              "resultPrompts": [],
              "shortCode": "BAIC",
              "unresolvedParts": [],
              "valid": true,
            },
            "UUID:2": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Exclusion - not to sit in the front seat of any motor vehicle",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "pore10",
              "resultDefinitionId": "3c98b287-fd01-471a-ac34-e0a56d9e95c2",
              "resultLevel": "O",
              "resultLineId": "UUID:2",
              "resultPrompts": [],
              "shortCode": "PORE10",
              "unresolvedParts": [],
              "valid": true,
            },
            "UUID:3": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Residence - live and sleep each night at address",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "porr3",
              "resultDefinitionId": "c18dd89d-e057-42aa-b071-0a91226da3bf",
              "resultLevel": "O",
              "resultLineId": "UUID:3",
              "resultPrompts": [
                {
                  "label": "Address",
                  "promptId": "7025bdf4-f438-4b6e-8acf-b7ef38fcbd23",
                  "promptRef": "address",
                  "type": "TXT",
                  "value": "*",
                },
              ],
              "shortCode": "porr3",
              "unresolvedParts": [],
              "valid": true,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });

    it('should discard erroneous entries in a cached hierarchy', async () => {
      TestBed.inject(ReusableInfoService).getValuesForHierarchy = () =>
        of({
          BAIC: [
            {
              type: 'TXT',
              promptRef: 'deprecated',
              value: 'OK!'
            }
          ],
          pore10: [],
          unknown: [
            {
              type: 'TXT',
              promptRef: 'unknown',
              value: '*'
            }
          ]
        });

      await draftResultBuilder.parseTextOptions({
        originalText: 'BAIC',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.structure).toMatchInlineSnapshot(`
        {
          "relations": [
            {
              "childResultLineIds": [
                "UUID:2",
              ],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:2",
              "ruleType": "atleastOneOf",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "BAIC",
            },
            "UUID:2": {
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "originalText": "pore10",
            },
          },
        }
      `);
    });

    it('should retain any invalid result prompts', async () => {
      const cache = [
        // valid
        {
          type: 'CURR',
          promptRef: 'IAMT',
          value: 100
        },
        // invalid (FIXL value does not exist)
        {
          type: 'FIXL',
          promptRef: 'PF',
          value: 'nightly'
        }
      ];
      TestBed.inject(ReusableInfoService).getValuesForResultLine = () => of(cache);

      await draftResultBuilder.parseTextOptions({
        originalText: 'rinstl',
        orderedDate,
        offenceId: ':offenceId',
        masterDefendantId: ':masterDefendantId',
        defendantId: ':defendantId',
        caseId: ':caseId'
      });

      expect(draftResultBuilder.snapshot).toMatchInlineSnapshot(`
        {
          "hearingDay": "2020-01-01",
          "hearingId": "hearingId",
          "relations": [
            {
              "childResultLineIds": [],
              "resultLineId": "UUID:1",
              "ruleType": "standalone",
            },
          ],
          "resultLines": {
            "UUID:1": {
              "amendmentsLog": undefined,
              "caseId": ":caseId",
              "defendantId": ":defendantId",
              "label": "Reserve Terms Instalments only",
              "masterDefendantId": ":masterDefendantId",
              "offenceId": ":offenceId",
              "orderedDate": "2021-05-12",
              "originalText": "rinstl",
              "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
              "resultLevel": "D",
              "resultLineId": "UUID:1",
              "resultPrompts": [
                {
                  "label": "Instalment amount",
                  "promptId": "1393acda-7a35-4d65-859d-6298e1470cf1",
                  "promptRef": "IAMT",
                  "type": "CURR",
                  "value": 100,
                },
                {
                  "label": "Payment frequency",
                  "promptId": "f2a61e80-c13e-4f44-8e91-8ce23e85596b",
                  "promptRef": "PF",
                  "type": "FIXL",
                  "value": "nightly",
                },
              ],
              "shortCode": "rinstl",
              "unresolvedParts": [],
              "valid": false,
            },
          },
          "shadowListedOffenceIds": [],
          "version": 1,
        }
      `);
    });
  });
});
