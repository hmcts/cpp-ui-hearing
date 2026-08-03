import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { HearingCaseLinksComponent } from './hearing-case-links.component';
import { CourtApplication, HearingCaseLinkType, ProsecutionCaseDetails } from '../../core';

describe('HearingCaseLinksComponent', () => {
  let component: HearingCaseLinksComponent;
  let fixture: ComponentFixture<HearingCaseLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [HearingCaseLinksComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingCaseLinksComponent);
    component = fixture.componentInstance;
    component.isStandAloneApplication = false;
    component.prosecutionCases = [
      {
        id: 'case1',
        prosecutionCaseIdentifier: { caseURN: 'URN1', prosecutionAuthorityReference: 'REF1' }
      } as ProsecutionCaseDetails
    ];
    component.courtApplications = [
      {
        id: 'app1',
        applicationReference: 'APP_REF1',
        courtApplicationCases: [{ prosecutionCaseId: 'case1', caseStatus: 'INACTIVE' }]
      } as CourtApplication
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit onGoToCaseLink event when a case link is clicked', () => {
    jest.spyOn(component.onGoToCaseLink, 'emit');
    const caseLink = fixture.debugElement.query(By.css('[data-test-id="URN1"] a'));
    caseLink.triggerEventHandler('click', null);
    expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
      caseId: 'case1',
      type: HearingCaseLinkType.CASE_AT_A_GLANCE
    });
  });

  it('should emit onGoToCreateTask event when create task link is clicked', () => {
    jest.spyOn(component.onGoToCreateTask, 'emit');
    const createTaskLink = fixture.debugElement.query(By.css('[data-test-id="URN1"] a:last-child'));
    createTaskLink.triggerEventHandler('click', null);
    expect(component.onGoToCreateTask.emit).toHaveBeenCalledWith('URN1');
  });

  it('should return the correct case reference', () => {
    const prosecutionCase = component.prosecutionCases[0];
    const caseReference = component.getCaseReference(prosecutionCase);
    expect(caseReference).toBe('URN1');
  });

  it('should return null for parentApplication if there are prosecution cases', () => {
    expect(component.parentApplication).toBeNull();
  });

  it('should return the correct parentApplication if there are no prosecution cases', () => {
    component.prosecutionCases = [];
    fixture.detectChanges();
    expect(component.parentApplication).toEqual(component.courtApplications[0]);
  });

  it('should return null for parentApplication when application has parentApplicationId', () => {
    component.prosecutionCases = [];
    component.courtApplications = [
      {
        id: 'app1',
        parentApplicationId: 'parent123',
        applicationReference: 'APP_REF1',
        courtApplicationCases: [{ prosecutionCaseId: 'case1', caseStatus: 'INACTIVE' }]
      } as CourtApplication
    ];
    fixture.detectChanges();
    expect(component.parentApplication).toBeUndefined();
  });

  it('should return parentApplication when application has courtOrder', () => {
    component.prosecutionCases = [];
    component.courtApplications = [
      {
        id: 'app1',
        applicationReference: 'APP_REF1',
        courtOrder: {
          courtOrderOffences: [{ prosecutionCaseId: 'case123' }]
        },
        courtApplicationCases: []
      } as CourtApplication
    ];
    fixture.detectChanges();
    expect(component.parentApplication).toEqual(component.courtApplications[0]);
  });

  it('should return caseIdFromParentApplication from courtApplicationCases', () => {
    component.prosecutionCases = [];
    component.courtApplications = [
      {
        id: 'app1',
        applicationReference: 'APP_REF1',
        courtApplicationCases: [{ prosecutionCaseId: 'case456', caseStatus: 'INACTIVE' }]
      } as CourtApplication
    ];
    fixture.detectChanges();
    expect(component.caseIdFromParentApplication).toBe('case456');
  });

  it('should return caseIdFromParentApplication from courtOrder offences', () => {
    component.prosecutionCases = [];
    component.courtApplications = [
      {
        id: 'app1',
        applicationReference: 'APP_REF1',
        courtOrder: {
          courtOrderOffences: [{ prosecutionCaseId: 'case789' }]
        },
        courtApplicationCases: []
      } as CourtApplication
    ];
    fixture.detectChanges();
    expect(component.caseIdFromParentApplication).toBe('case789');
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });
});
