import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormArray } from '@angular/forms';
import { CheckboxChangeEvent, PdkCheckboxComponent } from '@cpp/pdk';
import { provideTranslateService } from '@ngx-translate/core';
import { HearingDetail, SearchCriteriaAvailableHearingsType } from '../../../../../core';
import mockData from '../../../../../core/selectors/mock/hearing.json';
import {
  FindAvailableHearingComponent,
  RelatedCaseTypes
} from './find-available-hearing.component';

const mockHearing = (mockData as any).hearing as HearingDetail;
const caseUrnsMockHearing = [mockHearing.prosecutionCases[0].prosecutionCaseIdentifier.caseURN];

describe('FindAvailableHearingComponent', () => {
  let component: FindAvailableHearingComponent;
  let fixture: ComponentFixture<FindAvailableHearingComponent>;
  let specificCaseUrns: UntypedFormArray;

  const tickCheckbox = (...value: RelatedCaseTypes[]): void => {
    component.relatedHearingsForm.get('caseTypes').setValue(value);
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [FindAvailableHearingComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FindAvailableHearingComponent);
    component = fixture.componentInstance;
    component.hearing = mockHearing;
    component.caseUrns = [mockHearing.prosecutionCases[0].prosecutionCaseIdentifier.caseURN];
    fixture.detectChanges();
    specificCaseUrns = component.relatedHearingsForm.get('specificCaseUrns') as UntypedFormArray;
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should match the snapshot if specificCase is checked', () => {
    const mockCaseUrn1 = 'test-case-urn-1';
    tickCheckbox(RelatedCaseTypes.specific);
    specificCaseUrns.at(0).setValue(mockCaseUrn1);
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('#addAnotherSpecificCase', () => {
    expect(specificCaseUrns.length).toBe(1);

    component.addAnotherSpecificCase();

    expect(specificCaseUrns.length).toBe(2);
  });

  it('#handleResetFilters', () => {
    specificCaseUrns.at(0).setValue('test specific case');

    component.handleResetFilters();

    expect(specificCaseUrns.at(0).value).toBeNull();
  });

  describe('#onSubmit', () => {
    it('should emit the right values for "case in hearing"', () => {
      jest.spyOn(component.onFindAvailableHearings, 'emit');
      tickCheckbox(RelatedCaseTypes.sameCase);
      component.onSubmit();
      expect(component.onFindAvailableHearings.emit).toHaveBeenCalledWith({
        caseUrns: caseUrnsMockHearing,
        hearingId: mockHearing.id,
        searchCriterias: [SearchCriteriaAvailableHearingsType.CASE_IN_HEARING],
        caseUrnForLinkedCases: caseUrnsMockHearing
      });
    });

    it('should emit the right values for "matched defendants"', () => {
      jest.spyOn(component.onFindAvailableHearings, 'emit');
      tickCheckbox(RelatedCaseTypes.linkedCase);
      component.onSubmit();
      expect(component.onFindAvailableHearings.emit).toHaveBeenCalledWith({
        caseUrns: null,
        hearingId: mockHearing.id,
        searchCriterias: [SearchCriteriaAvailableHearingsType.MATCHED_DEFENDANTS],
        caseUrnForLinkedCases: caseUrnsMockHearing
      });
    });

    describe('specific case', () => {
      const mockCaseUrn1 = 'test-case-urn-1';
      const mockCaseUrn2 = 'test-case-urn-2';
      it('should emit the right values for 1 specific case', () => {
        jest.spyOn(component.onFindAvailableHearings, 'emit');
        tickCheckbox(RelatedCaseTypes.specific);
        specificCaseUrns.at(0).setValue(mockCaseUrn1);
        component.onSubmit();
        expect(component.onFindAvailableHearings.emit).toHaveBeenCalledWith({
          caseUrns: [mockCaseUrn1],
          hearingId: mockHearing.id,
          searchCriterias: [],
          caseUrnForLinkedCases: caseUrnsMockHearing
        });
      });

      it('should emit the right values for 2 specific cases where second case has whitespaces', () => {
        jest.spyOn(component.onFindAvailableHearings, 'emit');
        tickCheckbox(RelatedCaseTypes.specific);
        specificCaseUrns.at(0).setValue(mockCaseUrn1);
        component.addAnotherSpecificCase();
        specificCaseUrns.at(1).setValue(`    ${mockCaseUrn2}    `);
        component.onSubmit();
        expect(component.onFindAvailableHearings.emit).toHaveBeenCalledWith({
          caseUrns: [mockCaseUrn1, mockCaseUrn2],
          hearingId: mockHearing.id,
          searchCriterias: [],
          caseUrnForLinkedCases: caseUrnsMockHearing
        });
      });
    });

    it('should emit the right values for "case in hearing" & "specific case"', () => {
      const mockCaseUrn = 'test-case-urn-1';

      jest.spyOn(component.onFindAvailableHearings, 'emit');
      tickCheckbox(RelatedCaseTypes.sameCase, RelatedCaseTypes.specific);
      specificCaseUrns.at(0).setValue(mockCaseUrn);
      component.onSubmit();
      expect(component.onFindAvailableHearings.emit).toHaveBeenCalledWith({
        caseUrns: [...caseUrnsMockHearing, mockCaseUrn],
        hearingId: mockHearing.id,
        searchCriterias: [SearchCriteriaAvailableHearingsType.CASE_IN_HEARING],
        caseUrnForLinkedCases: caseUrnsMockHearing
      });
    });
  });

  it('#checkSpecificCases, should reset specific cases if specific case checkbox is unchecked ', () => {
    const specificCheckbox = {} as PdkCheckboxComponent;
    const checkBoxEvent = { source: specificCheckbox, checked: false } as CheckboxChangeEvent;
    component.addAnotherSpecificCase();
    specificCaseUrns.at(0).setValue('test specific case');

    component.checkSpecificCases(checkBoxEvent, specificCheckbox);

    expect(specificCaseUrns.length).toBe(1);
    expect(specificCaseUrns.at(0).value).toBeNull();
  });

  it('#checkSpecificCases, should do nothing if specific case checkbox is checked ', () => {
    const specificCheckbox = {} as PdkCheckboxComponent;
    const checkBoxEvent = { source: specificCheckbox, checked: true } as CheckboxChangeEvent;
    component.addAnotherSpecificCase();
    specificCaseUrns.at(0).setValue('test specific case');

    component.checkSpecificCases(checkBoxEvent, specificCheckbox);

    expect(specificCaseUrns.length).toBe(2);
    expect(specificCaseUrns.at(0).value).toEqual('test specific case');
  });
});
