import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import * as fromRoot from '../reducers';
import { CourtCentre } from '../model';
import {
  getCourtCentres,
  getHearingTypes,
  getPleaTypes,
  findCourCentres,
  getTrialTypes
} from './reference-data';
import { HearingType, ReferenceDataActions, PleaType, TrialType } from '@cpp/reference-data';

let store: Store<fromRoot.AppState>;
const liverpoolCourtCentre: CourtCentre = {
  id: '32ab90ab-f7ac-4794-9dc2-542585936c6b',
  name: 'Liverpool Court Centre',
  oucode: 'C05LV00',
  oucodeL1Code: 'C',
  courtrooms: [
    {
      id: 'room1Id',
      name: 'test court room 01',
      welshCourtroomName: 'welsh court room 01'
    }
  ]
};

const trialTypes: TrialType[] = [
  {
    id: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
    seqNo: 1,
    reasonCode: 'A',
    trialType: 'Cracked',
    jurisdiction: 'CCM',
    reasonShortDescription: `Acceptable guilty plea(s) entered late to some or all charges / counts
                                on the charge sheet, offered for the first time by the defence`
  },
  {
    id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c',
    seqNo: 2,
    reasonCode: 'B',
    trialType: 'Cracked',
    jurisdiction: 'CCM',
    reasonShortDescription: `Acceptable guilty plea(s) entered late to some or all charges / counts
                                on the charge sheet, previously rejected by the prosecution`
  }
];

describe('ReferenceData selectors', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore(fromRoot.reducers, { runtimeChecks: {} })],
      teardown: { destroyAfterEach: false }
    });

    store = TestBed.inject(Store);
  });

  it('should return the court centre stored in the store', () => {
    let result;
    const organisationUnitsFromCore = [
      {
        id: '32ab90ab-f7ac-4794-9dc2-542585936c6b',
        oucode: 'C05LV00',
        oucodeL1Code: 'C',
        oucodeL3Code: 'LCC',
        oucodeL3Name: 'Liverpool Court Centre',
        defaultStartTime: '10:00',
        defaultDurationHrs: '6',
        courtrooms: [
          {
            id: 'room1Id',
            courtroomName: 'test court room 01',
            welshCourtroomName: 'welsh court room 01',
            courtroomId: 0,
            venueName: 'Liverpool Court Centre'
          }
        ]
      }
    ];

    store.dispatch(
      ReferenceDataActions.loadOrganisationUnitsSuccess({
        organisationUnits: organisationUnitsFromCore
      })
    );

    store.select(getCourtCentres).subscribe(value => (result = value));
    expect(result).toEqual([liverpoolCourtCentre]);
  });

  it('should return the state of the hearing types', () => {
    const hearingTypes = [{ id: '1', hearingDescription: 'test1' }] as HearingType[];
    store.dispatch(ReferenceDataActions.loadHearingTypesSuccess({ hearingTypes: hearingTypes }));
    let result;
    store.select(getHearingTypes).subscribe(value => (result = value));
    expect(result).toEqual(hearingTypes);
  });

  it('should return the state of the plea types', () => {
    const pleaStatusTypes = [
      {
        id: '7e2f843e-d639-40b3-8611-8015f3a13333',
        sequence: 30,
        pleaTypeCode: 'GMCA',
        pleaTypeDescription: 'MCA Guilty',
        pleaValue: 'AUTREFOIS_ACQUIT',
        pleaTypeGuiltyFlag: 'Yes',
        pleaTypeCivilFlag: 'No',
        pleaStatusCode: '6',
        pleaTypeUIFlag: true,
        jurisdiction: 'MAGISTRATES'
      }
    ] as PleaType[];
    store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes }));
    let result;
    store.select(getPleaTypes).subscribe(value => (result = value));
    expect(result).toEqual(pleaStatusTypes);
  });

  it('should return the court centres for the given ou-codes', () => {
    expect(
      findCourCentres('oucode', 'oucodeXXX').projector([
        {
          id: 'id',
          oucodeL3Name: 'oucodeL3Name',
          oucode: 'oucode',
          courtrooms: [
            {
              id: 'room1Id',
              name: 'test court room 01',
              welshCourtroomName: 'welsh court room 01'
            },
            {
              id: 'room2Id',
              name: 'test court room 02',
              welshCourtroomName: 'welsh court room 02'
            }
          ]
        } as any
      ])
    ).toMatchSnapshot();
  });

  it('should return the trial types stored in the store', () => {
    let result;

    store.dispatch(ReferenceDataActions.loadTrialTypesSuccess({ trialTypes }));
    store.select(getTrialTypes).subscribe(value => (result = value));
    expect(result).toEqual(trialTypes);
  });
});
