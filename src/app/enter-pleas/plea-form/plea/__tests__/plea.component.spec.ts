import { Component, DebugElement, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import {
  Defendant,
  GroupedPlea,
  SelectOption,
  OffenceType,
  CPPDate,
  Offence,
  PleaOption
} from '../../../../core';
import { PleaComponent } from '../plea.component';
import { PleaOptionsComponent } from '../plea-options.component';
import * as mockData from '../../../../core/selectors/mock/hearing.json';
import { provideRouter } from '@angular/router';
import { PdkForm, PdkButtonDirective } from '@cpp/pdk';

interface PleaUpdateEvent {
  defendant: Defendant;
  offence: Offence;
}

let mockValue: PleaUpdateEvent;
const mockPleas: GroupedPlea[] = (mockData as any).groupedPleas as GroupedPlea[];
const mockDefendant = mockPleas[0].withoutCount[0];
const mockOffence = mockDefendant.offences[0];

describe('PleaComponent', () => {
  let inner: DebugElement;
  let innerComponent: PleaComponent;
  let component: PleaComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(PleaComponent, {
        remove: { imports: [PleaOptionsComponent] },
        add: { imports: [MockPleaOptionsComponent] }
      })
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;

    inner = fixture.debugElement.query(By.css('plea'));
    innerComponent = inner.componentInstance;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should set plea when setIndicatedPlea is called', fakeAsync(() => {
    const offence = mockOffence;

    innerComponent.setIndicatedPlea(offence, 'NO_INDICATED_PLEA');
    fixture.detectChanges();
    tick();

    expect(mockValue.offence.indicatedPlea.indicatedPleaValue).toBe('NO_INDICATED_PLEA');
  }));

  it('should set indicatedPlea when setIndicatedPlea is called', fakeAsync(() => {
    const offence = mockOffence;

    innerComponent.setIndicatedPlea(offence, 'INDICATED_GUILTY');
    fixture.detectChanges();
    tick();

    expect(mockValue.offence.indicatedPlea.indicatedPleaValue).toBe('INDICATED_GUILTY');
  }));

  it('should set sentencingDecision when setSentencingDecision is called', fakeAsync(() => {
    const offence = mockOffence;

    innerComponent.setSentencingDecision(offence, 'sentencingDecisionId');
    fixture.detectChanges();
    tick();

    expect(mockValue.offence.allocationDecision.courtIndicatedSentence).toEqual({
      courtIndicatedSentenceTypeId: 'sentencingDecisionId',
      courtIndicatedSentenceDescription: 'Sentencing indication requested'
    });
  }));

  it('should set allocationDecision when updateAllocationDecision is called', fakeAsync(() => {
    const offence = mockOffence;

    innerComponent.updateAllocationDecision(offence, ':motReasonId');
    fixture.detectChanges();
    tick();

    expect(mockValue.offence.allocationDecision).toEqual({
      allocationDecisionDate: '2022-02-16',
      motReasonCode: '02',
      motReasonId: ':motReasonId',
      offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
      originatingHearingId: '72b64fc6-a1de-40f3-8751-dee9606ba05a',
      motReasonDescription: ':motReasonDescription',
      sequenceNumber: 20,
      courtIndicatedSentence: {
        courtIndicatedSentenceDescription: null,
        courtIndicatedSentenceTypeId: null
      }
    });
  }));

  describe('#isGuiltyToLesserOffenceNamely', () => {
    it('should return that the pleaValue is NOT guilty ot lesser offence', fakeAsync(() => {
      expect(innerComponent.isGuiltyToLesserOffenceNamely('GUILTY')).toBeFalsy();
    }));

    it('Scenario 1: should return that the pleaValue is guilty ot lesser offence', fakeAsync(() => {
      expect(
        innerComponent.isGuiltyToLesserOffenceNamely('GUILTY_LESSER_OFFENCE_NAMELY')
      ).toBeTruthy();
    }));

    it('Scenario 2: should return that the pleaValue is guilty ot lesser offence', fakeAsync(() => {
      expect(
        innerComponent.isGuiltyToLesserOffenceNamely('GUILTY_TO_ALTERNATIVE_OFFENCE')
      ).toBeTruthy();
    }));
  });

  it('should set lesserOrAlternativeOffence when updateLesserOrAlternativeOffence is called', fakeAsync(() => {
    const offenceType = {
      offenceId: '33ebe963-26d6-41bd-b0c6-a1c1fe1b8a81',
      cjsOffenceCode: 'MH04001',
      title: 'Start / cause to be started a clinical trial without authority',
      legislation:
        'Contrary to regulations 12(1)(a), 49(1)(aa) and 52 of the Medicines for Human Use (Clinical Trials) Regulations 2004.'
    } as OffenceType;
    const offence = mockOffence;
    innerComponent.updateLesserOrAlternativeOffence(offenceType, offence);
    fixture.detectChanges();
    tick();

    expect(mockValue).toEqual({
      defendant: mockDefendant,
      offence: {
        ...offence,
        plea: {
          ...offence.plea,
          lesserOrAlternativeOffence: {
            offenceDefinitionId: offenceType.offenceId,
            offenceCode: offenceType.cjsOffenceCode,
            offenceTitle: offenceType.title,
            offenceLegislation: offenceType.legislation
          }
        }
      }
    });
  }));

  describe('#showEitherWayMOTPleaForm', () => {
    let pleaComponentFixture: ComponentFixture<PleaComponent>;

    beforeEach(() => {
      pleaComponentFixture = TestBed.createComponent(PleaComponent);
      component = pleaComponentFixture.componentInstance;
      component.cppDateUtil = new CPPDate();
      component.selectedHearingDate = '2021-05-05';
      component.defendant = {
        id: 'id',
        defendantId: 'id',
        offences: [
          {
            allocationDecision: {
              motReasonId: 'motReasonId'
            },
            modeOfTrial: 'Either Way'
          },
          {
            allocationDecision: {
              motReasonId: 'motReasonId2'
            },
            modeOfTrial: 'Either Way'
          }
        ]
      } as Defendant;
    });

    it('should return false if hearing type is crown', () => {
      const actual = component.showEitherWayMOTPleaForm('Either Way', {}, 'CROWN');
      expect(actual).toBeFalsy();
    });

    it('should return true if offences has only atleast 2 eitherway offence', () => {
      const offence = {
        modeOfTrial: 'Either Way',
        allocationDecision: {
          motReasonId: 'motReasonId2'
        }
      } as Offence;
      const actual = component.showApplyAll(offence);
      expect(actual).toBe(true);
    });

    it('should return false if offences has only 1 eitherway offence', () => {
      const offence = {
        modeOfTrial: 'Summary',
        allocationDecision: {
          motReasonId: 'motReasonId2'
        }
      } as Offence;
      const actual = component.showApplyAll(offence);
      expect(actual).toBeFalsy();
    });

    it('should return false if hearing type is magistrates but mode of trial is not either way', () => {
      const actual = component.showEitherWayMOTPleaForm('Other', {}, 'MAGISTRATES');
      expect(actual).toBeFalsy();
    });

    it('should return false if cppDateUtil is after hearing date and allocation decision date', () => {
      jest.spyOn(component.cppDateUtil, 'isBefore').mockReturnValue(false);

      const actual = component.showEitherWayMOTPleaForm(
        'Other',
        { allocationDecisionDate: '2021-06-06' },
        'MAGISTRATES'
      );

      expect(actual).toBeFalsy();
    });

    it('should return true if cppDateUtil is before hearing date and allocation date', () => {
      jest.spyOn(component.cppDateUtil, 'isBefore').mockReturnValue(true);

      const actual = component.showEitherWayMOTPleaForm(
        'Either Way',
        { allocationDecisionDate: '2021-04-04' },
        'MAGISTRATES'
      );

      expect(actual).toBeTruthy();
    });

    it('should return true if the offence is Indictable and the defendant is youth', () => {
      jest.spyOn(component.cppDateUtil, 'isBefore').mockReturnValue(true);

      const actual = component.showEitherWayMOTPleaForm(
        'Indictable',
        { allocationDecisionDate: '2021-04-04' },
        'MAGISTRATES',
        true
      );

      expect(actual).toBeTruthy();
    });
  });

  describe('#showSummaryMOTPleaForm', () => {
    let pleaComponentFixture: ComponentFixture<PleaComponent>;

    beforeEach(() => {
      pleaComponentFixture = TestBed.createComponent(PleaComponent);
      component = pleaComponentFixture.componentInstance;
      component.cppDateUtil = new CPPDate();
      component.selectedHearingDate = '2021-05-05';
    });

    it(`should return false if the offence is Indictable,
       the defendant is youth
       and the mode of trial hasnt been captured previously`, () => {
      jest.spyOn(component.cppDateUtil, 'isAfter').mockReturnValue(false);
      const actual = component.showSummaryMOTPleaForm(
        'Indictable',
        { allocationDecisionDate: '2021-06-06' },
        'MAGISTRATES',
        true
      );
      expect(actual).toBeFalsy();
    });

    it('should return true if the offence is not either way or indictable when the defendant is youth', () => {
      jest.spyOn(component.cppDateUtil, 'isAfter').mockReturnValue(false);
      const actual = component.showSummaryMOTPleaForm(
        'Summary',
        { allocationDecisionDate: '2021-06-06' },
        'CROWN',
        true
      );
      expect(actual).toBeTruthy();
    });

    it('should return true if mode of trial is either way, hearing type is crown and no decision date is defined', () => {
      const actual = component.showSummaryMOTPleaForm('Either Way', {}, 'CROWN');
      expect(actual).toBeTruthy();
    });

    it('should return false if cppDateUtil is before hearing date and decision date', () => {
      jest.spyOn(component.cppDateUtil, 'isAfter').mockReturnValue(false);

      const actual = component.showSummaryMOTPleaForm(
        'Either Way',
        { allocationDecisionDate: '2021-05-05' },
        'MAGISTRATES'
      );
      expect(actual).toBeFalsy();
    });

    it('should return true if cppDateUtil is before hearing date and decision date', () => {
      jest.spyOn(component.cppDateUtil, 'isAfter').mockReturnValue(true);

      const actual = component.showSummaryMOTPleaForm(
        'Either Way',
        { allocationDecisionDate: '2021-05-05' },
        'MAGISTRATES'
      );
      expect(actual).toBeTruthy();
    });
  });
});

@Component({
  template: `
    <form
      #form="ngForm"
      pdk-form
      (errors)="errors = $event"
      (validSubmit)="onSubmit(form.value)"
      novalidate
    >
      <plea
        [offence]="offence"
        [defendant]="defendant"
        [motReasonOptions]="mockMotOptions"
        [hearingType]="mockHearingType"
        [sentencingDecisionOptions]="mockSentencingDecisionOptions"
        (updatePlea)="updatePlea($event)"
      >
      </plea>
      <button pdk-button type="submit">Save and continue</button>
    </form>
  `,
  imports: [PleaComponent, FormsModule, PdkForm, PdkButtonDirective]
})
class TestHostComponent {
  mockMotOptions: SelectOption[];
  offence: Offence;
  defendant: Defendant;
  mockSentencingDecisionOptions: SelectOption[];
  mockHearingType: string;

  constructor() {
    this.offence = mockOffence;
    this.defendant = mockDefendant;
    this.mockHearingType = 'CROWN';
    this.mockMotOptions = [
      {
        id: ':motReasonId',
        value: ':motReasonId',
        label: ':motReasonDescription',
        code: '02',
        sequenceNumber: 20
      },
      {
        id: ':motReasonId1',
        value: '01',
        label: ':motReasonDescription1',
        code: '02',
        sequenceNumber: 20
      }
    ];

    this.mockSentencingDecisionOptions = [
      {
        id: 'sentencingDecisionId',
        value: 'sentencingDecisionId',
        label: 'Sentencing indication requested'
      }
    ];
  }
  updatePlea($event: PleaUpdateEvent) {
    mockValue = $event;
  }
}
@Component({
  selector: 'plea-options',
  template: ''
})
class MockPleaOptionsComponent {
  @Input() hearingType: string;
  @Input() hasCivilCase: boolean;
  @Input() isDelegatedPowers: boolean;
  @Input() label: string;
  @Input() disabled = false;
  @Input() type = 'pleaType';
  @Input() standardPleaOptions: PleaOption[];
  @Input() additionalOptions: PleaOption[] = [];
  @Input() magsPleaOnlyOptions: PleaOption[] = [];
  @Input() crownPleaOnlyOptions: PleaOption[] = [];
  @Input() civilCasePleaOptions: PleaOption[] = [];
  @Input() offence: Offence;
  @Input() defaultPleaValue: string;
  @Input() selectedOffenceCode: string;
  @Input() isGuiltyToLesserOffence = false;
  @Input() defendant: Defendant;
  @Output() pleaSelected = new EventEmitter<PleaOption>();
  @Output() onUpdateLesserOrAlternativeOffence = new EventEmitter<PleaOption>();
  @Output() clearPlea = new EventEmitter<void>();
}
