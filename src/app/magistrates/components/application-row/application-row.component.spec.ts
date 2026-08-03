import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationRowComponent } from './application-row.component';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ApplicationRowComponent', () => {
  let component: ApplicationRowComponent;
  let testHostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(By.directive(ApplicationRowComponent)).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should display the reference', () => {
    testHostComponent.reference = 'mock-reference';
    fixture.detectChanges();
    expect(component.reference).toBe('mock-reference');
  });

  it('should display the prosecutor', () => {
    testHostComponent.prosecutor = 'mock-prosecutor';
    fixture.detectChanges();
    expect(component.prosecutor).toBe('mock-prosecutor');
  });

  it('should display the first name', () => {
    testHostComponent.firstName = 'mock-first-name';
    fixture.detectChanges();
    expect(component.firstName).toBe('mock-first-name');
  });
  it('should display the last name', () => {
    testHostComponent.lastName = 'mock-last-name';
    fixture.detectChanges();
    expect(component.lastName).toBe('mock-last-name');
  });

  it('should display the organisation name', () => {
    testHostComponent.organisationName = 'mock-organisation-name';
    fixture.detectChanges();
    expect(component.organisationName).toBe('mock-organisation-name');
  });

  it('should display the application legislation', () => {
    testHostComponent.applicationLegislation = 'mock-application-legislation';
    fixture.detectChanges();
    expect(component.applicationLegislation).toBe('mock-application-legislation');
  });

  it('should display the application type', () => {
    testHostComponent.applicationType = 'mock-application-type';
    fixture.detectChanges();
    expect(component.applicationType).toBe('mock-application-type');
  });

  it('should set is child application', () => {
    expect(component.isChildApplication).toBeFalsy();
    testHostComponent.isChildApplication = true;
    fixture.detectChanges();
    expect(component.isChildApplication).toBeTruthy();
  });

  it('should set is parent application', () => {
    expect(component.isParentApplication).toBeFalsy();
    testHostComponent.isParentApplication = true;
    fixture.detectChanges();
    expect(component.isParentApplication).toBeTruthy();
  });

  @Component({
    selector: 'test-host-component',
    template: `
      <tr
        application-row
        [sequence]="sequence"
        [sittingDay]="sittingDay"
        [reference]="reference"
        [prosecutor]="prosecutor"
        [firstName]="firstName"
        [lastName]="lastName"
        [organisationName]="organisationName"
        [applicationLegislation]="applicationLegislation"
        [applicationType]="applicationType"
        [isChildApplication]="isChildApplication"
        [isParentApplication]="isParentApplication"
      ></tr>
    `,
    imports: [ApplicationRowComponent]
  })
  class TestHostComponent {
    sequence: string;
    sittingDay: string;
    reference: string;
    prosecutor: string;
    firstName: string;
    lastName: string;
    organisationName: string;
    applicationLegislation: string;
    applicationType: string;
    isChildApplication: boolean;
    isParentApplication: boolean;
  }
});
