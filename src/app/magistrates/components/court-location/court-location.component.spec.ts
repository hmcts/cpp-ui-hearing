import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CourtLocationComponent } from './court-location.component';
import { RouterModule } from '@angular/router';

const courtName = 'Lavender Hill Magistrates Court';
const hearingDate = '2019-12-06T09:00:00.000Z';

describe('CourtLocationComponent', () => {
  let component: CourtLocationComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, RouterModule],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should render the component correctly', () => {
    expect(component).toBeTruthy();
    expect(fixture).toMatchSnapshot();
  });

  it('should display the court name', () => {
    expect(component.courtName).toBe(courtName);
  });

  it('should display the hearing date', () => {
    expect(component.hearingDate).toBe(hearingDate);
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <court-location [courtName]="courtName" [hearingDate]="hearingDate"> </court-location>
  `,
  imports: [CourtLocationComponent]
})
class TestHostComponent {
  courtName = courtName;
  hearingDate = hearingDate;
}
