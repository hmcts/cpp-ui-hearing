import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { OffenceDetailsComponent } from './offence-details.component';

const offenceTitle = 'test offence title';
const offenceWording = 'test offence wording';

describe('OffenceDetailsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = fixture.componentInstance;
    testHostComponent.offenceTitle = offenceTitle;
    testHostComponent.offenceWording = offenceWording;
  });

  it('should render the component correctly', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should display the offence title', () => {
    fixture.detectChanges();
    const component = fixture.debugElement.query(
      By.directive(OffenceDetailsComponent)
    ).componentInstance;
    expect(component.offenceTitle).toBe(offenceTitle);
  });

  it('should display the offence wording', () => {
    fixture.detectChanges();
    const component = fixture.debugElement.query(
      By.directive(OffenceDetailsComponent)
    ).componentInstance;
    expect(component.offenceWording).toBe(offenceWording);
  });

  it('should display Hide particulars label when offence wording section is open', () => {
    fixture.detectChanges();
    toggleParticulars(fixture);
    expect(fixture).toMatchSnapshot();
  });

  it('should not toggle text when offence wording is clicked', () => {
    fixture.detectChanges();
    toggleParticulars(fixture);
    const wording = fixture.debugElement.query(By.css('pdk-details-text')).nativeElement;
    wording.click();
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});

const toggleParticulars = function (fixture: ComponentFixture<TestHostComponent>) {
  const pdkActionDetails = fixture.debugElement.query(By.css('pdk-details-text')).nativeElement;
  pdkActionDetails.click();
  fixture.detectChanges();
};

@Component({
  selector: 'test-host-component',
  template: `
    <offence-details
      [offenceTitle]="offenceTitle"
      [showOffenceParticulars]="true"
      [offenceWording]="offenceWording"
    ></offence-details>
  `,
  imports: [OffenceDetailsComponent]
})
class TestHostComponent {
  offenceTitle: string;
  offenceWording: string;
}
