import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { ApplyDecisionComponent } from '../apply-decision.component';

import { provideRouter } from '@angular/router';
import { Defendant, Offence } from '../../../core';

describe('PleaComponent', () => {
  let inner;
  let innerComponent: any;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);

    inner = fixture.debugElement.query(By.css('apply-decision'));
    innerComponent = inner.componentInstance;

    fixture.componentInstance.currentOffence = {
      id: ':id',
      offenceCode: 'AAA',
      offenceTitle: 'a title',
      wording: 'wording',
      allocationDecision: {
        motReasonCode: '02',
        motReasonId: ':motReasonId',
        offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
        originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
        sequenceNumber: 20,
        motReasonDescription: ':motReasonDescription',
        courtIndicatedSentence: {
          courtIndicatedSentenceTypeId: 'sentencingDecisionId',
          courtIndicatedSentenceDescription: 'Sentencing indication requested'
        }
      },
      plea: {},
      indicatedPlea: {}
    } as Offence;
    fixture.componentInstance.hearingId = ':hearingId';
    fixture.componentInstance.defendant = {
      personDefendant: {
        personDetails: {
          firstName: ':firstName',
          lastName: ':lastName'
        }
      },
      offences: [
        {
          id: ':id',
          offenceTitle: 'Offence A',
          allocationDecision: {},
          plea: {},
          indicatedPlea: {}
        },
        {
          id: ':id1',
          modeOfTrial: 'Either Way',
          offenceTitle: 'Offence B',
          allocationDecision: {},
          plea: {},
          indicatedPlea: {}
        }
      ]
    } as Defendant;
    fixture.detectChanges();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should set selectedOffences, when addRemoveAllOffences gets called', fakeAsync(() => {
    expect(innerComponent.selectedOffences).toEqual([]);
    innerComponent.addRemoveAllOffences({ target: { checked: true } });
    expect(innerComponent.selectedOffences).toEqual([':id1']);

    innerComponent.addRemoveAllOffences({ target: { checked: false } });
    expect(innerComponent.selectedOffences).toEqual([undefined]);
  }));

  it('should set selectedOffences, when onSelection gets called', fakeAsync(() => {
    expect(innerComponent.selectedOffences).toEqual([]);
    innerComponent.onSelection({ target: { checked: true } });
    expect(innerComponent.selectedOffences).toEqual(['all']);

    innerComponent.onSelection({ target: { checked: false } });
    expect(innerComponent.selectedOffences).toEqual([]);
  }));

  it('should set selectedOffences, when onSelection gets called', fakeAsync(() => {
    innerComponent.selectedOffences = [':id1'];
    let expectedOffence;
    const onUpdateSpy = jest.spyOn(innerComponent.onUpdate, 'emit');
    onUpdateSpy.mockImplementation((defendant: any) => {
      expectedOffence = defendant.offences[1];
    });
    innerComponent.onSubmit();
    expect(expectedOffence).toEqual({
      offenceTitle: 'Offence B',
      id: ':id1',
      modeOfTrial: 'Either Way',
      allocationDecision: {
        motReasonCode: '02',
        motReasonId: ':motReasonId',
        offenceId: ':id1',
        originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
        sequenceNumber: 20,
        motReasonDescription: ':motReasonDescription',
        courtIndicatedSentence: {
          courtIndicatedSentenceTypeId: 'sentencingDecisionId',
          courtIndicatedSentenceDescription: 'Sentencing indication requested'
        }
      },
      plea: { offenceId: ':id1' },
      indicatedPlea: { offenceId: ':id1' }
    });
    expect(onUpdateSpy).toHaveBeenCalled();
  }));

  it('should call emit on update whether or not selectedOfffences is empty', fakeAsync(() => {
    innerComponent.selectedOffences = [];
    const onUpdateSpy = jest.spyOn(innerComponent.onUpdate, 'emit');
    innerComponent.onSubmit();

    expect(onUpdateSpy).toHaveBeenCalled();
  }));
});

@Component({
  template: `
    <apply-decision
      [hearingId]="hearingId"
      [currentOffence]="currentOffence"
      [defendant]="defendant"
      (onUpdate)="submitUpdatePlea($event)"
    >
    </apply-decision>
  `,
  imports: [ApplyDecisionComponent]
})
class TestHostComponent {
  currentOffence: Offence;
  defendant: Defendant;
  hearingId: string;
  submitUpdatePlea() {}
}
