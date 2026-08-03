import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { SessionTimesContainer } from './session-times.container';
import { AppConfigService } from '../config';
import { AppState } from '../core/reducers';
import { GetSessionTimesAction, RecordSessionTimesAction } from '../core/actions';
import { CourtFilterOptions } from '../core/model';
import { ReferenceDataService } from '../core/services';

let todaysDate = new Date();

jest.mock('../core/utils/cpp-date', () => {
  const cppDateModule = jest.requireActual('../core/utils/cpp-date');
  return {
    ...cppDateModule,
    getCPPDate: () => {
      const actualCPPDate = cppDateModule.getCPPDate();
      actualCPPDate.getCurrentDate = jest.fn().mockReturnValue(todaysDate);
      return actualCPPDate;
    }
  };
});

describe('SessionTimesContainer', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: SessionTimesContainer;

  let selectSpy: any;
  let dispatchSpy: any;
  let pipeableSelectSpy: any;
  const appConfigServiceSpy = jest.fn().mockReturnValue('http://test');

  let state: any;
  const store: Store<AppState> = null;

  state = {
    referenceData: {
      organisationUnits: [
        {
          id: '7e967376-eacf-4fca-9b30-21b0c5aad427',
          oucode: 'B01BH00',
          lja: '2575',
          oucodeL1Code: 'B',
          oucodeL1Name: 'Magistrates Courts',
          oucodeL3Name: 'Bexley Magistrates Court',
          address1: 'Norwich Place',
          address2: 'Bexleyheath',
          address3: 'Kent',
          address4: 'Merseyside',
          postcode: 'DA6 7ND',
          defaultStartTime: '10:00',
          defaultDurationHrs: '7:00',
          oucodeL2Code: '01',
          oucodeL2Name: 'London'
        },
        {
          id: '67aa82ba-67bb-4699-8176-5f572048352b',
          oucode: 'B01IX00',
          lja: '2570',
          oucodeL1Code: 'B',
          oucodeL1Name: 'Magistrates Courts',
          oucodeL3Name: 'Westminster Magistrates Court',
          oucodeL3WelshName: 'Llys Ynadon Westminster',
          address1: '181 Marylebone Road',
          address2: 'London',
          postcode: 'NW1 5BR',
          defaultStartTime: '10:00',
          defaultDurationHrs: '7:00',
          oucodeL2Code: '1',
          oucodeL2Name: 'London'
        }
      ]
    },
    sessionTimes: {
      currentSessionTimes: {
        courtHouseId: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
        courtRoomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8'
      },
      courtOfficers: {
        courtClerks: [
          {
            userId: '8959b8b5-92bd-4ada-96f4-7ac9d482671a',
            firstName: 'Robert',
            lastName: 'Barnes'
          },
          {
            userId: 'c631f396-76a6-4a35-a6bc-4dca10b9e6d3',
            firstName: 'Marion',
            lastName: 'Martin'
          }
        ],
        courtAssociate: [
          {
            userId: '84c17fae-0463-40d8-979a-a189cc025cb7',
            firstName: 'CourtAssociate',
            lastName: 'User'
          }
        ],
        legalAdvisers: [
          {
            userId: '676ae4c5-fdd9-469e-a528-dd5b12c90287',
            firstName: 'Emma',
            lastName: 'Cleaner'
          },
          {
            userId: '735b9bf6-2f4c-4947-92af-b607c7d2880f',
            firstName: 'Evan',
            lastName: 'Roberts'
          },
          {
            userId: 'a085e359-6069-4694-8820-7810e7dfe762',
            firstName: 'Erica',
            lastName: 'Wilson'
          },
          {
            userId: '52dd05dc-968e-4c62-9226-8649631ab000',
            firstName: 'prosecutioncasefile',
            lastName: 'system'
          }
        ]
      }
    }
  };

  const mockCourtFilterOptions: CourtFilterOptions = {
    courtCentre: {
      id: 'test-courtCentre-id',
      oucode: 'test-oucode',
      oucodeL3Code: 'test-courtCentre-oucodeL3Code',
      oucodeL3Name: 'test-courtCentre-oucodeL3Name',

      courtrooms: [
        {
          id: 'test-courtRoom-id',
          venueName: 'test-courtRoom-venueName',
          courtroomId: 121,
          courtroomName: 'test-courtRoom-name'
        }
      ]
    },
    courtRoomId: 'test-courtRoom-id',
    sessionDate: '2020-10-9'
  };

  selectSpy = jest.fn().mockImplementation(selectorFunc => {
    return of(selectorFunc.call(store, state));
  });

  pipeableSelectSpy = jest.fn().mockImplementation((selectFunc, takeFunc) => {
    return selectFunc.call(store, of(state));
  });

  dispatchSpy = jest.fn();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        {
          provide: Store,
          useValue: { select: selectSpy, dispatch: dispatchSpy, pipe: pipeableSelectSpy }
        },
        { provide: AppConfigService, useValue: { getBaseUrl: appConfigServiceSpy } },
        {
          provide: ReferenceDataService,
          useValue: { fetchJudicialMembers: jest.fn().mockReturnValue(of([])) }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should call onCourtFiltersSubmit and expect action to be dispatched', () => {
    component.onCourtFilersSubmit(mockCourtFilterOptions);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(GetSessionTimesAction));
  });

  it('should call onCourtJudiciarySubmit and expect action to be dispatched', () => {
    component.onCourtJudiciarySubmit(state.sessionTimes.currentSessionTimes);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(RecordSessionTimesAction));
  });

  it('should set the errors', () => {
    component.formErrors([{ test: 'Message' } as any]);
    expect(component.errors).toEqual([{ test: 'Message' }]);
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <session-times></session-times> `,
  imports: [SessionTimesContainer]
})
class TestHostComponent {}
