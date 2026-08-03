import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OutstandingFinesReportDetailsComponent } from './outstanding-fines-report-details.component';
import { OutstandingFinesDetails } from '../../../outstanding-fines.interfaces';

describe('OutstandingFinesTableComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: OutstandingFinesReportDetailsComponent;

  const mockOutstandingFinesReportDetails = {
    courtHouse: 'Lavender Court House',
    courtRooms: 'Courtroom 1, Courtroom 2',
    hearingDate: '15 November 2019',
    reportCreatedDate: '14 November 2019',
    createdBy: 'Mark Simons',
    outstandingFinesByCourtRooms: [
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
      }
    ]
  } as OutstandingFinesDetails;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    component.outstandingFinesDetails = mockOutstandingFinesReportDetails;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <outstanding-fines-report-details></outstanding-fines-report-details> `,
  imports: [OutstandingFinesReportDetailsComponent]
})
class TestHostComponent {}
