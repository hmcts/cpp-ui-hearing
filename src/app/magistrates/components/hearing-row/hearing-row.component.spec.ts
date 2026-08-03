import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingRowComponent } from './hearing-row.component';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Offence } from '../../interfaces/magistrates-hearing.interface';

describe('HearingRowComponent', () => {
  let component: HearingRowComponent;
  let testHostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.directive(HearingRowComponent)).componentInstance;
  });

  it('should compile correctly', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should display the sequence', () => {
    testHostComponent.sequence = '1';
    fixture.detectChanges();
    expect(component.sequence).toBe('1');
  });

  it('should display the sitting day', () => {
    testHostComponent.sittingDay = '2020-08-01';
    fixture.detectChanges();
    expect(component.sittingDay).toBe('2020-08-01');
  });

  it('should display the case urn', () => {
    testHostComponent.caseURN = 'mock-case-urn';
    fixture.detectChanges();
    expect(component.caseURN).toBe('mock-case-urn');
  });

  it('should display the prosecution authority reference', () => {
    testHostComponent.prosecutionAuthorityReference = 'mock-prosecution-authority-reference';
    fixture.detectChanges();
    expect(component.prosecutionAuthorityReference).toBe('mock-prosecution-authority-reference');
  });

  it('should display the prosecution authority code', () => {
    testHostComponent.prosecutionAuthorityCode = 'mock-prosecution-authority-reference';
    fixture.detectChanges();
    expect(component.prosecutionAuthorityCode).toBe('mock-prosecution-authority-reference');
  });

  it('should display the first name', () => {
    testHostComponent.firstName = 'mock-first-name';
    fixture.detectChanges();
    expect(component.firstName).toBe('mock-first-name');
  });

  it('should display the last name', () => {
    testHostComponent.firstName = 'mock-last-name';
    fixture.detectChanges();
    expect(component.firstName).toBe('mock-last-name');
  });

  it('should display the date of birth', () => {
    testHostComponent.firstName = '1985-08-02';
    fixture.detectChanges();
    expect(component.firstName).toBe('1985-08-02');
  });

  it('should display the offences', () => {
    const offences = [
      { id: 'mock-id', offenceTitle: 'mock-offence-title', wording: 'mock-wording' }
    ];
    testHostComponent.offences = offences;
    fixture.detectChanges();
    expect(component.offences).toBe(offences);
  });

  it('should display the description', () => {
    testHostComponent.description = 'mock-description';
    fixture.detectChanges();
    expect(component.description).toBe('mock-description');
  });

  @Component({
    selector: 'test-host-component',
    template: `
      <tr
        hearing-row
        [sequence]="sequence"
        [sittingDay]="sittingDay"
        [caseURN]="caseURN"
        [prosecutionAuthorityReference]="prosecutionAuthorityReference"
        [prosecutionAuthorityCode]="prosecutionAuthorityCode"
        [firstName]="firstName"
        [lastName]="lastName"
        [dateOfBirth]="dateOfBirth"
        [offences]="offences"
        [description]="description"
      ></tr>
    `,
    imports: [HearingRowComponent]
  })
  class TestHostComponent {
    sequence: string;
    sittingDay: string;
    caseURN: string;
    prosecutionAuthorityReference: string;
    prosecutionAuthorityCode: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    offences: Offence[];
    description: string;
  }
});
