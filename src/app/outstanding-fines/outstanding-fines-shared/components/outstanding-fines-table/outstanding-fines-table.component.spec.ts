import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OutstandingFinesTableComponent } from './outstanding-fines-table.component';

describe('OutstandingFinesTableComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: OutstandingFinesTableComponent;
  const outstandingFinesDefendants = [
    {
      defendantName: 'Abbie ARMSTRONG',
      dateOfBirth: '1980-11-06',
      accountNumber: '09001080W',
      address: '777 Oxford Pl &#10;Shire Hall&#10;Ipswich&#10;IP2 7QQ',
      lastEnforcementAction: 'NBWT',
      outstandingBalance: 200.0,
      isCollectionOrderMade: true,
      paymentRate: '£20 per fortnight',
      amountImposed: 200.0,
      amountPaid: 0.0,
      defaultDays: 0,
      isConsolidated: true,
      accountLocation: 'LCC 123&#10;London Road&#10;London&#10;NW1 7EL',
      parentGuardianToPay: false
    },
    {
      defendantName: 'Brian BOULDEK',
      dateOfBirth: '1980-11-06',
      accountNumber: '09001080W',
      address: '777 Oxford Pl&#10;Shire Hall&#10;Ipswich&#10;IP2 7QQ',
      lastEnforcementAction: 'NBWT',
      outstandingBalance: 200.0,
      isCollectionOrderMade: true,
      paymentRate: '£20 per fortnight',
      amountImposed: 200.0,
      amountPaid: 0.0,
      defaultDays: 0,
      isConsolidated: true,
      accountLocation: 'LCC 123&#10;London Road&#10;London&#10;NW1 7EL',
      parentGuardianToPay: false
    }
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    component.outstandingFines = outstandingFinesDefendants;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <outstanding-fines-table></outstanding-fines-table> `,
  imports: [OutstandingFinesTableComponent]
})
class TestHostComponent {}
