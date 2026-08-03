import { Component, EventEmitter } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { CourtApplication, DefendantCasesApplications, ProsecutionCaseDetails } from '../../core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DefendantDetailsPanelComponent } from './defendant-details-panel.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import {
  mockDefendant,
  mockDefendantInCustody,
  mockYouthDefendantInCustody
} from '../../mock-data/test-mock-data';
import { By } from '@angular/platform-browser';

const defendant: any = mockDefendant;

describe('DefendantDetailsPanelComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let defendantDetailFixture: ComponentFixture<DefendantDetailsPanelComponent>;
  let defendantDetailComponent: DefendantDetailsPanelComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), { provide: BsModalService, useValue: {} }],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    defendantDetailFixture = TestBed.createComponent(DefendantDetailsPanelComponent);
    defendantDetailComponent = defendantDetailFixture.componentInstance;
  }));

  // Note: Snapshot test not used here due to issue with snapshot containing
  // both a date of birth which is static and a dynamically calculated age
  // which will increase over time.

  it('should render the template with the values expected', () => {
    const actualDefendantName = fixture.nativeElement.querySelector('h4').textContent.trim();
    expect(actualDefendantName).toEqual('Ken THOMPSON');
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should populate with expected values when defendant has a bulk case', () => {
    component.selectedDefendant = {
      ...component.selectedDefendant,
      prosecutionCases: [{ isGroupMaster: true } as unknown as ProsecutionCaseDetails]
    };

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should render bail date when bail status is IN_CUSTODY', () => {
    component.selectedDefendant = mockDefendantInCustody;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should hide reason and reportingRestrictionReason if not present', () => {
    component.reason = '';
    component.reportingRestrictionReason = '';

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should fire an onViewApplication event', () => {
    const applicationCourt = {} as CourtApplication;
    jest.spyOn(component.onViewApplication, 'emit');
    component.viewApplication(applicationCourt);
    fixture.detectChanges();
    expect(component.onViewApplication.emit).toHaveBeenCalledTimes(1);
  });

  it('should fire an onGoToCaseMarkers event', () => {
    jest.spyOn(defendantDetailComponent.onGoToCaseMarkers, 'emit');
    defendantDetailComponent.goToCaseMarker('');
    expect(defendantDetailComponent.onGoToCaseMarkers.emit).toHaveBeenCalledTimes(1);
  });

  it('should display youth marker is defendant is youth', () => {
    component.selectedDefendant = mockYouthDefendantInCustody;
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('.youth-marker')).nativeElement;
    expect(marker.textContent.trim()).toEqual('Youth');
  });

  it('should not display youth marker if defendant is not a youth', () => {
    component.selectedDefendant = mockDefendantInCustody;
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('.youth-marker'));
    expect(marker).toBeNull();
  });

  it('should display legal aid status if status exist', () => {
    component.selectedDefendant = { ...mockDefendant, legalAidStatus: 'Granted' };
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('#legalAidStatus')).nativeElement;
    expect(fixture).toMatchSnapshot();
    expect(marker.textContent).toEqual('Granted');
  });

  it('should not display legal aid status if status does not exist', () => {
    component.selectedDefendant = mockDefendant;
    fixture.detectChanges();
    const marker = fixture.debugElement.query(By.css('#legalaidStatus'));
    expect(marker).toBeNull();
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <defendant-details-panel
      [defendant]="selectedDefendant"
      [reason]="reason"
      [reportingRestrictionReason]="reportingRestrictionReason"
      [hearing]=""
      (onViewApplication)="viewApplication($event)"
    >
    </defendant-details-panel>
  `,
  imports: [DefendantDetailsPanelComponent]
})
class TestHostComponent {
  selectedDefendant: DefendantCasesApplications = defendant;
  reason = 'reasonTest';
  reportingRestrictionReason = 'Automatic anonymity under the Sexual Offences (Amendment) Act 1992';
  onViewApplication: EventEmitter<CourtApplication> = new EventEmitter();

  viewApplication(applicationCourt: CourtApplication) {
    this.onViewApplication.emit(applicationCourt);
  }
}
