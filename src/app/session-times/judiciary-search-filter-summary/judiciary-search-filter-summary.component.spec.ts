import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { JudiciarySearchFilterSummaryComponent } from './judiciary-search-filter-summary.component';

describe('JudiciarySearchFilterSummaryComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
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
  template: `
    <judiciary-search-filter-summary
      [selectedCourtCentre]="selectedCourtCentre"
      [selectedCourtRoom]="selectedCourtRoom"
      [sessionDate]="sessionDate"
    ></judiciary-search-filter-summary>
  `,
  imports: [JudiciarySearchFilterSummaryComponent]
})
class TestHostComponent {
  selectedCourtCentre = 'Lavender Hill';
  selectedCourtRoom = 'Courtroom 1';
  sessionDate = '2020-10-20';
}
