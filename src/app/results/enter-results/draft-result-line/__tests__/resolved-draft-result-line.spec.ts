import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmendmentService } from 'src/app/results/common/services/amendment.service';
import { ResolvedDraftResultLineComponent } from '../resolved-draft-result-line.component';
import { ExtendedResolvedDraftResultLine, NgChanges } from 'src/app/results/results.interfaces';
import { ActivatedRoute } from '@angular/router';
import { DraftResultComponent } from '../../draft-result/draft-result.component';

const groupedWithResultDefinitionIds: string[] = [
  'abb95a52-2a75-40c3-8d3f-a1d75a199c47',
  '204fc6b8-d6c9-4fb8-acd0-47d23c087625',
  '66105417-41c8-420d-820f-40b61b507442',
  '6cb15971-c945-4398-b7c9-3f8b743a4de3',
  '386a3a47-b2cb-4017-9dd8-19ffeb457b56',
  '0fcddac3-f2f9-4c36-84ce-b3babcc57cb0'
];

const resultLine: ExtendedResolvedDraftResultLine = {
  label: 'Victim Surcharge Applies?',
  valid: false,
  caseId: '2b6e2574-be6c-4390-8c8d-34da7c12457d',
  offenceId: 'd73a73c6-0303-4440-a573-4b75553f17f0',
  shortCode: 'vsa',
  defendantId: 'c1478ee5-77d4-4ee1-aa9e-8f139120959f',
  orderedDate: '2024-01-30',
  resultLevel: 'D',
  unscheduled: false,
  excludedFromResults: false,
  originalText: 'vsa',
  resultLineId: '197cdafc-2d49-4572-ab49-c1ed4cdb725b',
  resultPrompts: [],
  unresolvedParts: [],
  masterDefendantId: 'c1478ee5-77d4-4ee1-aa9e-8f139120959f',
  resultDefinitionId: '386a3a47-b2cb-4017-9dd8-19ffeb457b56',
  conditionalMandatory: true,
  promptChoices: [],
  childResultDefinitions: [
    {
      code: '204fc6b8-d6c9-4fb8-acd0-47d23c087625',
      shortCode: 'fvs',
      label: 'Surcharge',
      ruleType: 'mandatory',
      excludedFromResults: false,
      childResultCodes: [
        '615313b5-0647-4d61-b7b8-6b36265d8929',
        '4fdd9548-c521-48c9-baa3-1bd2f13a4fcc',
        'bdb32555-8d55-4dc1-b4b6-580db5132496',
        'f7dfefd2-64c6-11e8-adc0-fa7ae01bbebc',
        '923f8b82-d4b5-4c9b-8b54-6d1ec8e16dd6',
        'cfa66730-f81c-4768-a36e-581791cb0270'
      ]
    }
  ]
};

describe('ResolvedDraftResultLineComponent', () => {
  let component: ResolvedDraftResultLineComponent;
  let fixture: ComponentFixture<ResolvedDraftResultLineComponent>;
  let mockElementRef: ElementRef<any>;
  let mockAmendmentService: AmendmentService;

  beforeEach(() => {
    const route = new ActivatedRoute();

    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: mockElementRef },
        { provide: AmendmentService, useValue: mockAmendmentService },
        DraftResultComponent,
        {
          provide: ActivatedRoute,
          useValue: route
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
    fixture = TestBed.createComponent(ResolvedDraftResultLineComponent);
    component = fixture.componentInstance;
  });

  const applyAmendGateInputs = ({
    amendApplicationPermission = true,
    isCourtApplicationFinalised,
    isAmendmentAllowed = false,
    caseStatus
  }: {
    amendApplicationPermission?: boolean;
    isCourtApplicationFinalised: boolean;
    isAmendmentAllowed?: boolean;
    caseStatus?: string;
  }): void => {
    component.resultLine = { ...resultLine };
    component.amendApplicationPermission = amendApplicationPermission;
    component.isCourtApplicationFinalised = isCourtApplicationFinalised;
    component.isAmendmentAllowed = isAmendmentAllowed;
    if (caseStatus) {
      component.caseStatus = caseStatus;
    }
    component.ngOnChanges({} as NgChanges<ResolvedDraftResultLineComponent>);
  };

  it('should render', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should render cpp-draft-result-line-options if the application status is not finalised', () => {
    component.groupedWithResultDefinitionIds = groupedWithResultDefinitionIds;
    component.resultLine = { ...resultLine };
    component.ngOnChanges({
      groupedWithResultDefinitionIds: { currentValue: groupedWithResultDefinitionIds }
    } as NgChanges<ResolvedDraftResultLineComponent>);
    const compiled = fixture.debugElement.nativeElement;
    component.isCourtApplicationFinalised = false;
    fixture.detectChanges();

    expect(compiled.querySelector('cpp-draft-result-line-options')).toBeDefined();
  });

  it('should render cpp-draft-result-line-options if the application status is finalised and has shared results', () => {
    component.groupedWithResultDefinitionIds = groupedWithResultDefinitionIds;
    component.resultLine = { ...resultLine };
    component.ngOnChanges({
      groupedWithResultDefinitionIds: { currentValue: groupedWithResultDefinitionIds }
    } as NgChanges<ResolvedDraftResultLineComponent>);
    const compiled = fixture.debugElement.nativeElement;
    component.isCourtApplicationFinalised = true;
    component.isAmendmentAllowed = true;
    fixture.detectChanges();

    expect(compiled.querySelector('cpp-draft-result-line-options')).toBeDefined();
  });

  it('should not render cpp-draft-result-line-options if the amendApplicationPermission is ON and application status is finalised', () => {
    applyAmendGateInputs({ isCourtApplicationFinalised: true });
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    expect(component.hasAmendApplication).toBe(false);
    expect(compiled.querySelector('cpp-draft-result-line-options')).toBeNull();
  });

  it('should not render cpp-draft-result-line-options if the amendApplicationPermission is ON and application status is finalised even when the case status is ACTIVE', () => {
    applyAmendGateInputs({ isCourtApplicationFinalised: true, caseStatus: 'ACTIVE' });
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    expect(component.hasAmendApplication).toBe(false);
    expect(compiled.querySelector('cpp-draft-result-line-options')).toBeNull();
  });

  it('should render cpp-draft-result-line-options if the amendApplicationPermission is ON, the application status is finalised and amendment is allowed', () => {
    applyAmendGateInputs({ isCourtApplicationFinalised: true, isAmendmentAllowed: true });
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    expect(component.hasAmendApplication).toBe(true);
    expect(compiled.querySelector('cpp-draft-result-line-options')).not.toBeNull();
  });

  it('should return true when conditionalMandatoryChildCode exists in groupedWithResultDefinitionIds and childOfTrueResponse is not present', async () => {
    component.groupedWithResultDefinitionIds = groupedWithResultDefinitionIds;
    component.resultLine = { ...resultLine };
    component.ngOnChanges({
      groupedWithResultDefinitionIds: { currentValue: groupedWithResultDefinitionIds }
    } as NgChanges<ResolvedDraftResultLineComponent>);
    component.isCourtApplicationFinalised = false;
    fixture.detectChanges();
    expect(component.hasConditionalMandatoryChild).toBe(true);
  });

  it('should return false when conditionalMandatoryChildCode exists in groupedWithResultDefinitionIds and childOfTrueResponse is equal to false', async () => {
    const testResultLine = { ...resultLine };
    testResultLine.childResultDefinitions[0].childOfTrueResponse = false;
    component.groupedWithResultDefinitionIds = groupedWithResultDefinitionIds;
    component.resultLine = testResultLine;
    component.ngOnChanges({
      groupedWithResultDefinitionIds: { currentValue: groupedWithResultDefinitionIds }
    } as NgChanges<ResolvedDraftResultLineComponent>);
    component.isCourtApplicationFinalised = false;
    fixture.detectChanges();
    expect(component.hasConditionalMandatoryChild).toBe(false);
  });

  describe('hasAmendApplication gate with the amend application permission', () => {
    it('should block the amend options for a finalised application without amendment allowed when no case status is set', () => {
      applyAmendGateInputs({ isCourtApplicationFinalised: true });

      expect(component.hasAmendApplication).toBe(false);
    });

    it.each(['ACTIVE', 'INACTIVE'])(
      'should block the amend options for a finalised application without amendment allowed when the case status is %s',
      (caseStatus: string) => {
        applyAmendGateInputs({ isCourtApplicationFinalised: true, caseStatus });

        expect(component.hasAmendApplication).toBe(false);
      }
    );

    it('should block the amend options for a finalised application when isAmendmentAllowed has never been set', () => {
      component.resultLine = { ...resultLine };
      component.amendApplicationPermission = true;
      component.isCourtApplicationFinalised = true;
      component.caseStatus = 'ACTIVE';
      component.ngOnChanges({} as NgChanges<ResolvedDraftResultLineComponent>);

      expect(component.hasAmendApplication).toBeFalsy();
    });

    it.each(['ACTIVE', 'INACTIVE'])(
      'should allow the amend options for a finalised application when amendment is allowed and the case status is %s',
      (caseStatus: string) => {
        applyAmendGateInputs({
          isCourtApplicationFinalised: true,
          isAmendmentAllowed: true,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it('should allow the amend options for a finalised application when amendment is allowed and no case status is set', () => {
      applyAmendGateInputs({ isCourtApplicationFinalised: true, isAmendmentAllowed: true });

      expect(component.hasAmendApplication).toBe(true);
    });

    it('should allow the amend options for a non-finalised application', () => {
      applyAmendGateInputs({ isCourtApplicationFinalised: false });

      expect(component.hasAmendApplication).toBe(true);
    });

    it('should produce the same outcome for ACTIVE and INACTIVE case statuses for a finalised application without amendment allowed', () => {
      applyAmendGateInputs({ isCourtApplicationFinalised: true, caseStatus: 'INACTIVE' });
      const inactiveOutcome = component.hasAmendApplication;

      applyAmendGateInputs({ isCourtApplicationFinalised: true, caseStatus: 'ACTIVE' });
      const activeOutcome = component.hasAmendApplication;

      expect(inactiveOutcome).toBe(false);
      expect(activeOutcome).toBe(inactiveOutcome);
    });
  });

  describe('hasAmendApplication gate without the amend application permission', () => {
    it.each(['ACTIVE', 'INACTIVE'])(
      'should keep the legacy behaviour and allow the amend options for a finalised application when the case status is %s',
      (caseStatus: string) => {
        applyAmendGateInputs({
          amendApplicationPermission: false,
          isCourtApplicationFinalised: true,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it('should keep the legacy behaviour and allow the amend options for a finalised application when no case status is set', () => {
      applyAmendGateInputs({
        amendApplicationPermission: false,
        isCourtApplicationFinalised: true
      });

      expect(component.hasAmendApplication).toBe(true);
    });

    it('should allow the amend options for a non-finalised application', () => {
      applyAmendGateInputs({
        amendApplicationPermission: false,
        isCourtApplicationFinalised: false
      });

      expect(component.hasAmendApplication).toBe(true);
    });
  });
});
