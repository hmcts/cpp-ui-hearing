import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HearingType } from '@cpp/reference-data';
import { HearingTypeSelectorComponent } from './hearing-type-selector.component';
import { FormsModule } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('HearingTypeSelectorComponent', () => {
  let component: HearingTypeSelectorTestComponent;
  let fixture: ComponentFixture<HearingTypeSelectorTestComponent>;
  const hearingTypes = [
    {
      id: '1',
      seqId: 1,
      hearingCode: '1',
      hearingDescription: 'Plea',
      welshHearingDescription: 'a',
      defaultDurationMin: 1
    },
    {
      id: '2',
      seqId: 2,
      hearingCode: '2',
      hearingDescription: 'Plea and Trial',
      welshHearingDescription: 'a',
      defaultDurationMin: 1
    }
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [HearingTypeSelectorTestComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(HearingTypeSelectorTestComponent);
    component = fixture.componentInstance;
    component.hearingTypes = hearingTypes;
    component.preselectedHearingType = hearingTypes[0];
    fixture.detectChanges();
  }));

  it('should render correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should filter search suggestions', () => {
    const hearingTypeSelector = fixture.debugElement.query(
      By.directive(HearingTypeSelectorComponent)
    ).componentInstance;

    hearingTypeSelector.handleSearchSuggestions('plea');
    expect(hearingTypeSelector.filteredSuggestions).toEqual(hearingTypes);
    hearingTypeSelector.handleSearchSuggestions('TRI');
    expect(hearingTypeSelector.filteredSuggestions).toEqual([hearingTypes[1]]);
  });

  it('should emit hearingTypeSelected', () => {
    fixture.debugElement
      .query(By.directive(HearingTypeSelectorComponent))
      .componentInstance.selectHearingType(hearingTypes[0]);
    expect(fixture.componentInstance.hearingTypeSelected).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.hearingTypeSelected).toHaveBeenCalledWith(hearingTypes[0]);
  });

  @Component({
    template: `
      <form pdk-form>
        <hearing-type-selector
          [hearingTypes]="hearingTypes"
          [preselectedHearingType]="preselectedHearingType"
          (hearingTypeSelected)="hearingTypeSelected($event)"
        >
        </hearing-type-selector>
      </form>
    `,
    imports: [HearingTypeSelectorComponent, FormsModule]
  })
  class HearingTypeSelectorTestComponent {
    hearingTypes: HearingType[] = [];
    hearingTypeSelected = jest.fn();
    preselectedHearingType: HearingType;
  }
});
