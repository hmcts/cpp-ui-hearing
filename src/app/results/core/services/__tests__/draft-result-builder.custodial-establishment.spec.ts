import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { provideCppCoreHttpServices } from '@cpp/core';
import { of } from 'rxjs';
import {
  AppState,
  HearingDetailResponse,
  LoadHearingDetailSuccessAction,
  reducers
} from '../../../../core';
import { FullNamePipe } from '../../../../shared';
import { DraftResultPrompt, ExtendedResolvedDraftResultLine } from '../../../results.interfaces';
import { DraftResultBuilder } from '../../testing';
import { DraftResultBuilderService } from '../draft-result-builder.service';
import { NotepadParserService } from '../notepad-parser.service';
import { ReusableInfoService } from '../reusable-info.service';

/**
 * CHD-2714 / CHD-3288 – 'Select prison' is pre-populated from the defendant's
 * custodial establishment in Edit Case when a custodial result is added.
 */
describe('DraftResultBuilderService – prison from custodial establishment (CHD-2714)', () => {
  let draftResultBuilder: DraftResultBuilder;
  let sessionCache: { promptRef: string; type: string; value: unknown }[];

  const orderedDate = '2021-01-01';

  const defendant = (id: string, caseId: string, masterDefendantId: string, prison?: string) => ({
    id,
    prosecutionCaseId: caseId,
    masterDefendantId,
    personDefendant: prison
      ? { custodialEstablishment: { id: prison, name: prison, custody: 'Prison' } }
      : {}
  });

  // D1 – HMP Bure; D2 – none on case1 but HMP/YOI Eastwood Park on case2 (matched); D3 – none anywhere
  const hearing = {
    id: 'hearingId',
    prosecutionCases: [
      {
        id: 'case1',
        defendants: [
          defendant('D1', 'case1', 'MD1', 'HMP Bure'),
          defendant('D2', 'case1', 'MD2'),
          defendant('D3', 'case1', 'MD3')
        ]
      },
      { id: 'case2', defendants: [defendant('D2-case2', 'case2', 'MD2', 'HMP/YOI Eastwood Park')] }
    ]
  };

  const target = (
    defendantId: string,
    masterDefendantId: string,
    offenceId = `${defendantId}-O1`
  ) => ({
    caseId: 'case1',
    defendantId,
    masterDefendantId,
    offenceId
  });

  const addRi = (defendantId: string, masterDefendantId: string, offenceId?: string) =>
    draftResultBuilder.parseTextOptions({
      ...target(defendantId, masterDefendantId, offenceId),
      originalText: 'ri',
      orderedDate
    });

  const resultLineFor = (offenceId: string): ExtendedResolvedDraftResultLine =>
    Object.values(draftResultBuilder.draftResult.resultLines).find(
      line => 'offenceId' in line && line.offenceId === offenceId && 'resultPrompts' in line
    ) as ExtendedResolvedDraftResultLine;

  const prisonOf = (offenceId: string): Record<string, unknown> | undefined => {
    const prison = resultLineFor(offenceId)?.resultPrompts.find(
      prompt => prompt.promptRef === 'prison'
    );

    return prison
      ? (prison.value as DraftResultPrompt[]).reduce(
          (parts, child) => ({ ...parts, [child.promptRef]: child.value }),
          {} as Record<string, unknown>
        )
      : undefined;
  };

  beforeEach(() => {
    sessionCache = [];
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        provideStore(reducers, {
          initialState: { hearings: { current: { hearing } } } as unknown as AppState,
          runtimeChecks: {}
        }),
        provideRouter([]),
        DraftResultBuilderService,
        {
          provide: ReusableInfoService,
          useValue: {
            getValuesForResultLine: jest.fn(() => of(sessionCache)),
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

  describe('when a custodial result is added in the notepad', () => {
    it("should pre-populate the prison, with its emails, from the defendant's custodial establishment (AC1)", async () => {
      await addRi('D1', 'MD1');

      expect(prisonOf('D1-O1')).toEqual({
        prisonOrganisationName: 'HMP Bure',
        prisonEmailAddress1: 'OMU.Bure@justice.gov.uk'
      });
    });

    it('should pre-populate each defendant with their own establishment, incl. a matched case (AC1A, AC9a)', async () => {
      await addRi('D1', 'MD1');
      await addRi('D2', 'MD2');

      expect(prisonOf('D1-O1')?.prisonOrganisationName).toBe('HMP Bure');
      expect(prisonOf('D2-O1')?.prisonOrganisationName).toBe('HMP/YOI Eastwood Park');
    });

    it('should prefer the establishment over the last prison of the session, which still applies otherwise (AC3, AC4)', async () => {
      sessionCache = [
        {
          promptRef: 'prison',
          type: 'NAMEADDRESS',
          value: { prisonOrganisationName: 'HMP/YOI High Down' }
        }
      ];
      await addRi('D1', 'MD1');
      await addRi('D3', 'MD3');

      expect(prisonOf('D1-O1')?.prisonOrganisationName).toBe('HMP Bure');
      expect(prisonOf('D3-O1')?.prisonOrganisationName).toBe('HMP/YOI High Down');
    });

    it('should leave the prison blank without an establishment or session value (AC2, AC5)', async () => {
      await addRi('D3', 'MD3');

      expect(resultLineFor('D3-O1')).toBeDefined();
      expect(prisonOf('D3-O1')).toBeUndefined();
    });

    it('should use the latest hearing data at the point the result is added (AC8)', async () => {
      await addRi('D3', 'MD3');
      expect(prisonOf('D3-O1')).toBeUndefined();

      // Edit Case updated while the notepad is open: the hearing is reloaded into the store
      TestBed.inject(Store).dispatch(
        new LoadHearingDetailSuccessAction({
          hearing: {
            ...hearing,
            prosecutionCases: [
              {
                ...hearing.prosecutionCases[0],
                defendants: [
                  defendant('D1', 'case1', 'MD1', 'HMP Bure'),
                  defendant('D2', 'case1', 'MD2'),
                  defendant('D3', 'case1', 'MD3', 'HMP/YOI Eastwood Park')
                ]
              },
              hearing.prosecutionCases[1]
            ]
          }
        } as unknown as HearingDetailResponse)
      );
      await addRi('D3', 'MD3', 'D3-O2');

      expect(prisonOf('D3-O2')?.prisonOrganisationName).toBe('HMP/YOI Eastwood Park');
    });
  });

  describe('when a custodial result is copied to other defendants (AC1B)', () => {
    it("should use each target defendant's own establishment", async () => {
      await addRi('D1', 'MD1');
      await draftResultBuilder.copyResultLines([
        { originalResultLineId: resultLineFor('D1-O1').resultLineId, ...target('D2', 'MD2') }
      ]);

      expect(prisonOf('D1-O1')?.prisonOrganisationName).toBe('HMP Bure');
      expect(prisonOf('D2-O1')).toEqual({
        prisonOrganisationName: 'HMP/YOI Eastwood Park',
        prisonEmailAddress1: 'Custody.Eastwoodpark@justice.gov.uk',
        prisonEmailAddress2: 'Reception.EastwoodPark@justice.gov.uk'
      });
    });

    it('should keep the copied prison when the target defendant has no establishment', async () => {
      await addRi('D1', 'MD1');
      await draftResultBuilder.copyResultLines([
        { originalResultLineId: resultLineFor('D1-O1').resultLineId, ...target('D3', 'MD3') }
      ]);

      expect(prisonOf('D3-O1')?.prisonOrganisationName).toBe('HMP Bure');
    });
  });
});
