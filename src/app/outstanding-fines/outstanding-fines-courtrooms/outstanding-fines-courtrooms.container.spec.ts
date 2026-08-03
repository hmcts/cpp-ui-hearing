import { Component } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { reducers } from '../../core';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { OutstandingFinesCourtroomsContainer } from './outstanding-fines-courtrooms.container';

describe('OutstandingFinesCourtroomsContainer', () => {
  const mockDate = new Date('2025-01-15T12:00:00.000Z');
  let fixture: ComponentFixture<TestHostComponent>;

  const mockOutstandingFinesDetails = {
    createdBy: 'test user',
    courtRooms: [
      {
        courtRoomName: 'Crown Court 3-1',
        outstandingFines: [
          {
            defendantName: 'Abbie ARMSTRONG',
            dateOfBirth: ' 1980-11-06',
            accountNumber: '09001080W',
            address: '777 Oxford Pl\nShire Hall\nIpswich\nIP2 7QQ',
            lastEnforcementAction: 'NBWT',
            outstandingBalance: 200.0,
            isCollectionOrderMade: true,
            paymentRate: '£20 per fortnight',
            amountImposed: 200.0,
            amountPaid: 0.0,
            defaultDays: 0,
            isConsolidated: true,
            accountLocation: 'LCC 123\nLondon Road\nLondon\nNW1 7EL',
            parentGuardianToPay: false
          }
        ]
      },
      {
        courtRoomName: 'Court Room alpha',
        outstandingFines: []
      }
    ]
  };

  const mockInitialState = {
    referenceData: {
      organisationUnits: [
        {
          id: '111',
          oucodeL3Name: 'Liverpool Court Centre',
          courtrooms: [
            { id: '666', courtroomName: 'Room aaa' },
            { id: '777', courtroomName: 'Room bbb' },
            { id: '888', courtroomName: 'Room ccc' }
          ]
        }
      ]
    }
  };

  beforeEach(waitForAsync(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideMockStore({ initialState: mockInitialState }),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ courtCentreId: '111', courtRoomsIds: '666,888' }),
            snapshot: {
              data: { outstandingFinesDetails: mockOutstandingFinesDetails }
            }
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <outstanding-fines-courtrooms></outstanding-fines-courtrooms> `,
  imports: [OutstandingFinesCourtroomsContainer]
})
class TestHostComponent {}
