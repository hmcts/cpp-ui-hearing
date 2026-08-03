import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { OutstandingFinesDefendantContainer } from './outstanding-fines-defendant.container';
import { of } from 'rxjs';

describe('OutstandingFinesDefendantContainer', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const defendantId = 'test-defendant-id';
  const defendantFirstName = 'test-defendant-firstname';
  const defendantLastName = 'test-defendant-lastname';

  const mockOutstandingFines = [
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
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                defendantId
              },
              queryParams: {
                defendantFirstName,
                defendantLastName
              }
            },
            data: of({ outstandingFines: mockOutstandingFines })
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
  template: ` <outstanding-fines-defendant></outstanding-fines-defendant> `,
  imports: [OutstandingFinesDefendantContainer]
})
class TestHostComponent {}
