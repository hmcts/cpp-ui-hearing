import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { CaseDetailsComponent } from './case-details.component';
import { Offence, CPPDate } from 'src/app/core';

const mockCppDate: CPPDate = new CPPDate();
jest.mock('src/app/core', () => ({
  ...(jest.requireActual('src/app/core') as any),
  getCPPDate: jest.fn(() => mockCppDate)
}));

const firstname = 'testFirstName';
const lastname = 'testLastName';
const dateOfBirth = '1991-12-06';
const offences = [
  {
    offenceTitle: 'test offence title',
    wording: 'test offence wording'
  },
  {
    offenceTitle: 'test offence title 2',
    wording: 'test offence wording 2'
  }
];

describe('CaseDetailsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = fixture.componentInstance;
    testHostComponent.firstname = firstname;
    testHostComponent.lastname = lastname;
    testHostComponent.dateOfBirth = dateOfBirth;
    testHostComponent.offences = offences as Offence[];
  });

  it('should render the component correctly', () => {
    jest.spyOn(mockCppDate, 'getCurrentDate').mockReturnValue(new Date('2023-12-08T10:00:00.000Z'));
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should display the firstname', () => {
    fixture.detectChanges();
    const component = fixture.debugElement.query(
      By.directive(CaseDetailsComponent)
    ).componentInstance;
    expect(component.firstname).toBe(firstname);
  });

  it('should display the lastname', () => {
    fixture.detectChanges();
    const component = fixture.debugElement.query(
      By.directive(CaseDetailsComponent)
    ).componentInstance;
    expect(component.lastname).toBe(lastname);
  });

  it('should display the date of birth', () => {
    fixture.detectChanges();
    const component = fixture.debugElement.query(
      By.directive(CaseDetailsComponent)
    ).componentInstance;
    expect(component.dateOfBirth).toBe(dateOfBirth);
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <case-details
      [firstname]="firstname"
      [lastname]="lastname"
      [dateOfBirth]="dateOfBirth"
      [offences]="offences"
    ></case-details>
  `,
  imports: [CaseDetailsComponent]
})
class TestHostComponent {
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  offences: Offence[];
}
