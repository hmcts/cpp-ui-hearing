import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { LinkType } from '@cpp/reference-data';
import { Action } from '@ngrx/store';
import produce from 'immer';
import { CourtApplication, HearingDetail, Offence, ProsecutionCaseDetails } from '../../../../core';
import { AmendmentService } from '../../../common/services/amendment.service';
import { DraftResultRelation } from '../../../results.interfaces';
import { DraftResultChildForm, DraftResultComponent } from '../draft-result.component';

describe('DraftResultComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AmendmentService,
          useValue: {
            requestAmendmentReason: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
  });

  describe('action bar', () => {
    it('should render', async () => {
      const { fixture } = await createComponent();

      expect(fixture).toMatchSnapshot();
    });

    it('should disable the save and continue button when there are no valid result prompts', async () => {
      const { fixture } = await createComponent({ draftResultPromptsValid: false });

      expect(fixture).toMatchSnapshot();
    });

    it('should handle no errors when submitting registered child forms', async () => {
      const component = await createComponent();
      const childFormOne: DraftResultChildForm = {
        errors: null,
        submit: jest.fn()
      };

      component.draftResultRef.registerResultLineChildForm(childFormOne);
      component.submitSaveBtn();

      expect(childFormOne.submit).toHaveBeenCalled();
      expect(component.fixture.componentInstance.onSaveAndContinue).toHaveBeenCalled();
    });

    it('should handle errors when submitting registered child forms', async () => {
      const component = await createComponent();
      const childFormOne: DraftResultChildForm = {
        errors: [{ id: '1', message: '*' }],
        submit: jest.fn()
      };

      component.draftResultRef.registerResultLineChildForm(childFormOne);
      component.submitSaveBtn();

      expect(childFormOne.submit).toHaveBeenCalled();
      expect(component.fixture.componentInstance.onErrors).toHaveBeenCalledWith(
        childFormOne.errors
      );
    });

    it('should handle deregistered child forms', async () => {
      const component = await createComponent();
      const childFormOne: DraftResultChildForm = {
        errors: [{ id: '1', message: '*' }],
        submit: jest.fn()
      };
      const childFormTwo: DraftResultChildForm = {
        errors: [{ id: '1', message: '*' }],
        submit: jest.fn()
      };

      component.draftResultRef.registerResultLineChildForm(childFormOne);
      component.draftResultRef.registerResultLineChildForm(childFormTwo);
      component.draftResultRef.deregisterResultLineChildForm(childFormOne);
      component.submitSaveBtn();

      expect(childFormOne.submit).not.toHaveBeenCalled();
      expect(childFormTwo.submit).toHaveBeenCalled();
    });

    it('should display an error for a failed action', async () => {
      const { fixture } = await createComponent({ errorAction: { type: 'ERROR' } });

      expect(fixture).toMatchSnapshot();
    });

    it('should retry a failed action', async () => {
      const { fixture } = await createComponent({ errorAction: { type: 'ERROR' } });

      fixture.debugElement
        .query(By.css('[data-test-id="draftResultError"] a'))
        .nativeElement.click();

      expect(fixture.componentInstance.onRetryFailedAction).toHaveBeenCalledWith({ type: 'ERROR' });
    });

    it('should submit the parser for a single offence', async () => {
      const component = await createComponent({
        prosecutionCases: [prosecutionCaseOne]
      });

      component.setParserTextForTargetIndex(0, 'NCOSTS');
      component.submitCreateDraftsBtn();

      expect(component.fixture.componentInstance.onParseTextValues).toHaveBeenCalledWith([
        {
          amendmentReason: null,
          caseId: 'prosecutionCaseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId1',
          originalText: 'NCOSTS'
        }
      ]);
    });

    it('should submit the parser for an offence introduced by a linked application', async () => {
      const component = await createComponent({
        applications: [linkedApplication]
      });

      component.setParserTextForTargetIndex(1, 'NCOSTS');
      component.submitCreateDraftsBtn();

      expect(component.fixture.componentInstance.onParseTextValues).toHaveBeenCalledWith([
        {
          amendmentReason: null,
          applicationId: 'applicationId',
          caseId: 'prosecutionCaseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId1',
          originalText: 'NCOSTS'
        }
      ]);
    });

    it('should submit the parser for a linked application', async () => {
      const component = await createComponent({
        applications: [linkedApplication]
      });

      component.setParserTextForTargetIndex(0, 'NCOSTS');
      component.submitCreateDraftsBtn();

      expect(component.fixture.componentInstance.onParseTextValues).toHaveBeenCalledWith([
        {
          amendmentReason: null,
          applicationId: 'applicationId',
          caseId: 'prosecutionCaseId',
          masterDefendantId: 'masterDefendantId',
          originalText: 'NCOSTS'
        }
      ]);
    });

    it('should submit the parser for a standalone application', async () => {
      const component = await createComponent({
        applications: [standaloneApplication]
      });

      component.setParserTextForTargetIndex(0, 'NCOSTS');
      component.submitCreateDraftsBtn();

      expect(component.fixture.componentInstance.onParseTextValues).toHaveBeenCalledWith([
        {
          amendmentReason: null,
          applicationId: 'standaloneApplicationId',
          originalText: 'NCOSTS'
        }
      ]);
    });

    it('should submit all parsers for combined targets', async () => {
      const component = await createComponent({
        applications: [linkedApplication],
        prosecutionCases: [prosecutionCaseOne]
      });

      component.setParserTextForTargetIndex(0, 'NCOSTS');
      component.setParserTextForTargetIndex(1, 'CO');
      component.submitCreateDraftsBtn();

      expect(component.fixture.componentInstance.onParseTextValues).toHaveBeenCalledWith([
        {
          amendmentReason: null,
          applicationId: 'applicationId',
          originalText: 'NCOSTS'
        },
        {
          amendmentReason: null,
          applicationId: 'applicationId',
          caseId: 'prosecutionCaseId',
          defendantId: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId1',
          originalText: 'CO'
        }
      ]);
    });
  });

  describe('applications', () => {
    it('should render a linked application', async () => {
      const { fixture } = await createComponent({ applications: [linkedApplication] });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a standalone application', async () => {
      const { fixture } = await createComponent({ applications: [standaloneApplication] });

      expect(fixture).toMatchSnapshot();
    });

    it('should render a first hearing application', async () => {
      const { fixture } = await createComponent({ applications: [firstHearingApplication] });

      expect(fixture).toMatchSnapshot();
    });
  });

  describe('offences', () => {
    it('should render an empty offence', async () => {
      const { fixture } = await createComponent({ prosecutionCases: [prosecutionCaseOne] });

      expect(fixture).toMatchSnapshot();
    });

    it('should collapse offences belonging to linked applications', async () => {
      const { fixture } = await createComponent({
        applications: [linkedApplication],
        prosecutionCases: [prosecutionCaseOne]
      });

      expect(fixture).toMatchSnapshot();
    });
  });

  describe('readonly', () => {
    it('should render the component in a read only state', async () => {
      const { fixture } = await createComponent({
        prosecutionCases: [prosecutionCaseOne],
        readonly: true
      });

      expect(fixture).toMatchSnapshot();
    });
  });

  describe('shadow listing', () => {
    const createComponentForShadowListing = (shadowListedOffenceIds: string[] = []) => {
      return createComponent({
        shadowListedOffenceIds,
        prosecutionCases: [
          produce(prosecutionCaseOne, ({ defendants }) => {
            defendants[0].offences = [{ id: 'offenceId1' }, { id: 'offenceId2' }] as Offence[];
          })
        ]
      });
    };

    it('should toggle an offence for shadowlisting', async () => {
      const component = await createComponentForShadowListing();
      const { fixture, toggleShadowListingForOffenceIndex } = component;

      await toggleShadowListingForOffenceIndex(0);

      expect(fixture.componentInstance.onShadowListedOffenceIdsChange).toHaveBeenCalledWith([
        'offenceId1'
      ]);
    });

    it('should toggle on all offences for shadowlisting', async () => {
      const component = await createComponentForShadowListing();
      const { fixture, toggleShadowListingForAllOffences } = component;

      await toggleShadowListingForAllOffences();

      expect(fixture.componentInstance.onShadowListedOffenceIdsChange).toHaveBeenCalledWith([
        'offenceId1',
        'offenceId2'
      ]);
    });

    it('should toggle off all offences for shadowlisting', async () => {
      const component = await createComponentForShadowListing(['offenceId1', 'offenceId2']);
      const { fixture, toggleShadowListingForAllOffences } = component;

      await toggleShadowListingForAllOffences();
      expect(fixture.componentInstance.onShadowListedOffenceIdsChange).toHaveBeenCalledWith([]);
    });

    it('should recognise when all offences are selected manually', async () => {
      const component = await createComponentForShadowListing(['offenceId2']);
      const { fixture, toggleShadowListingForOffenceIndex } = component;

      await toggleShadowListingForOffenceIndex(0);

      expect(fixture).toMatchSnapshot();
      expect(fixture.componentInstance.onShadowListedOffenceIdsChange).toHaveBeenLastCalledWith([
        'offenceId2',
        'offenceId1'
      ]);
    });

    it('should recognise when an offence is deselected manually', async () => {
      const component = await createComponentForShadowListing(['offenceId1', 'offenceId2']);
      const { fixture, toggleShadowListingForOffenceIndex } = component;

      await toggleShadowListingForOffenceIndex(0);

      expect(fixture).toMatchSnapshot();
      expect(fixture.componentInstance.onShadowListedOffenceIdsChange).toHaveBeenCalledWith([
        'offenceId2'
      ]);
    });
  });
  @Component({
    template: `
      <cpp-draft-result
        [draftResultError]="draftResultError"
        [draftResultPromptsValid]="draftResultPromptsValid"
        [draftResultRelations]="draftResultRelations"
        [draftResultSaving]="draftResultSaving"
        [hearing]="hearing"
        [readonly]="readonly"
        [shadowListedOffenceIds]="shadowListedOffenceIds"
        [sharedTargetIds]="sharedTargetIds"
        (errors)="onErrors($event)"
        (parseTextValues)="onParseTextValues($event)"
        (retryFailedAction)="onRetryFailedAction($event)"
        (saveAndContinue)="onSaveAndContinue()"
        (shadowListedOffenceIdsChange)="onShadowListedOffenceIdsChange($event)"
      >
      </cpp-draft-result>
    `,
    imports: [DraftResultComponent]
  })
  class DraftResultTestComponent {
    draftResultError: { action: Action } | null = null;
    draftResultPromptsValid = true;
    draftResultRelations: Record<string, DraftResultRelation[]> = {};
    draftResultSaving = false;
    hearing = { id: 'hearingId' } as HearingDetail;
    readonly = false;
    shadowListedOffenceIds: string[] = [];
    sharedTargetIds: string[] = [];
    onErrors = jest.fn();
    onParseTextValues = jest.fn();
    onRetryFailedAction = jest.fn();
    onSaveAndContinue = jest.fn();
    onShadowListedOffenceIdsChange = jest.fn();
  }

  async function createComponent({
    applications,
    draftResultPromptsValid,
    errorAction,
    prosecutionCases,
    readonly,
    relations,
    shadowListedOffenceIds,
    sharedTargetIds
  }: {
    applications?: CourtApplication[];
    draftResultPromptsValid?: boolean;
    errorAction?: Action;
    relations?: Record<string, DraftResultRelation[]>;
    prosecutionCases?: ProsecutionCaseDetails[];
    readonly?: boolean;
    shadowListedOffenceIds?: string[];
    sharedTargetIds?: string[];
  } = {}) {
    const fixture = TestBed.createComponent(DraftResultTestComponent);

    if (applications || prosecutionCases) {
      fixture.componentInstance.hearing = {
        id: 'hearingId',
        courtApplications: applications,
        prosecutionCases
      } as HearingDetail;
    }
    if (errorAction) {
      fixture.componentInstance.draftResultError = { action: errorAction };
    }
    if (draftResultPromptsValid !== undefined) {
      fixture.componentInstance.draftResultPromptsValid = draftResultPromptsValid;
    }
    if (readonly !== undefined) {
      fixture.componentInstance.readonly = readonly;
    }
    if (relations) {
      fixture.componentInstance.draftResultRelations = relations;
    }
    if (shadowListedOffenceIds) {
      fixture.componentInstance.shadowListedOffenceIds = shadowListedOffenceIds;
    }
    if (sharedTargetIds) {
      fixture.componentInstance.sharedTargetIds = sharedTargetIds;
    }

    fixture.detectChanges();
    await fixture.whenStable();

    const draftResultRef: DraftResultComponent = fixture.debugElement.query(
      By.directive(DraftResultComponent)
    ).componentInstance;

    const setParserTextForTargetIndex = (index: number, value: string) => {
      const parserTextInput = fixture.debugElement.queryAll(By.css('[name="rawText"]'))[index];
      parserTextInput.nativeElement.value = value;
      parserTextInput.nativeElement.dispatchEvent(new Event('input'));
    };

    const submitCreateDraftsBtn = () => {
      fixture.debugElement
        .queryAll(By.css('.draft-result-action-bar button'))[0]
        .nativeElement.click();
    };

    const submitSaveBtn = () => {
      fixture.debugElement
        .queryAll(By.css('.draft-result-action-bar button'))[1]
        .nativeElement.click();
    };

    const toggleShadowListingForAllOffences = async () => {
      fixture.debugElement
        .query(By.css('[data-test-id="toggleAllShadowListing"] input'))
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();
    };

    const toggleShadowListingForOffenceIndex = async (index: number) => {
      fixture.debugElement
        .queryAll(By.css('[data-test-id="offence"]'))
        [index].query(By.css('[data-test-id="toggleShadowListing"] input'))
        .nativeElement.click();
      fixture.detectChanges();

      await fixture.whenStable();
    };

    return {
      draftResultRef,
      fixture,
      submitCreateDraftsBtn,
      setParserTextForTargetIndex,
      submitSaveBtn,
      toggleShadowListingForAllOffences,
      toggleShadowListingForOffenceIndex
    };
  }

  const linkedApplication = {
    id: 'applicationId',
    applicationReference: 'APPLICATION_URN',
    applicationParticulars: 'Application particulars text',
    courtApplicationCases: [
      {
        prosecutionCaseId: 'prosecutionCaseId',
        offences: [
          {
            id: 'offenceId1',
            offenceTitle: 'Offence title',
            wording: 'Offence wording'
          }
        ],
        prosecutionCaseIdentifier: {
          caseURN: 'CASE_URN'
        }
      }
    ],
    subject: {
      masterDefendant: {
        masterDefendantId: 'masterDefendantId',
        defendantCase: [
          {
            caseId: 'prosecutionCaseId',
            defendantId: 'defendantId'
          }
        ]
      }
    },
    type: {
      linkType: 'LINKED',
      type: 'Application type'
    }
  } as CourtApplication;

  const prosecutionCaseOne = {
    id: 'prosecutionCaseId',
    defendants: [
      {
        id: 'defendantId',
        masterDefendantId: 'masterDefendantId',
        personDefendant: {
          personDetails: {
            firstName: 'James',
            lastName: 'Gray'
          }
        },
        offences: [
          {
            id: 'offenceId1',
            offenceTitle: 'Offence title',
            wording: 'Offence wording'
          }
        ]
      }
    ],
    prosecutionCaseIdentifier: {
      caseURN: 'CASE_URN'
    }
  } as ProsecutionCaseDetails;

  const firstHearingApplication = {
    id: 'applicationId',
    applicationReference: 'APPLICATION_URN',
    applicationParticulars: 'Application particulars text',
    courtApplicationCases: [
      {
        prosecutionCaseId: 'prosecutionCaseId',
        offences: [
          {
            id: 'offenceId1',
            offenceTitle: 'Offence title',
            wording: 'Offence wording'
          }
        ],
        prosecutionCaseIdentifier: {
          caseURN: 'CASE_URN'
        }
      }
    ],
    subject: {
      masterDefendant: {
        masterDefendantId: 'masterDefendantId',
        defendantCase: [
          {
            caseId: 'prosecutionCaseId',
            defendantId: 'defendantId'
          }
        ]
      }
    },
    type: {
      linkType: LinkType.FIRST_HEARING,
      type: 'Application type'
    }
  } as CourtApplication;

  const standaloneApplication = {
    id: 'standaloneApplicationId',
    applicationReference: 'APPLICATION_URN',
    applicationParticulars: 'Application particulars text',
    subject: {
      personDetails: {
        firstName: 'James',
        lastName: 'Gray'
      }
    },
    type: {
      type: 'STANDALONE'
    }
  } as CourtApplication;
});
