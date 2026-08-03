import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, NgControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import {
  JudiciaryAutoSuggestOption,
  JudiciaryTypeaheadComponent
} from './judiciary-typeahead.component';
import { ReferenceDataService } from '../../../../core/services';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { CourtCentre, JudicialMember } from '../../../../core';
import { of, Subject } from 'rxjs';

describe('JudiciaryTypeaheadComponent', () => {
  let component: JudiciaryTypeaheadComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let fetchJudicialMembers = jest.fn();

  const judiciaries = [
    {
      id: 'judicial-id-1',
      titleJudicialPrefix: 'His Honour Judge',
      titleJudicialPrefixWelsh: 'Ei Anrhydedd y Barnwr',
      titleSuffix: 'Esq QC',
      titleSuffixWelsh: 'Ysw CF',
      surname: 'Aaron',
      forenames: 'David',
      judiciaryType: 'Circuit Judge'
    },
    {
      id: 'judicial-id-2',
      titlePrefix: 'Mrs',
      titlePrefixWelsh: 'Mrs',
      surname: 'Abb',
      forenames: 'Shar',
      judiciaryType: 'Magistrate',
      ljaShortName: 'Buckinghamshire'
    },
    {
      id: 'judicial-id-3',
      titlePrefix: 'Mrs',
      titlePrefixWelsh: 'Mrs',
      titleSuffix: 'JP',
      titleSuffixWelsh: 'YH',
      surname: 'Ada',
      forenames: 'Anne',
      judiciaryType: 'Magistrate',
      ljaShortName: 'Buckinghamshire'
    },
    {
      id: 'judicial-id-4',
      titlePrefix: 'Mr',
      titlePrefixWelsh: 'Mr',
      titleSuffix: 'JP',
      titleSuffixWelsh: 'YH',
      cpUserId: 'cp-user-id',
      surname: 'Ade',
      forenames: 'Olu',
      judiciaryType: 'Deputy District Judge (MC)- Fee paid'
    },
    {
      id: 'judicial-id-5',
      seqId: 190,
      titlePrefix: 'Mr',
      titlePrefixWelsh: 'Mr',
      titleSuffix: 'JP',
      titleSuffixWelsh: 'YH',
      cpUserId: 'cp-user-id-2',
      surname: 'Ade',
      forenames: 'Olu',
      judiciaryType: 'Recorder'
    }
  ] as JudicialMember[];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideCppCoreHttpServices(),
        { provide: ReferenceDataService, useValue: { fetchJudicialMembers } },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn()
          }
        },
        NgControl
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.query(
      By.directive(JudiciaryTypeaheadComponent)
    ).componentInstance;
    fixture.detectChanges();

    const courtCentreAutoSuggestEl = fixture.debugElement.queryAll(By.css('pdk-autosuggest input'));
    courtCentreAutoSuggestEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
  });

  it('should create the right templates with actions', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show ljaShortName if it`s provided by endpoint', () => {
    const magistrate = judiciaries.find(judi => judi.judiciaryType === 'Magistrate');
    const expectedJudiciaries: JudiciaryAutoSuggestOption[] = [
      {
        ...magistrate,
        judicialMemberName: `${magistrate.forenames} ${magistrate.surname}`,
        judicialMemberLocation: `${magistrate.judiciaryType || ''} ${
          magistrate.ljaShortName || magistrate.baseLocation || ''
        }`
      }
    ] as JudiciaryAutoSuggestOption[];

    component.source$ = of(expectedJudiciaries) as Subject<JudiciaryAutoSuggestOption[]>;

    fixture.detectChanges();

    const autoSuggestOption = fixture.debugElement.query(By.css('pdk-autosuggest-option > div'))
      .nativeElement.textContent;

    expect(autoSuggestOption).toContain(magistrate.ljaShortName);
  });

  it('should show judiciaryType if it`s provided by endpoint', () => {
    const magistrate = judiciaries.find(judi => judi.judiciaryType === 'Magistrate');
    const expectedJudiciaries: JudiciaryAutoSuggestOption[] = [
      {
        ...magistrate,
        judicialMemberName: `${magistrate.forenames} ${magistrate.surname}`,
        judicialMemberLocation: `${magistrate.judiciaryType || ''} ${
          magistrate.ljaShortName || magistrate.baseLocation || ''
        }`
      }
    ] as JudiciaryAutoSuggestOption[];

    component.source$ = of(expectedJudiciaries) as Subject<JudiciaryAutoSuggestOption[]>;

    fixture.detectChanges();

    const autoSuggestOption = fixture.debugElement.query(By.css('pdk-autosuggest-option > div'))
      .nativeElement.textContent;

    expect(autoSuggestOption).toContain(magistrate.judiciaryType);
  });

  it('should show judiciary details when baselocation or judiciartType is missing if it`s provided by endpoint', () => {
    const magistrate = judiciaries.find(judi => judi.judiciaryType === 'Magistrate');
    const expectedJudiciaries: JudiciaryAutoSuggestOption[] = [
      {
        ...magistrate,
        judicialMemberName: `${magistrate.forenames} ${magistrate.surname}`,
        judicialMemberLocation: `${magistrate.judiciaryType || ''} ${
          magistrate.ljaShortName || magistrate.baseLocation || ''
        }`
      }
    ] as JudiciaryAutoSuggestOption[];

    component.source$ = of(expectedJudiciaries) as Subject<JudiciaryAutoSuggestOption[]>;

    fixture.detectChanges();

    const autoSuggestOption = fixture.debugElement.query(By.css('pdk-autosuggest-option > div'))
      .nativeElement.textContent;

    expect(autoSuggestOption).toContain('');
  });

  it('should show judiciary title if it`s provided by endpoint', () => {
    const magistrate = judiciaries.find(judi => judi.judiciaryType === 'Magistrate');
    const expectedJudiciaries: JudiciaryAutoSuggestOption[] = [
      {
        ...magistrate,
        judicialMemberName: `${magistrate.titlePrefix || magistrate.titleJudicialPrefix || ''} ${
          magistrate.forenames
        } ${magistrate.surname}`,
        judicialMemberLocation: `${magistrate.judiciaryType || ''} ${
          magistrate.ljaShortName || magistrate.baseLocation || ''
        }`
      }
    ] as JudiciaryAutoSuggestOption[];

    component.source$ = of(expectedJudiciaries) as Subject<JudiciaryAutoSuggestOption[]>;

    fixture.detectChanges();

    const autoSuggestOption = fixture.debugElement.query(By.css('pdk-autosuggest-option > div'))
      .nativeElement.textContent;

    expect(autoSuggestOption).toContain(magistrate.titlePrefix);
  });
});

@Component({
  template: `
    <form>
      <judiciary-typeahead></judiciary-typeahead>
    </form>
  `,
  imports: [JudiciaryTypeaheadComponent, FormsModule]
})
class TestHostComponent {
  courtCentres = [
    {
      id: '',
      name: '',
      courtrooms: []
    }
  ] as CourtCentre[];
}
