import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { HearingCaseLinksComponent } from './hearing-case-links.component';
import { OffenceActiveOrderType } from '@cpp/reference-data';
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

  it('should emit an add application link for the case when the case add application link is clicked', () => {
    jest.spyOn(component.onGoToCaseLink, 'emit');
    const addApplicationLink = fixture.debugElement.query(
      By.css('[data-test-id="URN1"] a:nth-child(3)')
    );
    addApplicationLink.triggerEventHandler('click', null);
    expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
      caseId: 'case1',
      type: HearingCaseLinkType.ADD_APPLICATION
    });
  });

  it('should return the correct case reference', () => {
    const prosecutionCase = component.prosecutionCases[0];
    const caseReference = component.getCaseReference(prosecutionCase);
    expect(caseReference).toBe('URN1');
  });

  describe('application links (hearing without prosecution cases)', () => {
    const inactiveApp = {
      id: 'inactiveApp',
      applicationReference: 'INACTIVE_REF',
      courtApplicationCases: [
        { prosecutionCaseId: 'case1', offences: [{ id: 'o1', proceedingsConcluded: true }] }
      ]
    } as CourtApplication;
    const activeApp = {
      id: 'activeApp',
      applicationReference: 'ACTIVE_REF',
      courtApplicationCases: [
        { prosecutionCaseId: 'case2', offences: [{ id: 'o2', proceedingsConcluded: false }] }
      ]
    } as CourtApplication;
    const breachApp = {
      id: 'breachApp',
      applicationReference: 'BREACH_REF',
      courtOrder: { courtOrderOffences: [{ prosecutionCaseId: 'case3' }] },
      courtApplicationCases: []
    } as CourtApplication;
    const standaloneApp = {
      id: 'standaloneApp',
      applicationReference: 'STANDALONE_REF'
    } as CourtApplication;
    const notApplicableApp = {
      id: 'notApplicableApp',
      applicationReference: 'NA_REF',
      type: { offenceActiveOrder: OffenceActiveOrderType.NOT_APPLICABLE },
      courtApplicationCases: [{ prosecutionCaseId: 'case4' }]
    } as CourtApplication;
    const childOf = (parent: CourtApplication): CourtApplication =>
      ({
        id: `childOf_${parent.id}`,
        applicationReference: `CHILD_${parent.applicationReference}`,
        parentApplicationId: parent.id
      } as CourtApplication);

    const render = (courtApplications: CourtApplication[], canAddChildApplication = true) => {
      fixture = TestBed.createComponent(HearingCaseLinksComponent);
      component = fixture.componentInstance;
      component.prosecutionCases = [];
      component.isStandAloneApplication = false;
      component.courtApplications = courtApplications;
      component.canAddChildApplication = canAddChildApplication;
      fixture.detectChanges();
    };
    const addLinks = () =>
      fixture.debugElement.queryAll(By.css('[data-test-id="add-application-link"]'));
    const addLinkFor = (reference: string) =>
      fixture.debugElement.query(
        By.css(`[data-test-id="${reference}"] [data-test-id="add-application-link"]`)
      );
    const clickAddLink = (reference: string) => {
      jest.spyOn(component.onGoToCaseLink, 'emit');
      addLinkFor(reference).triggerEventHandler('click', null);
    };

    it('should emit an add child application link for an application on inactive offences', () => {
      render([inactiveApp]);
      clickAddLink('INACTIVE_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case1',
        applicationId: 'inactiveApp',
        type: HearingCaseLinkType.ADD_CHILD_APPLICATION
      });
    });

    it('should use the application offences rather than the case status to decide child eligibility', () => {
      render([
        {
          ...inactiveApp,
          courtApplicationCases: [{ ...inactiveApp.courtApplicationCases[0], caseStatus: 'ACTIVE' }]
        }
      ]);
      clickAddLink('INACTIVE_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: HearingCaseLinkType.ADD_CHILD_APPLICATION })
      );
    });

    it('should emit an add child application link for a breach application on an active order', () => {
      render([breachApp]);
      clickAddLink('BREACH_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case3',
        applicationId: 'breachApp',
        type: HearingCaseLinkType.ADD_CHILD_APPLICATION
      });
    });

    it('should not show the add child application link without the child application permission', () => {
      render([inactiveApp], false);
      expect(addLinks().length).toBe(0);
    });

    it('should emit an add parent application link for an application on active offences', () => {
      render([activeApp]);
      clickAddLink('ACTIVE_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case2',
        type: HearingCaseLinkType.ADD_APPLICATION
      });
    });

    it('should show the add parent application link without the child application permission', () => {
      render([activeApp], false);
      expect(addLinkFor('ACTIVE_REF')).toBeTruthy();
    });

    it('should treat an application type without offences as active and add a parent application', () => {
      render([notApplicableApp]);
      clickAddLink('NA_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case4',
        type: HearingCaseLinkType.ADD_APPLICATION
      });
    });

    it('should not show any add application link when active and inactive applications are mixed', () => {
      render([inactiveApp, activeApp]);
      expect(addLinks().length).toBe(0);
      expect(fixture.debugElement.query(By.css('[data-test-id="INACTIVE_REF"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-test-id="ACTIVE_REF"]'))).toBeTruthy();
    });

    it('should show only one add child application link, on the first application, when all are on inactive offences', () => {
      const secondInactiveApp = {
        ...inactiveApp,
        id: 'secondInactiveApp',
        applicationReference: 'SECOND_INACTIVE_REF',
        courtApplicationCases: [
          { prosecutionCaseId: 'case5', offences: [{ id: 'o5', proceedingsConcluded: true }] }
        ]
      } as CourtApplication;
      render([inactiveApp, secondInactiveApp]);
      expect(addLinks().length).toBe(1);
      expect(addLinkFor('SECOND_INACTIVE_REF')).toBeNull();

      clickAddLink('INACTIVE_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case1',
        applicationId: 'inactiveApp',
        type: HearingCaseLinkType.ADD_CHILD_APPLICATION
      });
    });

    it('should show only one add parent application link, on the first application, when all are on active offences', () => {
      const secondActiveApp = {
        ...activeApp,
        id: 'secondActiveApp',
        applicationReference: 'SECOND_ACTIVE_REF',
        courtApplicationCases: [
          { prosecutionCaseId: 'case6', offences: [{ id: 'o6', proceedingsConcluded: false }] }
        ]
      } as CourtApplication;
      render([activeApp, secondActiveApp]);
      expect(addLinks().length).toBe(1);
      expect(addLinkFor('SECOND_ACTIVE_REF')).toBeNull();

      clickAddLink('ACTIVE_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case2',
        type: HearingCaseLinkType.ADD_APPLICATION
      });
    });

    it('should show the add application link on the parent when the child is listed first', () => {
      const child = childOf(activeApp);
      render([child, activeApp]);
      expect(addLinks().length).toBe(1);
      expect(addLinkFor('ACTIVE_REF')).toBeTruthy();
    });

    it('should not show the add application link for a child application listed alone', () => {
      render([childOf(inactiveApp)]);
      expect(addLinks().length).toBe(0);
    });

    it('should add the child to the parent application when parent and child share the hearing', () => {
      const child = childOf(inactiveApp);
      render([child, inactiveApp]);
      expect(addLinks().length).toBe(1);
      expect(addLinkFor(child.applicationReference)).toBeNull();
      clickAddLink('INACTIVE_REF');
      expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith({
        caseId: 'case1',
        applicationId: 'inactiveApp',
        type: HearingCaseLinkType.ADD_CHILD_APPLICATION
      });
    });

    it('should not show the add application link for a standalone application', () => {
      render([standaloneApp]);
      expect(fixture.debugElement.query(By.css('[data-test-id="STANDALONE_REF"]'))).toBeTruthy();
      expect(addLinks().length).toBe(0);
    });

    it('should return no add application link when court applications are undefined', () => {
      render(undefined);
      expect(component.addApplicationLink).toBeNull();
      expect(addLinks().length).toBe(0);
    });

    it('should return no add application link when there are no court applications', () => {
      render([]);
      expect(component.addApplicationLink).toBeNull();
      expect(addLinks().length).toBe(0);
    });

    it('should not show application links when the hearing has prosecution cases', () => {
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('[data-test-id="APP_REF1"]'))).toBeNull();
    });
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });
});
