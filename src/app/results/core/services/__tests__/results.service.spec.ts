import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { UserDetails } from '@cpp/users-groups';
import { cold, getTestScheduler } from 'jasmine-marbles';
import { flatten, omit } from 'lodash-es';
import LZString from 'lz-string';
import { of } from 'rxjs';
import { AppConfigService } from '../../../../config';
import { AppState, reducers, WelshDefendantTranslate } from '../../../../core';
import {
  DraftResultPrompt,
  ResolvedDraftResultLine,
  SharedResult,
  SharedResultLine
} from '../../../results.interfaces';
import { migrateDraftResultToVersion } from '../../migrations';
import {
  createDraftResult,
  createDraftResultPromptsForShortcode,
  DraftResultBuilder,
  extendDraftResult,
  getParsedResultDefinitionByShortCode
} from '../../testing';
import { DraftResultBuilderService } from '../draft-result-builder.service';
import { NotepadParserService } from '../notepad-parser.service';
import { ResultsService } from '../results.service';
import { FullNamePipe } from '../../../../shared';

jest.mock('../../migrations', () => {
  const actual = jest.requireActual('../../migrations');
  return {
    ...actual,
    migrateDraftResultToVersion: jest.fn(draftResult => {
      return {
        ...draftResult,
        status: 'MIGRATED',
        __metadata__: {
          version: 1
        }
      };
    })
  };
});

describe('ResultsService', () => {
  let appConfigService: AppConfigService;
  let cppHttp: CppHttp;
  let notepadParserService: NotepadParserService;
  let resultsService: ResultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
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
        provideCppCoreHttpServices(),
        CppHttp,
        FullNamePipe,
        ResultsService,
        NotepadParserService,
        {
          provide: AppConfigService,
          useValue: {
            compressedEnabled: false
          }
        },
        {
          provide: DraftResultBuilderService,
          useValue: {
            addChildResultDefinition: jest.fn(val => of(val))
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    appConfigService = TestBed.inject(AppConfigService);
    cppHttp = TestBed.inject(CppHttp);
    notepadParserService = TestBed.inject(NotepadParserService);
    resultsService = TestBed.inject(ResultsService);
  });

  afterEach(() => {
    (migrateDraftResultToVersion as jest.Mock).mockClear();
  });

  describe('setWelshDefendantTranslate', () => {
    it('should send defendant ids via api', () => {
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)');

      cppHttp.commandSync = jest.fn(() => response$);
      const hearingId = 'hearing-id-1';
      const payload: WelshDefendantTranslate[] = [
        { welshTranslation: true, defendantId: 'defendant-id-1' }
      ];

      expect(resultsService.setWelshDefendantTranslate({ hearingId, payload })).toBeObservable(
        expected$
      );
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
        requestType: 'application/vnd.hearing.save-defendants-welsh-translations+json',
        successEvent: 'public.hearing.defendants-welsh-information-recorded',
        body: { defendantsWelshList: payload }
      });
    });
  });

  describe('approveAmendments', () => {
    it('should approve the amendments via the api', () => {
      const draftResult = createDraftResult();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)');

      cppHttp.commandSync = jest.fn(() => response$);

      expect(resultsService.approveAmendments(draftResult, 'userId')).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/validate-result-amendments',
        requestType: 'application/vnd.hearing.validate-result-amendments+json',
        successEvent: 'public.hearing.result-amendments-validated',
        errorEvent: 'public.hearing.manage-results-failed',
        body: {
          id: 'hearingId',
          hearingDay: '2020-01-01',
          userId: 'userId',
          validateAction: 'APPROVE'
        }
      });
    });
  });

  describe('cancelAmendments', () => {
    it('should cancel amendments via the api', () => {
      const draftResult = createDraftResult();
      const { hearingId, hearingDay } = draftResult;
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)');

      cppHttp.commandSync = jest.fn(() => response$);

      expect(resultsService.cancelAmendments(draftResult)).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
        requestType: 'application/vnd.hearing.change-cancel-amendments+json',
        successEvent: 'public.hearing.result-amendments-cancelled',
        errorEvent: 'public.hearing.manage-results-failed',
        body: { hearingDay }
      });
    });
  });

  describe('fetchDraftResult', () => {
    it('should fetch a legacy draft result', () => {
      const legacyDraftResult = { targets: [] } as any;
      const migratedDraftResult = { ...legacyDraftResult, status: 'MIGRATED' };
      const response$ = cold('--(r|)  ', { r: legacyDraftResult });
      const expected$ = cold('--(r|)', { r: migratedDraftResult });
      // disabled pending https://tools.hmcts.net/jira/browse/DD-16685
      // const persist$ = cold('   --(r|)');
      // const expected$ = cold('----(r|)', { r: migratedDraftResult });
      // resultsService.saveDraftResult = jest.fn(() => persist$);

      cppHttp.query = jest.fn(() => response$);

      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      expect(
        resultsService.fetchDraftResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
      ).toBeObservable(expected$);
      // disabled pending https://tools.hmcts.net/jira/browse/DD-16685
      // expect(resultsService.saveDraftResult).toHaveBeenCalledWith({
      //   ...migratedDraftResult,
      //   __metadata__: {
      //     version: 1
      //   }
      // });
      expect(cppHttp.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/hearingId/2020-01-01/draft-result',
        requestType: 'application/vnd.hearing.get-draft-result-v2+json'
      });
      expect(migrateDraftResultToVersion).toHaveBeenCalledWith(
        legacyDraftResult,
        resultsService.version,
        { hearingId: 'hearingId', hearingDay: '2020-01-01', hearing: { id: 'hearingId' } },
        isBoxwork,
        firstSharedDate
      );
    });

    it('should fetch an uncompressed draft result', () => {
      const draftResult = createDraftResult();
      const draftResultWithMetadata = {
        ...draftResult,
        __metadata__: {
          version: 1
        }
      };
      const migratedDraftResult = { ...draftResult, status: 'MIGRATED' };
      const response$ = cold('--(r|)', { r: draftResultWithMetadata });
      const expected$ = cold('--(r|)', { r: migratedDraftResult });

      cppHttp.query = jest.fn(() => response$);

      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      expect(
        resultsService.fetchDraftResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
      ).toBeObservable(expected$);
      expect(cppHttp.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/hearingId/2020-01-01/draft-result',
        requestType: 'application/vnd.hearing.get-draft-result-v2+json'
      });
      expect(migrateDraftResultToVersion).toHaveBeenCalledWith(
        draftResultWithMetadata,
        resultsService.version,
        { hearingId: 'hearingId', hearingDay: '2020-01-01', hearing: { id: 'hearingId' } },
        isBoxwork,
        firstSharedDate
      );
    });

    it('should fetch a compressed draft result', () => {
      appConfigService.compressionEnabled = true;

      const draftResult = createDraftResult();
      const compressedDraftResult = {
        body: LZString.compress(JSON.stringify(draftResult)),
        __metadata__: {
          version: 1
        }
      };
      const draftResultWithMetadata = {
        ...draftResult,
        __metadata__: {
          version: 1
        }
      };
      const migratedDraftResult = { ...draftResult, status: 'MIGRATED' };
      const response$ = cold('--(r|)', { r: compressedDraftResult });
      const expected$ = cold('--(r|)', { r: migratedDraftResult });

      cppHttp.query = jest.fn(() => response$);
      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      expect(
        resultsService.fetchDraftResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
      ).toBeObservable(expected$);
      expect(cppHttp.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/hearingId/2020-01-01/draft-result',
        requestType: 'application/vnd.hearing.get-draft-result-v2+json'
      });
      expect(migrateDraftResultToVersion).toHaveBeenCalledWith(
        draftResultWithMetadata,
        resultsService.version,
        {
          hearingId: 'hearingId',
          hearingDay: '2020-01-01',
          hearing: { id: 'hearingId' }
        },
        isBoxwork,
        firstSharedDate
      );
    });
  });

  describe('fetchExtendedDraftResult', () => {
    it('should fetch the migrated draft result decorated with result definition metadata', () => {
      const wrappedDraftResult = {
        ...createDraftResult({
          results: ['CREFT', 'NCOSTS', 'UNKNOWN']
        }),
        __metadata__: {
          version: 1
        }
      };
      const migratedDraftResult = extendDraftResult({
        ...omit(wrappedDraftResult, '__metadata__'),
        status: 'MIGRATED'
      });
      const response$ = cold('--(r|)   ', { r: wrappedDraftResult });
      const prompts1$ = cold('  --(a|) ', { a: getParsedResultDefinitionByShortCode('CREFT') });
      const prompts2$ = cold('  ---(b|)', { b: getParsedResultDefinitionByShortCode('NCOSTS') });
      const expected$ = cold('-----(r|)', { r: migratedDraftResult });

      cppHttp.query = jest.fn(() => response$);
      notepadParserService.fetchParsedResultDefinition = jest
        .fn()
        .mockImplementationOnce(() => prompts1$)
        .mockImplementationOnce(() => prompts2$);

      const isBoxwork = false;

      const firstSharedDate: string = undefined;
      expect(
        resultsService.fetchExtendedDraftResult(
          'hearingId',
          '2020-01-01',
          isBoxwork,
          firstSharedDate
        )
      ).toBeObservable(expected$);
      expect(cppHttp.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/hearingId/2020-01-01/draft-result',
        requestType: 'application/vnd.hearing.get-draft-result-v2+json'
      });
      expect(migrateDraftResultToVersion).toHaveBeenCalledWith(
        wrappedDraftResult,
        resultsService.version,
        {
          hearingId: 'hearingId',
          hearingDay: '2020-01-01',
          hearing: { id: 'hearingId' }
        },
        isBoxwork,
        firstSharedDate
      );
    });
  });

  describe('fetchSharedResult', () => {
    let resultLineIdSuffix: number;

    beforeEach(() => {
      resultLineIdSuffix = 0;
      notepadParserService.fetchParsedResultDefinition = jest
        .fn()
        .mockImplementation(({ shortCode }: { shortCode: string }) =>
          cold('--(r|)', { r: getParsedResultDefinitionByShortCode(shortCode) })
        );
    });

    const createSharedResultLineForShortcode = (shortCode: string): SharedResultLine => {
      const parsedResult = getParsedResultDefinitionByShortCode(shortCode);
      const mapResultPromptToSharedPrompt = ({
        promptId,
        promptRef,
        label,
        value,
        type
      }: DraftResultPrompt): any[] => {
        if (type === 'ONEOF') {
          return mapResultPromptToSharedPrompt(value as DraftResultPrompt);
        }
        if (type === 'NAMEADDRESS') {
          return flatten((value as DraftResultPrompt[]).map(mapResultPromptToSharedPrompt));
        }
        return [{ id: promptId, promptRef, value, label }];
      };

      resultLineIdSuffix += 1;

      return {
        resultLineId: `resultLineId${resultLineIdSuffix}`,
        caseId: 'caseId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId',
        shadowListed: false,
        orderedDate: '2020-01-01',
        level: 'OFFENCE',
        resultLabel: parsedResult.label,
        shortCode,
        sharedDate: '2020-01-02',
        resultDefinitionId: parsedResult.resultDefinitionId,
        prompts: flatten(
          createDraftResultPromptsForShortcode(shortCode).map(mapResultPromptToSharedPrompt)
        )
      };
    };

    it('should transform a shared result', done => {
      const sharedResult: SharedResult = {
        resultLines: [createSharedResultLineForShortcode('NCOSTS')],
        version: 1
      };

      cppHttp.query = jest.fn(() => cold('--(r|)', { r: sharedResult }));
      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      resultsService
        .fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
        .subscribe(draftResult => {
          expect(cppHttp.query).toHaveBeenCalledWith({
            requestType: 'application/vnd.hearing.get-share-result-v2+json',
            url: '/hearing-query-api/query/api/rest/hearing/hearings/hearingId/2020-01-01/share-results'
          });
          expect(draftResult).toMatchInlineSnapshot(`
            {
              "delegatedPowers": false,
              "hearingDay": "2020-01-01",
              "hearingId": "hearingId",
              "relations": [
                {
                  "childResultLineIds": [],
                  "resultLineId": "resultLineId1",
                  "ruleType": "standalone",
                },
              ],
              "resultLines": {
                "resultLineId1": {
                  "amendmentsLog": false,
                  "caseId": "caseId",
                  "childResultDefinitions": [],
                  "conditionalMandatory": false,
                  "defendantId": "defendantId",
                  "excludedFromResults": false,
                  "label": "No order for costs",
                  "masterDefendantId": "masterDefendantId",
                  "offenceId": "offenceId",
                  "orderedDate": "2020-01-01",
                  "originalText": "NCOSTS",
                  "promptChoices": [
                    {
                      "code": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Reason for no costs",
                      "maxLength": "500",
                      "minLength": "1",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 100,
                      "promptRef": "reasonForNoCosts",
                      "required": true,
                      "type": "TXT",
                    },
                  ],
                  "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
                  "resultLevel": "O",
                  "resultLineId": "resultLineId1",
                  "resultPrompts": [
                    {
                      "label": "Reason for no costs",
                      "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "promptRef": "reasonForNoCosts",
                      "type": "TXT",
                      "value": "*",
                    },
                  ],
                  "sharedDate": "2020-01-02T00:00:00.000Z",
                  "shortCode": "NCOSTS",
                  "unresolvedParts": [],
                  "valid": true,
                },
              },
              "shadowListedOffenceIds": [],
              "version": 1,
            }
          `);
          done();
        });

      getTestScheduler().flush();
    });

    it('should handle a result with no result lines', () => {
      const draftResult = createDraftResult();
      const sharedResult: SharedResult = { resultLines: [], version: 1 };
      const sharedResults$ = cold('-(r|)  ', { r: sharedResult });
      const deleteDraft$ = cold('   -(r|) ');
      const draftResult$ = cold('    -(r|)', { r: draftResult });
      const expected$ = cold('     ---(r|)', { r: draftResult });

      resultsService.fetchExtendedDraftResult = jest.fn(() => draftResult$);
      cppHttp.query = jest.fn(() => sharedResults$);
      cppHttp.commandSync = jest.fn(() => deleteDraft$);
      const isBoxwork = false;
      const firstSharedDate: string = undefined;

      expect(
        resultsService.fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
      ).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01',
        requestType: 'application/vnd.hearing.delete-draft-result-v2+json',
        successEvent: 'public.hearing.draft-result-deleted-v2',
        body: {
          hearingId: 'hearingId',
          hearingDay: '2020-01-01'
        }
      });
      expect(resultsService.fetchExtendedDraftResult).toHaveBeenCalledWith(
        'hearingId',
        '2020-01-01',
        isBoxwork,
        firstSharedDate
      );
    });

    it('should transform shared ONEOF and NAMEADDRESS prompts', done => {
      const sharedResult: SharedResult = {
        resultLines: [createSharedResultLineForShortcode('nordrc')],
        version: 1
      };

      cppHttp.query = () => cold('--(r|)', { r: sharedResult });
      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      resultsService
        .fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
        .subscribe(draftResult => {
          expect(draftResult).toMatchInlineSnapshot(`
            {
              "delegatedPowers": false,
              "hearingDay": "2020-01-01",
              "hearingId": "hearingId",
              "relations": [
                {
                  "childResultLineIds": [],
                  "resultLineId": "resultLineId1",
                  "ruleType": "standalone",
                },
              ],
              "resultLines": {
                "resultLineId1": {
                  "amendmentsLog": false,
                  "caseId": "caseId",
                  "childResultDefinitions": [],
                  "conditionalMandatory": false,
                  "defendantId": "defendantId",
                  "excludedFromResults": false,
                  "label": "Notification of electronic monitoring order (requirement)",
                  "masterDefendantId": "masterDefendantId",
                  "offenceId": "offenceId",
                  "orderedDate": "2020-01-01",
                  "originalText": "nordrc",
                  "promptChoices": [
                    {
                      "addressType": "Organisation",
                      "children": [
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor organisation name",
                          "partName": "OrganisationName",
                          "promptRef": "electronicmonitoringcontractorOrganisationName",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor address line 1",
                          "partName": "AddressLine1",
                          "promptRef": "electronicmonitoringcontractorAddress1",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor address line 2",
                          "partName": "AddressLine2",
                          "promptRef": "electronicmonitoringcontractorAddress2",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor address line 3",
                          "partName": "AddressLine3",
                          "promptRef": "electronicmonitoringcontractorAddress3",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor address line 4",
                          "partName": "AddressLine4",
                          "promptRef": "electronicmonitoringcontractorAddress4",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor address line 5",
                          "partName": "AddressLine5",
                          "promptRef": "electronicmonitoringcontractorAddress5",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor post code",
                          "partName": "PostCode",
                          "promptRef": "electronicmonitoringcontractorPostCode",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor email address 1",
                          "partName": "EmailAddress1",
                          "promptRef": "electronicmonitoringcontractorEmailAddress1",
                          "sequence": 100,
                          "type": "TXT",
                        },
                        {
                          "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "label": "Electronic monitoring contractor email address 2",
                          "partName": "EmailAddress2",
                          "promptRef": "electronicmonitoringcontractorEmailAddress2",
                          "sequence": 100,
                          "type": "TXT",
                        },
                      ],
                      "code": "92566757-ef79-4804-bced-c63ebb0937e7",
                      "componentLabel": "Electronic monitoring contractor",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Electronic monitoring contractor",
                      "listLabel": "Select Electronic monitoring contractor",
                      "nameAddressList": [],
                      "nameEmail": true,
                      "partName": "OrganisationName",
                      "promptOrder": 100,
                      "promptRef": "electronicmonitoringcontractor",
                      "required": true,
                      "type": "NAMEADDRESS",
                    },
                    {
                      "children": [
                        {
                          "code": "5ce30920-b300-471c-8fd7-67f3a193476a",
                          "label": "First notification of electronic monitoring",
                          "promptRef": "firstNotificationOfElectronicMonitoring",
                          "sequence": 0,
                          "type": "BOOLEAN",
                        },
                        {
                          "code": "efffc361-7cca-40a5-a436-a1fdb590e8be",
                          "label": "Variation of electronic monitoring. Date and case reference of original order",
                          "promptRef": "variationOfElectronicMonitoringDateOfOriginalOrder",
                          "sequence": 0,
                          "type": "TXT",
                        },
                        {
                          "code": "9cae4974-5cf4-4701-ae3a-74f8d586b16d",
                          "label": "Additional notification of electronic monitoring. Date and case reference of original order",
                          "promptRef": "additionalNotificationOfElectronicMonitoringDateOfOriginalOrder",
                          "sequence": 0,
                          "type": "TXT",
                        },
                        {
                          "code": "a7cc84b3-0c62-440d-b2d3-f4b40ef13c99",
                          "label": "Continuation of electronic monitoring",
                          "promptRef": "continuationOfElectronicMonitoring",
                          "sequence": 0,
                          "type": "BOOLEAN",
                        },
                      ],
                      "code": "5ce30920-b300-471c-8fd7-67f3a193476a",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "First notification of electronic monitoring",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 200,
                      "promptRef": "firstNotificationOfElectronicMonitoring",
                      "required": true,
                      "type": "ONEOF",
                    },
                    {
                      "code": "f6ca6307-bdab-42d3-968b-44485824b535",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Are there any additional requirements as well?",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 600,
                      "promptRef": "areThereAnyAdditionalRequirementsAsWell",
                      "required": true,
                      "type": "BOOLEAN",
                    },
                    {
                      "code": "380d5917-d860-4c6a-9fde-d5e7e1923331",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Defendant's mobile number",
                      "maxLength": "20",
                      "minLength": "1",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 700,
                      "promptRef": "defendantsMobileNumber",
                      "required": false,
                      "type": "INT",
                    },
                    {
                      "code": "cdc4f47c-612d-4f81-b321-a2b5861d6e19",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Was an interpreter used?",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 800,
                      "promptRef": "wasAnInterpreterUsed",
                      "required": true,
                      "type": "BOOLEAN",
                    },
                    {
                      "code": "c7d508e9-1ea0-4a41-9961-703a5d164b6f",
                      "durationSequence": 0,
                      "fixedList": [],
                      "hidden": false,
                      "label": "Language",
                      "maxLength": "60",
                      "minLength": "1",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 900,
                      "promptRef": "language",
                      "required": false,
                      "type": "FIXL",
                    },
                    {
                      "code": "5a386999-b2d9-45f4-9b68-57000ba2d6ef",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Does the offender have any special needs?",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 1000,
                      "promptRef": "doesTheOffenderHaveAnySpecialNeeds",
                      "required": true,
                      "type": "BOOLEAN",
                    },
                    {
                      "code": "c1503a10-f976-4d79-8073-3bc63b9d0641",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Special needs",
                      "maxLength": "120",
                      "minLength": "1",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 1100,
                      "promptRef": "specialNeeds",
                      "required": false,
                      "type": "TXT",
                    },
                  ],
                  "resultDefinitionId": "dada120c-160a-49a9-b040-e8b6b7128d67",
                  "resultLevel": "O",
                  "resultLineId": "resultLineId1",
                  "resultPrompts": [
                    {
                      "label": "Electronic monitoring contractor",
                      "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                      "promptRef": "electronicmonitoringcontractor",
                      "type": "NAMEADDRESS",
                      "value": [
                        {
                          "label": "Electronic monitoring contractor organisation name",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorOrganisationName",
                          "type": "TXT",
                          "value": "*",
                        },
                        {
                          "label": "Electronic monitoring contractor address line 1",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorAddress1",
                          "type": "TXT",
                          "value": "X",
                        },
                        {
                          "label": "Electronic monitoring contractor address line 2",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorAddress2",
                          "type": "TXT",
                          "value": "X",
                        },
                        {
                          "label": "Electronic monitoring contractor address line 3",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorAddress3",
                          "type": "TXT",
                          "value": "X",
                        },
                        {
                          "label": "Electronic monitoring contractor address line 4",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorAddress4",
                          "type": "TXT",
                          "value": "X",
                        },
                        {
                          "label": "Electronic monitoring contractor address line 5",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorAddress5",
                          "type": "TXT",
                          "value": "X",
                        },
                        {
                          "label": "Electronic monitoring contractor post code",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorPostCode",
                          "type": "TXT",
                          "value": "CR0 1XN",
                        },
                        {
                          "label": "Electronic monitoring contractor email address 1",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorEmailAddress1",
                          "type": "TXT",
                          "value": "foo@bar.org",
                        },
                        {
                          "label": "Electronic monitoring contractor email address 2",
                          "promptId": "92566757-ef79-4804-bced-c63ebb0937e7",
                          "promptRef": "electronicmonitoringcontractorEmailAddress2",
                          "type": "TXT",
                          "value": "foo@bar.org",
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
                      "label": "Are there any additional requirements as well?",
                      "promptId": "f6ca6307-bdab-42d3-968b-44485824b535",
                      "promptRef": "areThereAnyAdditionalRequirementsAsWell",
                      "type": "BOOLEAN",
                      "value": true,
                    },
                    {
                      "label": "Defendant's mobile number",
                      "promptId": "380d5917-d860-4c6a-9fde-d5e7e1923331",
                      "promptRef": "defendantsMobileNumber",
                      "type": "INT",
                      "value": 50,
                    },
                    {
                      "label": "Was an interpreter used?",
                      "promptId": "cdc4f47c-612d-4f81-b321-a2b5861d6e19",
                      "promptRef": "wasAnInterpreterUsed",
                      "type": "BOOLEAN",
                      "value": true,
                    },
                    {
                      "label": "Does the offender have any special needs?",
                      "promptId": "5a386999-b2d9-45f4-9b68-57000ba2d6ef",
                      "promptRef": "doesTheOffenderHaveAnySpecialNeeds",
                      "type": "BOOLEAN",
                      "value": true,
                    },
                    {
                      "label": "Special needs",
                      "promptId": "c1503a10-f976-4d79-8073-3bc63b9d0641",
                      "promptRef": "specialNeeds",
                      "type": "TXT",
                      "value": "*",
                    },
                  ],
                  "sharedDate": "2020-01-02T00:00:00.000Z",
                  "shortCode": "nordrc",
                  "unresolvedParts": [],
                  "valid": true,
                },
              },
              "shadowListedOffenceIds": [],
              "version": 1,
            }
          `);
          done();
        });

      getTestScheduler().flush();
    });

    it('should transform a shared result with delegated powers', done => {
      const sharedResult: SharedResult = {
        resultLines: [
          {
            ...createSharedResultLineForShortcode('NCOSTS'),
            delegatedPowers: {
              userId: '*',
              firstName: 'James',
              lastName: 'Gray'
            }
          }
        ],
        version: 1
      };

      cppHttp.query = () => cold('--(r|)', { r: sharedResult });
      const isBoxwork = false;
      const firstSharedDate: string = undefined;

      resultsService
        .fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
        .subscribe(draftResult => {
          expect(draftResult.delegatedPowers).toBe(true);
          done();
        });
      getTestScheduler().flush();
    });

    it('should transform a shared result with shadow listed offence ids', done => {
      const sharedResult: SharedResult = {
        resultLines: [
          {
            ...createSharedResultLineForShortcode('NCOSTS'),
            offenceId: 'offenceId1',
            shadowListed: false
          },
          {
            ...createSharedResultLineForShortcode('vulnerability'),
            offenceId: 'offenceId2',
            shadowListed: true
          }
        ],
        version: 1
      };

      cppHttp.query = () => cold('--(r|)', { r: sharedResult });
      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      resultsService
        .fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
        .subscribe(draftResult => {
          expect(draftResult.shadowListedOffenceIds).toEqual(['offenceId2']);
          done();
        });
      getTestScheduler().flush();
    });

    it('should transform a shared result with amendments', done => {
      const sharedResult: SharedResult = {
        resultLines: [
          {
            ...createSharedResultLineForShortcode('NCOSTS'),
            amendmentDate: '2020-01-31',
            amendmentReason: 'Amendment reason',
            amendmentReasonId: 'amendmentReasonId'
          }
        ],
        version: 1
      };

      cppHttp.query = () => cold('--(r|)', { r: sharedResult });
      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      resultsService
        .fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
        .subscribe(draftResult => {
          expect(draftResult).toMatchInlineSnapshot(`
            {
              "delegatedPowers": false,
              "hearingDay": "2020-01-01",
              "hearingId": "hearingId",
              "relations": [
                {
                  "childResultLineIds": [],
                  "resultLineId": "resultLineId1",
                  "ruleType": "standalone",
                },
              ],
              "resultLines": {
                "resultLineId1": {
                  "amendmentDate": "2020-01-31",
                  "amendmentReason": {
                    "id": "amendmentReasonId",
                    "reasonDescription": "Amendment reason",
                  },
                  "amendmentsLog": false,
                  "caseId": "caseId",
                  "childResultDefinitions": [],
                  "conditionalMandatory": false,
                  "defendantId": "defendantId",
                  "excludedFromResults": false,
                  "label": "No order for costs",
                  "masterDefendantId": "masterDefendantId",
                  "offenceId": "offenceId",
                  "orderedDate": "2020-01-01",
                  "originalText": "NCOSTS",
                  "promptChoices": [
                    {
                      "code": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Reason for no costs",
                      "maxLength": "500",
                      "minLength": "1",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 100,
                      "promptRef": "reasonForNoCosts",
                      "required": true,
                      "type": "TXT",
                    },
                  ],
                  "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
                  "resultLevel": "O",
                  "resultLineId": "resultLineId1",
                  "resultPrompts": [
                    {
                      "label": "Reason for no costs",
                      "promptId": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                      "promptRef": "reasonForNoCosts",
                      "type": "TXT",
                      "value": "*",
                    },
                  ],
                  "sharedDate": "2020-01-31T00:00:00.000Z",
                  "shortCode": "NCOSTS",
                  "unresolvedParts": [],
                  "valid": true,
                },
              },
              "shadowListedOffenceIds": [],
              "version": 1,
            }
          `);
          done();
        });
      getTestScheduler().flush();
    });

    it('should transform a shared result with child relations', done => {
      const childResultLine = createSharedResultLineForShortcode('rinstl');
      const parentResultLine: SharedResultLine = {
        ...createSharedResultLineForShortcode('rt'),
        childResultLineIds: [childResultLine.resultLineId]
      };
      const sharedResult: SharedResult = {
        resultLines: [parentResultLine, childResultLine],
        version: 1
      };

      cppHttp.query = () => cold('--(r|)', { r: sharedResult });

      const isBoxwork = false;
      const firstSharedDate: string = undefined;
      resultsService
        .fetchSharedResult('hearingId', '2020-01-01', isBoxwork, firstSharedDate)
        .subscribe(draftResult => {
          expect(draftResult).toMatchInlineSnapshot(`
            {
              "delegatedPowers": false,
              "hearingDay": "2020-01-01",
              "hearingId": "hearingId",
              "relations": [
                {
                  "childResultLineIds": [
                    "resultLineId1",
                  ],
                  "resultLineId": "resultLineId2",
                  "ruleType": "standalone",
                },
                {
                  "childResultLineIds": [],
                  "resultLineId": "resultLineId1",
                  "ruleType": "oneOf",
                },
              ],
              "resultLines": {
                "resultLineId1": {
                  "amendmentsLog": false,
                  "caseId": "caseId",
                  "childResultDefinitions": [],
                  "conditionalMandatory": false,
                  "defendantId": "defendantId",
                  "excludedFromResults": false,
                  "label": "Reserve Terms Instalments only",
                  "masterDefendantId": "masterDefendantId",
                  "offenceId": "offenceId",
                  "orderedDate": "2020-01-01",
                  "originalText": "rinstl",
                  "promptChoices": [
                    {
                      "code": "1393acda-7a35-4d65-859d-6298e1470cf1",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Instalment amount",
                      "maxLength": "1000000000",
                      "minLength": "0",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 100,
                      "promptRef": "IAMT",
                      "required": true,
                      "type": "CURR",
                    },
                    {
                      "code": "f2a61e80-c13e-4f44-8e91-8ce23e85596b",
                      "durationSequence": 0,
                      "fixedList": [
                        "fortnightly",
                        "monthly",
                        "weekly",
                      ],
                      "hidden": false,
                      "label": "Payment frequency",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 200,
                      "promptRef": "PF",
                      "required": true,
                      "type": "FIXL",
                    },
                    {
                      "code": "b487696e-dfc9-4c89-80d3-337a4319e925",
                      "durationSequence": 0,
                      "hidden": false,
                      "label": "Instalment start date",
                      "nameAddressList": [],
                      "nameEmail": false,
                      "promptOrder": 300,
                      "promptRef": "instalmentStartDate",
                      "required": true,
                      "type": "DATE",
                    },
                  ],
                  "resultDefinitionId": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
                  "resultLevel": "O",
                  "resultLineId": "resultLineId1",
                  "resultPrompts": [
                    {
                      "label": "Instalment amount",
                      "promptId": "1393acda-7a35-4d65-859d-6298e1470cf1",
                      "promptRef": "IAMT",
                      "type": "CURR",
                      "value": "100",
                    },
                    {
                      "label": "Payment frequency",
                      "promptId": "f2a61e80-c13e-4f44-8e91-8ce23e85596b",
                      "promptRef": "PF",
                      "type": "FIXL",
                      "value": "fortnightly",
                    },
                    {
                      "label": "Instalment start date",
                      "promptId": "b487696e-dfc9-4c89-80d3-337a4319e925",
                      "promptRef": "instalmentStartDate",
                      "type": "DATE",
                      "value": "2020-01-01",
                    },
                  ],
                  "sharedDate": "2020-01-02T00:00:00.000Z",
                  "shortCode": "rinstl",
                  "unresolvedParts": [],
                  "valid": true,
                },
                "resultLineId2": {
                  "amendmentsLog": false,
                  "caseId": "caseId",
                  "childResultDefinitions": [
                    {
                      "code": "9ba8f03a-5dda-11e8-9c2d-fa7ae01bbebc",
                      "excludedFromResults": false,
                      "label": "Reserve Terms Instalments only",
                      "ruleType": "oneOf",
                      "shortCode": "rinstl",
                    },
                    {
                      "code": "d6e93aae-5dd7-11e8-9c2d-fa7ae01bbebc",
                      "excludedFromResults": false,
                      "label": "Reserve Terms Lump sum plus instalments",
                      "ruleType": "oneOf",
                      "shortCode": "rlsumi",
                    },
                    {
                      "code": "a09bbfa0-5dd5-11e8-9c2d-fa7ae01bbebc",
                      "excludedFromResults": false,
                      "label": "Reserve Terms Lump sum",
                      "ruleType": "oneOf",
                      "shortCode": "rlsum",
                    },
                  ],
                  "conditionalMandatory": false,
                  "defendantId": "defendantId",
                  "excludedFromResults": true,
                  "label": "Reserve Terms",
                  "masterDefendantId": "masterDefendantId",
                  "offenceId": "offenceId",
                  "orderedDate": "2020-01-01",
                  "originalText": "rt",
                  "promptChoices": [],
                  "resultDefinitionId": "4871697d-6dd1-4da2-8894-707e6b13c361",
                  "resultLevel": "O",
                  "resultLineId": "resultLineId2",
                  "resultPrompts": [],
                  "sharedDate": "2020-01-02T00:00:00.000Z",
                  "shortCode": "rt",
                  "unresolvedParts": [],
                  "valid": true,
                },
              },
              "shadowListedOffenceIds": [],
              "version": 1,
            }
          `);
          done();
        });
      getTestScheduler().flush();
    });
  });

  describe('rejectAmendments', () => {
    it('should reject amendments via the api', () => {
      const draftResult = createDraftResult();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)');

      cppHttp.commandSync = jest.fn(() => response$);

      expect(resultsService.rejectAmendments(draftResult, 'userId')).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/validate-result-amendments',
        requestType: 'application/vnd.hearing.validate-result-amendments+json',
        successEvent: 'public.hearing.result-amendments-rejected',
        errorEvent: 'public.hearing.manage-results-failed',
        body: {
          id: 'hearingId',
          hearingDay: '2020-01-01',
          version: 1,
          userId: 'userId',
          validateAction: 'REJECT'
        }
      });
    });
  });

  describe('shareDraftResult', () => {
    const userDetails = {
      userId: 'userId',
      firstName: 'James',
      lastName: 'Gray'
    } as UserDetails;

    let draftResultBuilder: DraftResultBuilder;

    beforeEach(async () => {
      draftResultBuilder = new DraftResultBuilder();
      Date.now = () => new Date(2020, 0, 31).getTime();
    });

    it('should share a basic draft result', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'ncosts',
        orderedDate: '2020-01-01',
        caseId: 'caseId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('ncosts')
      });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(`
        {
          "body": {
            "courtClerk": {
              "firstName": "James",
              "lastName": "Gray",
              "userId": "userId",
            },
            "resultLines": [
              {
                "caseId": "caseId",
                "childResultLineIds": [],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isModified": true,
                "level": "CASE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-20",
                "prompts": [
                  {
                    "id": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                    "label": "Reason for no costs",
                    "promptRef": "reasonForNoCosts",
                    "value": "*",
                  },
                ],
                "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
                "resultLabel": "No order for costs",
                "resultLineId": "UUID:1",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "NCOSTS",
              },
            ],
            "version": 1,
          },
          "errorEvent": "public.hearing.manage-results-failed",
          "requestType": "application/vnd.hearing.shared-results+json",
          "successEvent": "public.events.hearing.hearing-resulted-success",
          "timeout": 60000,
          "url": "/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01",
        }
      `);
      expect((resultsService['mapSharedResultToDraftResult'] as jest.Mock).mock.calls[0])
        .toMatchInlineSnapshot(`
        [
          "hearingId",
          "2020-01-01",
          {
            "courtClerk": {
              "firstName": "James",
              "lastName": "Gray",
              "userId": "userId",
            },
            "resultLines": [
              {
                "caseId": "caseId",
                "childResultLineIds": [],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isModified": true,
                "level": "CASE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-20",
                "prompts": [
                  {
                    "id": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                    "label": "Reason for no costs",
                    "promptRef": "reasonForNoCosts",
                    "value": "*",
                  },
                ],
                "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
                "resultLabel": "No order for costs",
                "resultLineId": "UUID:1",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "NCOSTS",
              },
            ],
            "version": 1,
          },
        ]
      `);
    });

    it('should trim the childResultLineIds of a parent with a deleted child', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'BAIC',
        orderedDate: '2020-01-01',
        caseId: 'caseId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'PORE10',
        orderedDate: '2020-01-01'
      });
      await draftResultBuilder.setSharedDateForAllResultLines('2020-01-01');
      await draftResultBuilder.setAmendmentReasonForAllResultLines({
        id: '*',
        reasonDescription: '*'
      });
      await draftResultBuilder.destroyResultLine('UUID:2');

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(`
        {
          "body": {
            "courtClerk": {
              "firstName": "James",
              "lastName": "Gray",
              "userId": "userId",
            },
            "resultLines": [
              {
                "amendmentDate": "2020-01-02",
                "amendmentReason": "*",
                "amendmentReasonId": "*",
                "caseId": "caseId",
                "childResultLineIds": [],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isModified": true,
                "level": "OFFENCE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-12",
                "prompts": [],
                "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
                "resultLabel": "Bail conditions",
                "resultLineId": "UUID:1",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "BAIC",
              },
              {
                "amendmentDate": "2020-01-02",
                "amendmentReason": "*",
                "amendmentReasonId": "*",
                "caseId": "caseId",
                "childResultLineIds": [],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isDeleted": true,
                "isModified": true,
                "level": "OFFENCE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-12",
                "prompts": [],
                "resultDefinitionId": "3c98b287-fd01-471a-ac34-e0a56d9e95c2",
                "resultLabel": "Exclusion - not to sit in the front seat of any motor vehicle",
                "resultLineId": "UUID:2",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "PORE10",
              },
            ],
            "version": 1,
          },
          "errorEvent": "public.hearing.manage-results-failed",
          "requestType": "application/vnd.hearing.shared-results+json",
          "successEvent": "public.events.hearing.hearing-resulted-success",
          "timeout": 60000,
          "url": "/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01",
        }
      `);
    });

    it('should share a draft result with children', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'BAIC',
        orderedDate: '2020-01-01',
        caseId: 'caseId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId'
      });
      await draftResultBuilder.addChild({
        belongsToResultLineId: 'UUID:1',
        shortCode: 'PORE10',
        orderedDate: '2020-01-01'
      });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(`
        {
          "body": {
            "courtClerk": {
              "firstName": "James",
              "lastName": "Gray",
              "userId": "userId",
            },
            "resultLines": [
              {
                "caseId": "caseId",
                "childResultLineIds": [
                  "UUID:2",
                ],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isModified": true,
                "level": "OFFENCE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-12",
                "prompts": [],
                "resultDefinitionId": "8cf3b54b-bec8-4bcf-aac4-62561dcc8080",
                "resultLabel": "Bail conditions",
                "resultLineId": "UUID:1",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "BAIC",
              },
              {
                "caseId": "caseId",
                "childResultLineIds": [],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isModified": true,
                "level": "OFFENCE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-12",
                "prompts": [],
                "resultDefinitionId": "3c98b287-fd01-471a-ac34-e0a56d9e95c2",
                "resultLabel": "Exclusion - not to sit in the front seat of any motor vehicle",
                "resultLineId": "UUID:2",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "PORE10",
              },
            ],
            "version": 1,
          },
          "errorEvent": "public.hearing.manage-results-failed",
          "requestType": "application/vnd.hearing.shared-results+json",
          "successEvent": "public.events.hearing.hearing-resulted-success",
          "timeout": 60000,
          "url": "/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01",
        }
      `);
    });

    it('should share a draft result with a ONEOF and NAMEADDRESS prompt choice', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'nordrc',
        orderedDate: '2020-01-01',
        caseId: 'caseId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('nordrc')
      });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(`
        {
          "body": {
            "courtClerk": {
              "firstName": "James",
              "lastName": "Gray",
              "userId": "userId",
            },
            "resultLines": [
              {
                "caseId": "caseId",
                "childResultLineIds": [],
                "defendantId": "defendantId",
                "draftResult": "{}",
                "isComplete": true,
                "isModified": true,
                "level": "OFFENCE",
                "masterDefendantId": "masterDefendantId",
                "offenceId": "offenceId",
                "orderedDate": "2021-05-12",
                "prompts": [
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor organisation name",
                    "promptRef": "electronicmonitoringcontractorOrganisationName",
                    "value": "*",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor address line 1",
                    "promptRef": "electronicmonitoringcontractorAddress1",
                    "value": "X",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor address line 2",
                    "promptRef": "electronicmonitoringcontractorAddress2",
                    "value": "X",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor address line 3",
                    "promptRef": "electronicmonitoringcontractorAddress3",
                    "value": "X",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor address line 4",
                    "promptRef": "electronicmonitoringcontractorAddress4",
                    "value": "X",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor address line 5",
                    "promptRef": "electronicmonitoringcontractorAddress5",
                    "value": "X",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor post code",
                    "promptRef": "electronicmonitoringcontractorPostCode",
                    "value": "CR0 1XN",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor email address 1",
                    "promptRef": "electronicmonitoringcontractorEmailAddress1",
                    "value": "foo@bar.org",
                  },
                  {
                    "id": "92566757-ef79-4804-bced-c63ebb0937e7",
                    "label": "Electronic monitoring contractor email address 2",
                    "promptRef": "electronicmonitoringcontractorEmailAddress2",
                    "value": "foo@bar.org",
                  },
                  {
                    "id": "5ce30920-b300-471c-8fd7-67f3a193476a",
                    "label": "First notification of electronic monitoring",
                    "promptRef": "firstNotificationOfElectronicMonitoring",
                    "value": "true",
                  },
                  {
                    "id": "f6ca6307-bdab-42d3-968b-44485824b535",
                    "label": "Are there any additional requirements as well?",
                    "promptRef": "areThereAnyAdditionalRequirementsAsWell",
                    "value": "true",
                  },
                  {
                    "id": "380d5917-d860-4c6a-9fde-d5e7e1923331",
                    "label": "Defendant's mobile number",
                    "promptRef": "defendantsMobileNumber",
                    "value": "50",
                  },
                  {
                    "id": "cdc4f47c-612d-4f81-b321-a2b5861d6e19",
                    "label": "Was an interpreter used?",
                    "promptRef": "wasAnInterpreterUsed",
                    "value": "true",
                  },
                  {
                    "id": "5a386999-b2d9-45f4-9b68-57000ba2d6ef",
                    "label": "Does the offender have any special needs?",
                    "promptRef": "doesTheOffenderHaveAnySpecialNeeds",
                    "value": "true",
                  },
                  {
                    "id": "c1503a10-f976-4d79-8073-3bc63b9d0641",
                    "label": "Special needs",
                    "promptRef": "specialNeeds",
                    "value": "*",
                  },
                ],
                "resultDefinitionId": "dada120c-160a-49a9-b040-e8b6b7128d67",
                "resultLabel": "Notification of electronic monitoring order (requirement)",
                "resultLineId": "UUID:1",
                "shadowListed": false,
                "sharedDate": "2020-01-31",
                "shortCode": "nordrc",
              },
            ],
            "version": 1,
          },
          "errorEvent": "public.hearing.manage-results-failed",
          "requestType": "application/vnd.hearing.shared-results+json",
          "successEvent": "public.events.hearing.hearing-resulted-success",
          "timeout": 60000,
          "url": "/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01",
        }
      `);
    });

    it('should share a draft result with an amendment', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'ncosts',
        orderedDate: '2020-01-01',
        caseId: 'caseId',
        defendantId: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        offenceId: 'offenceId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('ncosts')
      });
      await draftResultBuilder.setAmendmentReason({
        resultLineId: 'UUID:1',
        amendmentDate: '2020-01-02',
        amendmentReason: {
          id: 'amendmentReasonId',
          reasonDescription: 'amendmentReasonDescription'
        },
        userDetails
      });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0].body).toMatchInlineSnapshot(`
        {
          "courtClerk": {
            "firstName": "James",
            "lastName": "Gray",
            "userId": "userId",
          },
          "resultLines": [
            {
              "amendmentDate": "2020-01-02",
              "amendmentReason": "amendmentReasonDescription",
              "amendmentReasonId": "amendmentReasonId",
              "amendmentsLog": "{"isAmended":true,"isCurrentlyAdded":true,"resultWithoutPrompts":false,"amendmentsRecord":[{"resultPromptsRecord":[{"promptRef":"reasonForNoCosts","promptId":"be2a46db-709d-4e0d-9b63-aeb831564c1d","label":"Reason for no costs","type":"TXT","value":"*"}],"amendmentReason":{"id":"amendmentReasonId","reasonDescription":"amendmentReasonDescription"},"amendmentDate":"2020-01-02","amendedBy":"FirstName Lastname"}]}",
              "caseId": "caseId",
              "childResultLineIds": [],
              "defendantId": "defendantId",
              "draftResult": "{}",
              "isComplete": true,
              "isModified": true,
              "level": "CASE",
              "masterDefendantId": "masterDefendantId",
              "offenceId": "offenceId",
              "orderedDate": "2021-05-20",
              "prompts": [
                {
                  "id": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "label": "Reason for no costs",
                  "promptRef": "reasonForNoCosts",
                  "value": "*",
                },
              ],
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLabel": "No order for costs",
              "resultLineId": "UUID:1",
              "shadowListed": false,
              "sharedDate": "2020-01-31",
              "shortCode": "NCOSTS",
            },
          ],
          "version": 1,
        }
      `);
    });

    it('should share a result with shadow listed offences', async () => {
      await draftResultBuilder.setShadowListedOffenceIds(['offenceId']);

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0].body).toMatchInlineSnapshot(`
        {
          "courtClerk": {
            "firstName": "James",
            "lastName": "Gray",
            "userId": "userId",
          },
          "resultLines": [],
          "version": 1,
        }
      `);
    });

    it('should use the correct modified state when resharing non-amended result lines', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'ncosts',
        orderedDate: '2020-01-01',
        applicationId: 'applicationId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('ncosts')
      });
      await draftResultBuilder.setSharedDate({
        resultLineId: 'UUID:1',
        sharedDate: '2020-01-02'
      });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0].body).toMatchInlineSnapshot(`
        {
          "courtClerk": {
            "firstName": "James",
            "lastName": "Gray",
            "userId": "userId",
          },
          "resultLines": [
            {
              "applicationId": "applicationId",
              "childResultLineIds": [],
              "draftResult": "{}",
              "isComplete": true,
              "isModified": false,
              "level": "CASE",
              "orderedDate": "2021-05-20",
              "prompts": [
                {
                  "id": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "label": "Reason for no costs",
                  "promptRef": "reasonForNoCosts",
                  "value": "*",
                },
              ],
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLabel": "No order for costs",
              "resultLineId": "UUID:1",
              "shadowListed": false,
              "sharedDate": "2020-01-31",
              "shortCode": "NCOSTS",
            },
          ],
          "version": 1,
        }
      `);
    });

    it('should use the correct modified state when resharing a previously amended result line', async () => {
      await draftResultBuilder.parseTextOptions({
        originalText: 'ncosts',
        orderedDate: '2020-01-01',
        applicationId: 'applicationId'
      });
      await draftResultBuilder.updateResultPrompts({
        resultLineId: 'UUID:1',
        resultPrompts: createDraftResultPromptsForShortcode('ncosts')
      });
      await draftResultBuilder.setAmendmentReason({
        resultLineId: 'UUID:1',
        amendmentDate: '2020-01-02',
        amendmentReason: {
          id: '*',
          reasonDescription: '*'
        },
        userDetails
      });
      await draftResultBuilder.setSharedDate({
        resultLineId: 'UUID:1',
        sharedDate: '2020-01-02'
      });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0].body).toMatchInlineSnapshot(`
        {
          "courtClerk": {
            "firstName": "James",
            "lastName": "Gray",
            "userId": "userId",
          },
          "resultLines": [
            {
              "amendmentDate": "2020-01-02",
              "amendmentReason": "*",
              "amendmentReasonId": "*",
              "amendmentsLog": "{"isAmended":true,"isCurrentlyAdded":true,"resultWithoutPrompts":false,"amendmentsRecord":[{"resultPromptsRecord":[{"promptRef":"reasonForNoCosts","promptId":"be2a46db-709d-4e0d-9b63-aeb831564c1d","label":"Reason for no costs","type":"TXT","value":"*"}],"amendmentReason":{"id":"*","reasonDescription":"*"},"amendmentDate":"2020-01-02","amendedBy":"FirstName Lastname"}]}",
              "applicationId": "applicationId",
              "childResultLineIds": [],
              "draftResult": "{}",
              "isComplete": true,
              "isModified": false,
              "level": "CASE",
              "orderedDate": "2021-05-20",
              "prompts": [
                {
                  "id": "be2a46db-709d-4e0d-9b63-aeb831564c1d",
                  "label": "Reason for no costs",
                  "promptRef": "reasonForNoCosts",
                  "value": "*",
                },
              ],
              "resultDefinitionId": "baf94928-04ae-4609-8e96-efc9f081b2be",
              "resultLabel": "No order for costs",
              "resultLineId": "UUID:1",
              "shadowListed": false,
              "sharedDate": "2020-01-31",
              "shortCode": "NCOSTS",
            },
          ],
          "version": 1,
        }
      `);
    });

    it('should share a draft result with delegated powers', async () => {
      await draftResultBuilder.setDelegatedPowers({ delegatedPowers: true, userDetails });

      const sharedDraftResult = createDraftResult<ResolvedDraftResultLine>();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: sharedDraftResult });

      cppHttp.commandSync = jest.fn(() => response$);
      resultsService['mapSharedResultToDraftResult'] = jest.fn(() => of(sharedDraftResult));
      const isBoxWork = false;
      const firstSharedDate: string = undefined;
      const result$ = resultsService.shareDraftResult(
        draftResultBuilder.draftResult,
        userDetails,
        isBoxWork,
        firstSharedDate
      );

      expect(result$).toBeObservable(expected$);
      expect((cppHttp.commandSync as jest.Mock).mock.calls[0][0].body).toMatchInlineSnapshot(`
        {
          "courtClerk": {
            "firstName": "James",
            "lastName": "Gray",
            "userId": "userId",
          },
          "resultLines": [],
          "version": 1,
        }
      `);
    });
  });

  describe('requestApprovalForAmendments', () => {
    it('should request approval for amendments via the api', () => {
      const draftResult = createDraftResult();
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)');

      cppHttp.commandSync = jest.fn(() => response$);

      expect(resultsService.requestApprovalForAmendments(draftResult)).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/request-approval',
        requestType: 'application/vnd.hearing.request-approval+json',
        successEvent: 'public.hearing.approval-requested',
        errorEvent: 'public.hearing.manage-results-failed',
        body: {
          hearingId: 'hearingId',
          hearingDay: '2020-01-01',
          version: 1
        }
      });
    });
  });

  describe('saveDraftResult', () => {
    it('should save an uncompressed draft result', () => {
      const draftResult = { ...createDraftResult({ results: ['CREFT'] }) };
      const unwrappedDraftResult = extendDraftResult(draftResult);
      const wrappedDraftResult = {
        ...draftResult,
        version: 2,
        __metadata__: {
          version: resultsService.version
        }
      };
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: { ...draftResult, version: 2 } });

      cppHttp.commandSync = jest.fn(() => response$);

      expect(resultsService.saveDraftResult(unwrappedDraftResult)).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01',
        requestType: 'application/vnd.hearing.save-draft-result-v2+json',
        successEvent: 'public.hearing.draft-result-saved',
        errorEvent: 'public.hearing.manage-results-failed',
        background: true,
        body: wrappedDraftResult
      });
    });

    it('should compress the draft result when the `compressionEnabled` app configuration is true', () => {
      appConfigService.compressionEnabled = true;

      const draftResult = { ...createDraftResult({ results: ['CREFT'] }) };
      const unwrappedDraftResult = extendDraftResult(draftResult);
      const compressedDraftResult = {
        body: LZString.compress(JSON.stringify({ ...draftResult, version: 2 })),
        __metadata__: {
          version: resultsService.version
        }
      };
      const response$ = cold('--(r|)');
      const expected$ = cold('--(r|)', { r: { ...draftResult, version: 2 } });

      cppHttp.commandSync = jest.fn(() => response$);

      expect(resultsService.saveDraftResult(unwrappedDraftResult)).toBeObservable(expected$);
      expect(cppHttp.commandSync).toHaveBeenCalledWith({
        url: '/hearing-command-api/command/api/rest/hearing/hearings/hearingId/2020-01-01',
        requestType: 'application/vnd.hearing.save-draft-result-v2+json',
        successEvent: 'public.hearing.draft-result-saved',
        errorEvent: 'public.hearing.manage-results-failed',
        background: true,
        body: compressedDraftResult
      });
    });
  });
});
