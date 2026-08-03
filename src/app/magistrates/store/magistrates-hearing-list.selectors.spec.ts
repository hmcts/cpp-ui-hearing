import { Store, provideStore, provideState } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';

import { take } from 'rxjs/operators';
import { reducers } from '../../core/reducers';
import { magistratesHearingReducer } from './magistrates-hearing.reducer';
import {
  hearingSummaryMock,
  organisationUnitsMock,
  applicationMock,
  childParentApplicationsMock,
  applicationMockData
} from '../mock-data/test-mock-data';

import { AppState } from '../../core';
import { LoadMagistratesHearingListSuccessAction } from './magistrates-hearing.action';
import {
  getCourtCentre,
  getHearingDate,
  getMagistratesHearings
} from './magistrates-hearing.selector';
import { ReferenceDataActions } from '@cpp/reference-data';

let state: AppState;
let store: Store<AppState>;

describe('Magistrates hearing list selector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideState({ name: 'magistratesList', reducer: magistratesHearingReducer })
      ],
      teardown: { destroyAfterEach: false }
    });
    store = TestBed.inject(Store);
  });

  it('it should get the court centre', () => {
    const organisationUnits = {
      organisationUnits: organisationUnitsMock
    };
    store.dispatch(ReferenceDataActions.loadOrganisationUnitsSuccess(organisationUnits));
    store.dispatch(new LoadMagistratesHearingListSuccessAction(hearingSummaryMock));
    store.pipe(take(1)).subscribe(val => (state = val));
    expect(getCourtCentre(state)).toMatchSnapshot();
  });

  it('it should get the hearing date', () => {
    store.dispatch(new LoadMagistratesHearingListSuccessAction(hearingSummaryMock));
    store.pipe(take(1)).subscribe(val => (state = val));
    expect(getHearingDate(state)).toEqual('2019-12-03T18:32:00.000Z');
  });

  it('it should get the magistrates hearings', () => {
    const organisationUnits = {
      organisationUnits: organisationUnitsMock
    };
    store.dispatch(ReferenceDataActions.loadOrganisationUnitsSuccess(organisationUnits));
    store.dispatch(new LoadMagistratesHearingListSuccessAction(hearingSummaryMock));
    store.pipe(take(1)).subscribe(val => (state = val));
    expect(getMagistratesHearings(state)).toMatchSnapshot();
  });

  it('it should get the application', () => {
    const organisationUnits = {
      organisationUnits: organisationUnitsMock
    };
    store.dispatch(ReferenceDataActions.loadOrganisationUnitsSuccess(organisationUnits));
    store.dispatch(new LoadMagistratesHearingListSuccessAction(applicationMock));
    store.pipe(take(1)).subscribe(val => (state = val));
    expect(getMagistratesHearings(state)).toMatchSnapshot();
  });

  it('it should get the parent and child applications', () => {
    const organisationUnits = {
      organisationUnits: organisationUnitsMock
    };
    store.dispatch(ReferenceDataActions.loadOrganisationUnitsSuccess(organisationUnits));
    store.dispatch(new LoadMagistratesHearingListSuccessAction(childParentApplicationsMock));
    store.pipe(take(1)).subscribe(val => (state = val));
    expect(getMagistratesHearings(state)).toMatchSnapshot();
  });

  it('it should get the application having two respondents', () => {
    const organisationUnits = {
      organisationUnits: organisationUnitsMock
    };
    store.dispatch(ReferenceDataActions.loadOrganisationUnitsSuccess(organisationUnits));
    store.dispatch(new LoadMagistratesHearingListSuccessAction(applicationMockData));
    store.pipe(take(1)).subscribe(val => (state = val));
    expect(getMagistratesHearings(state)).toMatchSnapshot();
  });
});
