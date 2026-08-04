import { Router, provideRouter } from '@angular/router';
import { Store, provideStore, provideState } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { AppState, reducers } from '../../core';
import { LoadMagistratesHearingGuard } from './load-magistrates-hearings.guard';
import { magistratesHearingReducer } from './magistrates-hearing.reducer';
import { HearingSummary } from '../interfaces/magistrates-hearing.interface';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { HearingService } from '../../core/services/Hearing/hearing.service';

describe('LoadMagistratesHearingGuard', () => {
  let guard: LoadMagistratesHearingGuard;
  let store: Store<AppState>;
  let getHearingsForToday: jest.Mock;
  let navigate: jest.Mock;

  beforeEach(() => {
    navigate = jest.fn();
    getHearingsForToday = jest.fn().mockReturnValue(buildHearings());

    TestBed.configureTestingModule({
      providers: [
        LoadMagistratesHearingGuard,
        provideStore(reducers, { runtimeChecks: {} }),
        provideState({ name: 'magistratesHearings', reducer: magistratesHearingReducer }),
        provideRouter([]),
        {
          provide: HearingService,
          useValue: {
            getHearingsForToday,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
      ],
      teardown: { destroyAfterEach: false },
    });

    guard = TestBed.inject(LoadMagistratesHearingGuard);
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  });

  it('should resolve to true when all the data is in the store', () => {
    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate();
    expect(activate$).toBeObservable(expected$);
  });

  it('should reject the activation and redirect when an error occurs during resolution', () => {
    const hearings$ = cold('---#');
    getHearingsForToday.mockReturnValue(hearings$);
    const expected$ = cold('---(a|)', { a: false });
    const activate$ = guard.canActivate();
    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
  });
});

function buildHearings(): Observable<HearingSummary[]> {
  return of([
    {
      courtCentreId: 'court-centre-id-test',
      hearingDays: [
        {
          listedDurationMinutes: 1,
          listingSequence: 0,
          sittingDay: '2019-12-03T18:32:00.000Z',
        },
      ],
      id: 'hearing-id-test',
      prosecutionCaseSummaries: [
        {
          defendants: [
            {
              dateOfBirth: '1994-12-02',
              firstName: 'Wilson',
              id: 'defendant1-id-test',
              lastName: 'Prohaska',
              middleName: 'Vernon',
              offences: [
                {
                  id: 'offence-id-test',
                  offenceTitle: 'Section 18 - attempt    wounding with intent',
                  wording: 'Wound / inflict grievous bodily harm without intent',
                  wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH',
                },
              ],
            },
            {
              dateOfBirth: '1991-12-02',
              firstName: 'Kenna',
              id: 'defendant2-id-test',
              lastName: 'McKenzie',
              middleName: 'Lillie',
              offences: [
                {
                  id: 'offence-id-test',
                  offenceTitle: 'Section 18 - attempt    wounding with intent',
                  wording: 'Wound / inflict grievous bodily harm without intent',
                  wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH',
                },
              ],
            },
          ],
          id: 'prosecution-case-id-test',
          prosecutionCaseIdentifier: {
            prosecutionAuthorityCode: 'B01BH',
            prosecutionAuthorityReference: 'test ref',
            prosecutionAuthorityId: 'prosecution-authority-id-test',
            caseURN: '57GD1981019',
          },
        },
      ],
      roomId: 'room-id-test',
      type: {
        description: 'First Hearing',
        id: 'type-id-test',
      },
    },
  ]);
}
