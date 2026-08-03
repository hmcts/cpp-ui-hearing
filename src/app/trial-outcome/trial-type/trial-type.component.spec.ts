import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { TrialTypeComponent } from './trial-type.component';
import mockData from '../mocks/data.json';
import { UsersGroupsState } from '@cpp/users-groups';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TrialType } from '../../core';
import { CrackedIneffectiveSubReason } from '../../core/model/shared/cracked-ineffective-sub-reason';
import { ValidationError } from '@cpp/pdk';

const mockHearing = { ...mockData.currentHearing, youthCourtDefendantIds: [] as any };
const selectedReason = mockData.selectedReason;

const additionalTrialTypes: TrialType[] = [
  {
    id: 'reason-1',
    seqNo: 1,
    reasonCode: 'A',
    trialType: 'Cracked',
    jurisdiction: 'CCM',
    reasonShortDescription: 'Prosecution accepts guilty plea'
  },
  {
    id: 'reason-2',
    seqNo: 2,
    reasonCode: 'B',
    trialType: 'Cracked',
    jurisdiction: 'CCM',
    reasonShortDescription: 'Defence offers guilty plea'
  },
  {
    id: 'reason-3',
    seqNo: 3,
    reasonCode: 'C',
    trialType: 'Cracked',
    jurisdiction: 'CC',
    reasonShortDescription: 'Witness fails to attend - Prosecution'
  }
];

const mockSubReasons: CrackedIneffectiveSubReason[] = [
  {
    id: 'sub-1',
    subReasonCode: 'SUB1',
    subReasonDesc: 'Sub Reason 1',
    primaryReasonCode: 'CRACKED',
    validFrom: '',
    validTo: ''
  },
  {
    id: 'sub-2',
    subReasonCode: 'SUB2',
    subReasonDesc: 'Sub Reason 2',
    primaryReasonCode: 'CRACKED',
    validFrom: '',
    validTo: ''
  },
  {
    id: 'sub-3',
    subReasonCode: 'SUB3',
    subReasonDesc: 'Sub Reason 3',
    primaryReasonCode: 'INEFFECTIVE',
    validFrom: '',
    validTo: ''
  }
];

const mockSingleSubReason: CrackedIneffectiveSubReason = {
  id: 'sub-2',
  subReasonCode: 'SUB2',
  subReasonDesc: 'Sub Reason 2',
  primaryReasonCode: 'CRACKED',
  validFrom: '',
  validTo: ''
};

const mockTrialEffectivenessError: ValidationError[] = [
  {
    id: 'trial-effectiveness-1',
    message: 'Trial effectiveness is required'
  }
];

describe('TrialTypeComponent', () => {
  let component: TrialTypeComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let mockStore: MockStore<UsersGroupsState>;

  const initialState = {
    usersGroups: {
      permissionsMap: {
        'permission-id-1': {
          object: 'CrackedIneffective',
          action: 'Edit',
          permissionId: 'permission-id-1',
          description: '*'
        }
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), provideMockStore({ initialState })],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    mockStore = TestBed.inject(MockStore);

    component = fixture.debugElement.children[0].componentInstance;
    component.trialTypeOptionId = 'Cracked';
    component.hearing = { ...mockHearing, youthCourtDefendantIds: [] } as any;
    component.selectedReason = selectedReason;
    component.trialTypes = [selectedReason];
    component.citSubreasonEnabled = true;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template when action details is closed', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should toggleActionDetails', () => {
    component.actionDetailsOpen = true;
    component.toggleActionDetails();
    expect(component.actionDetailsOpen).toBeFalsy();
  });

  it('should toggleTypeahead', () => {
    jest.clearAllMocks();

    expect(component.showTypeahead).toBeFalsy();
    component.toggleTypeahead();
    expect(component.showTypeahead).toBeTruthy();
    expect(component.showSelectedReason).toBeFalsy();
    expect(component.selectedReason).toBeNull();
  });

  it('should initialiseJurisdiction for CROWN', () => {
    component.hearing.jurisdictionType = 'CROWN';
    component.setJurisdiction();
    expect(component.jurisdictionTypes).toEqual(['CCM', 'CC']);
  });

  it('should initialiseJurisdiction for MAGS', () => {
    component.hearing.jurisdictionType = 'MAGISTRATES';
    component.setJurisdiction();
    expect(component.jurisdictionTypes).toEqual(['CCM']);
  });

  it('should have the expected template when the action details is open', () => {
    component.toggleActionDetails();
    expect(fixture).toMatchSnapshot();
  });

  it('should save the trial type with sub reason', () => {
    jest.spyOn(component.onSaveTrialType, 'emit');

    component.selectedReason = selectedReason;
    component.selectedSubReason = mockSingleSubReason;
    component.trialTypeOptionId = 'Cracked';

    component.saveTrialType();

    expect(component.onSaveTrialType.emit).toHaveBeenCalledWith({
      ...selectedReason,
      crackedIneffectiveSubReasonId: 'sub-2'
    });
  });

  it('should save vacated trial type', () => {
    jest.spyOn(component.onSaveTrialType, 'emit');

    component.selectedReason = { ...selectedReason, trialType: 'Vacated' };
    component.trialTypeOptionId = 'Vacated';

    component.saveTrialType();

    expect(component.onSaveTrialType.emit).toHaveBeenCalledWith({
      ...selectedReason,
      trialType: 'Vacated',
      vacateTrial: true
    });
  });

  describe('selectReason', () => {
    it('should selectReason if the value is valid for non-vacated trial', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectReason('c81e728d-9d4c-3f63-af06-7f89cc14862c');

      expect(component.selectedReason).toBeDefined();
      expect(component.showTypeahead).toBeFalsy();
      expect(component.showSelectedReason).toBeTruthy();
      expect(component.currentPrimaryReasonCode).toBeDefined();
    });

    it('should clear the selected sub-reason when a new reason is selected', () => {
      component.selectedSubReason = mockSingleSubReason;
      component.trialTypeOptionId = 'Cracked';
      component.selectReason('c81e728d-9d4c-3f63-af06-7f89cc14862c');

      expect(component.selectedSubReason).toBeNull();
    });

    it('should selectReason for vacated trial without showing sub reasons', () => {
      component.trialTypeOptionId = 'Vacated';
      jest.clearAllMocks();

      component.selectReason('c81e728d-9d4c-3f63-af06-7f89cc14862c');

      expect(component.selectedReason).toBeDefined();
      expect(component.showSelectedReason).toBeTruthy();
    });

    it('should not show reason sections when trial type is Effective', () => {
      component.trialTypeOptionId = 'Effective';
      component.showTypeahead = true;
      component.showSelectedReason = true;
      fixture.detectChanges();

      const reasonAutosuggest = fixture.nativeElement.querySelector(
        '[data-role="trial-type-reason"]'
      );
      const selectedReasonContainer = fixture.nativeElement.querySelector(
        '.selected-reason-container'
      );

      expect(reasonAutosuggest).toBeFalsy();
      expect(selectedReasonContainer).toBeFalsy();
    });
  });

  describe('showSubReasonInput', () => {
    it('should be true when a reason is selected and trial type is Cracked', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = selectedReason;
      expect(component.showSubReasonInput).toBeTruthy();
    });

    it('should be true when a reason is selected and trial type is Ineffective', () => {
      component.trialTypeOptionId = 'Ineffective';
      component.selectedReason = selectedReason;
      expect(component.showSubReasonInput).toBeTruthy();
    });

    it('should be false when trial type is Vacated', () => {
      component.trialTypeOptionId = 'Vacated';
      component.selectedReason = selectedReason;
      expect(component.showSubReasonInput).toBeFalsy();
    });

    it('should be false when trial type is Effective', () => {
      component.trialTypeOptionId = 'Effective';
      component.selectedReason = selectedReason;
      expect(component.showSubReasonInput).toBeFalsy();
    });

    it('should be false when no reason is selected', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = null;
      expect(component.showSubReasonInput).toBeFalsy();
    });
  });

  describe('onReasonInput and search functionality', () => {
    beforeEach(() => {
      component.trialTypeOptionId = 'Cracked';
      component.jurisdictionTypes = ['CCM', 'CC'];
      component.trialTypes = additionalTrialTypes;
    });

    it('should store search text when onReasonInput is called with searchText', () => {
      component.onReasonInput('Prosecution');
      expect(component.currentReasonSearchText).toBe('Prosecution');
    });

    it('should not update search text when onReasonInput is called without parameter', () => {
      component.currentReasonSearchText = 'existing text';
      component.onReasonInput();
      expect(component.currentReasonSearchText).toBe('existing text');
    });

    it('should return all options when search text is empty', () => {
      component.onReasonInput('');
      component['filterTypeaheadOptions']();

      expect(component.typeaheadOptions.length).toBe(4);
    });

    it('should return empty filtered results when no matches found', () => {
      component.onReasonInput('NonExistentText');
      component['filterTypeaheadOptions']();

      expect(component.typeaheadOptions.length).toBe(1);
      expect(component.typeaheadOptions[0].id).toBe('');
    });

    it('should reset search text when trialOptionSelected is called for EFFECTIVE', () => {
      component.currentReasonSearchText = 'Prosecution';
      component.trialTypeOptionId = 'Effective';
      component.trialOptionSelected();

      expect(component.currentReasonSearchText).toBe('');
    });

    it('should reset search text when trialOptionSelected is called for non-EFFECTIVE', () => {
      component.currentReasonSearchText = 'Prosecution';
      component.trialTypeOptionId = 'Cracked';
      component.trialOptionSelected();

      expect(component.currentReasonSearchText).toBe('');
    });

    it('should reset search text when toggleTypeahead is called', () => {
      component.currentReasonSearchText = 'Prosecution';
      component.toggleTypeahead();

      expect(component.currentReasonSearchText).toBe('');
    });
  });

  describe('onSubReasonInput', () => {
    beforeEach(() => {
      component['currentPrimaryReasonCode'] = 'CRACKED';
      component.subReasons = mockSubReasons;
    });

    it('should filter sub reasons by description', () => {
      component.onSubReasonInput('Sub Reason 1');
      expect(component.subReasonSuggestions).toEqual([mockSubReasons[0]]);
    });

    it('should filter sub reasons by code', () => {
      component.onSubReasonInput('SUB2');
      expect(component.subReasonSuggestions).toEqual([mockSubReasons[1]]);
    });

    it('should return all options for the current reason code when search text is empty', () => {
      component.onSubReasonInput('');
      expect(component.subReasonSuggestions).toEqual([mockSubReasons[0], mockSubReasons[1]]);
    });

    it('should return empty array when no matches found', () => {
      component.onSubReasonInput('NonExistent');
      expect(component.subReasonSuggestions).toEqual([]);
    });

    it('should clear a previously selected sub-reason when the user types free text', () => {
      component.selectedSubReason = mockSingleSubReason;
      component.onSubReasonInput('random text');
      expect(component.selectedSubReason).toBeNull();
    });

    it('should disable the Save button when typing free text after a valid selection', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = selectedReason;
      component.selectedSubReason = mockSingleSubReason;
      component.originalTrialTypeOptionId = 'Cracked';
      component.originalReasonId = selectedReason.id;
      component.originalSubReasonId = 'sub-2';

      component.onSubReasonInput('random text');

      expect(component.disableSaveButton).toBeTruthy();
    });
  });

  describe('trialOptionSelected', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should select a trial option for EFFECTIVE', () => {
      component.trialTypeOptionId = 'Effective';
      component.trialOptionSelected();

      expect(component.selectedReason).toBeDefined();
      expect(component.showTypeahead).toBeFalsy();
    });

    it('should select a trial option for CRACKED', () => {
      component.trialTypeOptionId = 'Cracked';
      component.trialOptionSelected();

      expect(component.selectedReason).toBeNull();
      expect(component.showTypeahead).toBeTruthy();
    });

    it('should select a trial option for INEFFECTIVE', () => {
      component.trialTypeOptionId = 'Ineffective';
      component.trialOptionSelected();

      expect(component.selectedReason).toBeNull();
      expect(component.showTypeahead).toBeTruthy();
    });

    it('should select a trial option for VACATED', () => {
      component.trialTypeOptionId = 'Vacated';
      component.trialOptionSelected();

      expect(component.selectedReason).toBeNull();
      expect(component.showTypeahead).toBeTruthy();
    });
  });

  it('should provide an initial trial type jurisdiction', () => {
    expect(component.initialTrialTypeJurisdiction()).toEqual({ value: 'cracked' });
  });

  it('should filter typeahead options for Vacated trial', () => {
    const vacatedTrialType = {
      id: 'mock-trial-id',
      seqNo: 2,
      reasonCode: 'B',
      trialType: 'Vacated',
      jurisdiction: 'mock-jurisdiction',
      reasonShortDescription: 'mock-vacated-trial-short-description'
    };
    component.hearing = {
      ...mockHearing,
      crackedIneffectiveTrial: vacatedTrialType
    } as any;
    component.trialTypeOptionId = 'Vacated';
    component.trialTypes = [...component.trialTypes, vacatedTrialType];
    component.onReasonInput();
    expect(component.typeaheadOptions.length).toBeGreaterThan(0);
  });

  describe('buildLabel', () => {
    it('should build the label for vacated trial type', () => {
      const vacatedTrialType = {
        id: 'mock-trial-id',
        seqNo: 2,
        reasonCode: 'B',
        trialType: 'Vacated',
        jurisdiction: 'mock-jurisdiction',
        reasonShortDescription: 'mock-vacated-trial-short-description'
      };
      component.hearing = {
        ...mockHearing,
        crackedIneffectiveTrial: vacatedTrialType
      } as any;
      expect(component.buildLabel()).toBe('TRIAL_OUTCOME.VACATED_TRIAL_TITLE');
    });

    it('should build the label for cracked trial type', () => {
      const crackedTrialType = {
        id: 'mock-trial-id',
        seqNo: 2,
        reasonCode: 'B',
        trialType: 'Cracked',
        jurisdiction: 'mock-jurisdiction',
        reasonShortDescription: 'mock-cracked-trial-short-description'
      };
      component.hearing = {
        ...mockHearing,
        crackedIneffectiveTrial: crackedTrialType
      } as any;
      expect(component.buildLabel()).toBe('TRIAL_OUTCOME.TRIAL_IS_TITLE');
    });

    it('should build the label for ineffective trial type', () => {
      const ineffectiveTrialType = {
        id: 'mock-trial-id',
        seqNo: 2,
        reasonCode: 'B',
        trialType: 'Ineffective',
        jurisdiction: 'mock-jurisdiction',
        reasonShortDescription: 'mock-ineffective-trial-short-description'
      };
      component.hearing = {
        ...mockHearing,
        crackedIneffectiveTrial: ineffectiveTrialType
      } as any;
      expect(component.buildLabel()).toBe('TRIAL_OUTCOME.TRIAL_IS_TITLE');
    });

    it('should build the label for effective trial type', () => {
      component.hearing = {
        ...mockHearing,
        isEffectiveTrial: true
      } as any;
      expect(component.buildLabel()).toBe('TRIAL_OUTCOME.TRIAL_IS_TITLE');
    });

    it('should build the label where trial type has not been set', () => {
      component.hearing = {
        ...mockHearing,
        isEffectiveTrial: false,
        crackedIneffectiveTrial: undefined
      } as any;
      expect(component.buildLabel()).toBe('TRIAL_OUTCOME.COLLAPSIBLE_TITLE');
    });
  });

  describe('disableSaveButton', () => {
    beforeEach(() => {
      component.originalTrialTypeOptionId = 'Cracked';
      component.originalReasonId = selectedReason.id;
      component.originalSubReasonId = '';
    });

    it('should be disabled when no changes made', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = selectedReason;
      component.selectedSubReason = null;
      expect(component.disableSaveButton).toBeTruthy();
    });

    it('should be disabled for VACATED without reason', () => {
      component.trialTypeOptionId = 'Vacated';
      component.selectedReason = null;
      expect(component.disableSaveButton).toBeTruthy();
    });

    it('should be enabled for VACATED with reason', () => {
      component.trialTypeOptionId = 'Vacated';
      component.selectedReason = selectedReason;
      expect(component.disableSaveButton).toBeFalsy();
    });

    it('should be disabled for CRACKED without reason', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = null;
      expect(component.disableSaveButton).toBeTruthy();
    });

    it('should be disabled for CRACKED with reason but without sub reason', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = selectedReason;
      component.selectedSubReason = null;
      expect(component.disableSaveButton).toBeTruthy();
    });

    it('should be enabled for CRACKED with reason and sub reason', () => {
      component.trialTypeOptionId = 'Cracked';
      component.selectedReason = selectedReason;
      component.selectedSubReason = mockSingleSubReason;
      expect(component.disableSaveButton).toBeFalsy();
    });

    it('should be enabled for EFFECTIVE without reason', () => {
      component.originalTrialTypeOptionId = 'Cracked';
      component.trialTypeOptionId = 'Effective';
      component.selectedReason = null;
      expect(component.disableSaveButton).toBeFalsy();
    });
  });

  describe('cpp user role permission access', () => {
    let ineffectiveTrialType: TrialType;

    beforeEach(() => {
      ineffectiveTrialType = {
        id: 'mock-trial-id',
        seqNo: 2,
        reasonCode: 'B',
        trialType: 'Ineffective',
        jurisdiction: 'mock-jurisdiction',
        reasonShortDescription: 'Test description'
      } as TrialType;

      component.trialTypes = [ineffectiveTrialType];
      component.hearing = {
        ...mockHearing,
        crackedIneffectiveTrial: ineffectiveTrialType
      } as any;
    });

    it('should display editable template if cpp user has permissions to edit it', () => {
      component.ngOnChanges({});
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });

    it('should display readonly template with sub reason if cpp user does not have permissions to edit it', () => {
      component.selectedSubReason = mockSingleSubReason;

      mockStore.setState({
        usersGroups: {
          permissionsMap: {}
        }
      } as UsersGroupsState);

      component.ngOnChanges({});
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should display readonly template without sub reason if cpp user does not have permissions to edit it', () => {
      mockStore.setState({
        usersGroups: {
          permissionsMap: {}
        }
      } as UsersGroupsState);

      component.ngOnChanges({});
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should return false from hasTrialEffectivenessError when trialEffectivenessError is null', () => {
      component.trialEffectivenessError = null;
      expect(component.hasTrialEffectivenessError).toBe(false);
    });

    it('should return false from hasTrialEffectivenessError when trialEffectivenessError is empty array', () => {
      component.trialEffectivenessError = [];
      expect(component.hasTrialEffectivenessError).toBe(false);
    });

    it('should return true from hasTrialEffectivenessError when errors exist', () => {
      component.trialEffectivenessError = mockTrialEffectivenessError;
      expect(component.hasTrialEffectivenessError).toBe(true);
    });

    it('should not change isAccordionOpen when trialEffectivenessError is null', () => {
      component.isAccordionOpen = false;
      component.trialEffectivenessError = null;
      expect(component.isAccordionOpen).toBe(false);
    });
  });

  describe('sub-reason back-fill when subReasons input changes', () => {
    const hearingWithSubReason = {
      ...mockHearing,
      crackedIneffectiveTrial: {
        ...selectedReason,
        crackedIneffectiveSubReasonId: 'sub-2'
      }
    };

    it('should populate selectedSubReason when sub-reasons arrive after setInitialValues ran', () => {
      component.hearing = hearingWithSubReason as any;
      component.selectedSubReason = null;

      component.subReasons = [...mockSubReasons];
      component.ngOnChanges({
        subReasons: {
          currentValue: [...mockSubReasons],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      fixture.detectChanges();

      expect(component.selectedSubReason).toEqual(mockSingleSubReason);
    });

    it('should not overwrite a selectedSubReason that was already set', () => {
      component.hearing = hearingWithSubReason as any;
      component.selectedSubReason = mockSubReasons[0];

      component.subReasons = [...mockSubReasons];
      component.ngOnChanges({
        subReasons: {
          currentValue: [...mockSubReasons],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      fixture.detectChanges();

      expect(component.selectedSubReason).toEqual(mockSubReasons[0]);
    });

    it('should clear selectedSubReason if it is no longer present in the updated options', () => {
      component.selectedSubReason = mockSingleSubReason;

      component.subReasons = [mockSubReasons[0]];
      component.ngOnChanges({
        subReasons: {
          currentValue: [mockSubReasons[0]],
          previousValue: mockSubReasons,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      fixture.detectChanges();

      expect(component.selectedSubReason).toBeNull();
    });
  });
});

@Component({
  template: `
    <trial-type
      [trialTypes]="trialTypes"
      [hearing]="hearing"
      [subReasons]="subReasons"
      [trialEffectivenessError]="trialEffectivenessError"
    ></trial-type>
  `,
  imports: [TrialTypeComponent]
})
class TestHostComponent {
  trialTypes = [selectedReason, ...additionalTrialTypes];
  hearing = { ...mockHearing, youthCourtDefendantIds: [] } as any;
  @Input() subReasons: CrackedIneffectiveSubReason[] = mockSubReasons;
  @Input() trialEffectivenessError: ValidationError[] | null = null;
}
