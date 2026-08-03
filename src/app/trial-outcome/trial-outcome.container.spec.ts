import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { TrialOutcomeContainer } from './trial-outcome.container';
import { SetTrialTypeAction, HearingDetail, VacateTrialAction } from '../core';
import { TrialType } from '../core/model/shared';
import { TrialTypeComponent } from './trial-type/trial-type.component';
import { JsonPipe } from '@angular/common';
import { CrackedIneffectiveSubReason } from '../core/model/shared/cracked-ineffective-sub-reason';
import { ValidationError } from '@cpp/pdk';
import { hasCitSubreason } from '../core/selectors/user-groups';

const state = {
  referenceData: {
    trialTypes: [
      {
        id: 'test',
        description: 'test'
      }
    ]
  },
  hearings: {
    subReasons: [] as CrackedIneffectiveSubReason[],
    trialEffectivenessError: null as ValidationError[] | null
  },
  usersGroups: {
    userServices: [
      {
        features: [
          {
            key: 'CitSubreason'
          }
        ]
      }
    ]
  }
};

describe('TrialOutcomeContainer', () => {
  let component: TrialOutcomeContainer;
  let fixture: ComponentFixture<TrialOutcomeContainer>;

  let selectSpy: any;
  let dispatchSpy: any;

  beforeEach(waitForAsync(() => {
    dispatchSpy = jest.fn();

    selectSpy = jest.fn().mockImplementation(selectorFunc => {
      if (selectorFunc === hasCitSubreason) return of(true);
      return of(selectorFunc.call({}, state));
    });

    TestBed.configureTestingModule({
      imports: [TrialOutcomeContainer],
      providers: [{ provide: Store, useValue: { select: selectSpy, dispatch: dispatchSpy } }],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(TrialOutcomeContainer, {
        remove: { imports: [TrialTypeComponent] },
        add: { imports: [MockTrialTypeComponent] }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrialOutcomeContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should select all required data from Store upon initialization', () => {
    expect(selectSpy).toHaveBeenCalledTimes(4);
  });

  it('should dispatch loadCrackedIneffectiveSubReasons on init', () => {
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LOAD_CRACKED_INEFFECTIVE_SUB_REASONS' })
    );
  });

  it('should dispatch clearCrackedIneffectiveSubReasons on destroy', () => {
    fixture.destroy();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CLEAR_CRACKED_INEFFECTIVE_SUB_REASONS' })
    );
  });

  it('should dispatch a SetTrialTypeAction for effective trial', () => {
    dispatchSpy.mockClear();
    component.hearing = { id: 'test-hearing-id' } as HearingDetail;
    component.saveTrialType({
      id: 'test-trial-type-id',
      trialType: 'Effective',
      vacateTrial: false
    } as TrialType);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(SetTrialTypeAction));
    expect(dispatchSpy.mock.calls[0][0].payload.trialTypeBody).toEqual({
      isEffectiveTrial: true,
      trialTypeId: undefined
    });
  });

  it('should dispatch a SetTrialTypeAction for non-effective trial', () => {
    dispatchSpy.mockClear();
    component.hearing = { id: 'test-hearing-id' } as HearingDetail;
    component.saveTrialType({
      id: 'test-trial-type-id',
      trialType: 'Ineffective',
      vacateTrial: false
    } as TrialType);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(SetTrialTypeAction));
    expect(dispatchSpy.mock.calls[0][0].payload.trialTypeBody).toEqual({
      isEffectiveTrial: undefined,
      trialTypeId: 'test-trial-type-id'
    });
  });

  it('should dispatch a VacateTrialAction', () => {
    const expectedAction = new VacateTrialAction({
      hearingId: 'test-hearing-id',
      vacatedTrialReasonId: 'test-trial-type-id'
    });
    component.hearing = { id: 'test-hearing-id' } as HearingDetail;
    component.saveTrialType({
      id: 'test-trial-type-id',
      vacateTrial: true
    } as TrialType);

    expect(dispatchSpy).toHaveBeenCalledWith(expectedAction);
  });

  it('should emit trialTypeSelected event when saveTrialType is called', () => {
    const emitSpy = jest.spyOn(component.trialTypeSelected, 'emit');
    component.hearing = { id: 'test-hearing-id' } as HearingDetail;

    component.saveTrialType({ id: 'test-trial-type-id' } as TrialType);

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should dispatch setTrialEffectivenessError({ error: null }) when saveTrialType is called', () => {
    dispatchSpy.mockClear();
    component.hearing = { id: 'test-hearing-id' } as HearingDetail;

    component.saveTrialType({ id: 'test-trial-type-id' } as TrialType);

    const clearAction = dispatchSpy.mock.calls.find(
      (call: any[]) => call[0]?.type === 'SET_TRIAL_EFFECTIVENESS_ERROR' && call[0]?.error === null
    );
    expect(clearAction).toBeDefined();
  });

  it('should handle hearing object with undefined id', () => {
    dispatchSpy.mockClear();
    component.hearing = {} as HearingDetail;

    expect(() => {
      component.saveTrialType({ id: 'test-trial-type-id' } as TrialType);
    }).not.toThrow();

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(SetTrialTypeAction));
    expect(dispatchSpy.mock.calls[0][0].payload.hearingId).toBeUndefined();
  });

  it('should handle trial type with value undefined', () => {
    dispatchSpy.mockClear();
    component.hearing = { id: 'test-hearing-id' } as HearingDetail;

    component.saveTrialType({
      id: 'test-trial-type-id',
      trialType: undefined,
      vacateTrial: false
    } as TrialType);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(SetTrialTypeAction));
    expect(dispatchSpy.mock.calls[0][0].payload.trialTypeBody).toEqual({
      isEffectiveTrial: undefined,
      trialTypeId: 'test-trial-type-id'
    });
  });
});

@Component({
  selector: 'trial-type',
  template: `
    <div>Trial Type Component</div>
    <div>Hearing: {{ hearing | json }}</div>
    <div>Trial Types: {{ trialTypes | json }}</div>
  `,
  imports: [JsonPipe]
})
class MockTrialTypeComponent {
  @Input() trialTypes: TrialType[];
  @Input() hearing: HearingDetail;
  @Input() subReasons: any[];
  @Input() trialEffectivenessError: any;
  @Input() citSubreasonEnabled: boolean;
  @Output() onSaveTrialType = new EventEmitter<TrialType>();
}
