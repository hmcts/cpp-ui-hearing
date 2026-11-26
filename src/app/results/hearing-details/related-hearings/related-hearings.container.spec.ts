import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganisationUnit } from '@cpp/reference-data';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AppConfigService } from '../../../config';
import { CourtCentre, RelatedHearingSlot } from '../../../core';
import { JurisdictionTypes } from '../../../hearing-events-log/core/models/jurisdiction-types';
import { createDraftResult, extendDraftResult } from '../../core/testing';
import { DraftResultPrompt } from '../../results.interfaces';
import { RelatedHearingsContainer } from './related-hearings.container';

describe('RelatedHearingsContainer', () => {
  let store: MockStore;
  let storeNextSpy: jest.Mock;

  const hearingId = 'HEARINGID1';
  const draftResult = extendDraftResult(createDraftResult({ results: ['NHMC'] }));
  const resultLineId = Object.keys(draftResult.resultLines)[0];

  const relatedHearingSlot: RelatedHearingSlot = {
    startTime: '2020-01-01T10:00:00.000Z',
    courtCentreId: 'COURT001',
    courtRoomId: 'ROOM001',
    estimatedMinutes: 30,
    hearingType: 'Trial',
    hearingId: 'EXISTINGHEARINGID',
    courtScheduleId: 'COURTSCHEDULEID'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RelatedHearingsContainer],
      providers: [
        provideMockStore({ initialState: { results: { draftResult } } }),
        provideTranslateService(),
        { provide: AppConfigService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { hearingId, resultLineId }, data: {} } }
        },
        { provide: Router, useValue: { navigate: jest.fn() } }
      ],
      teardown: { destroyAfterEach: false }
    });

    store = TestBed.inject(MockStore);
    (store as any).next = jest.fn((action: any) => {
      store.dispatch(action);
    });
    storeNextSpy = (store as any).next as jest.Mock;
  });

  describe('when attaching to an existing crown hearing', () => {
    it('should not set a booking reference', () => {
      const container = TestBed.createComponent(RelatedHearingsContainer).componentInstance;
      container.jurisdictionType = JurisdictionTypes.CROWN;
      container.courtCentres = [
        {
          id: 'COURT001',
          oucode: 'OUCODE1',
          courtrooms: [{ id: 'ROOM001', name: 'Courtroom 01' }]
        }
      ] as unknown as CourtCentre[];
      container.organisationUnits = [
        { oucode: 'OUCODE1', oucodeL3Name: 'Crown Court' }
      ] as OrganisationUnit[];

      container.hearingSelection(relatedHearingSlot);

      const { resultPrompts } = storeNextSpy.mock.calls.pop()[0];
      expect(
        resultPrompts.find(({ promptRef }: DraftResultPrompt) => promptRef === 'bookingReference')
      ).toBeUndefined();
    });
  });
});
