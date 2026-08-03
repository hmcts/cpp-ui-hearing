import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { HearingOffencesComponent } from '../hearing-offences.component';
import { Offence, reducers } from '../../../../../../core';

describe('HearingOffencesComponent', () => {
  let fixture: ComponentFixture<HearingOffencesComponent>;
  let component: HearingOffencesComponent;
  let offences: Offence[];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HearingOffencesComponent],
      providers: [provideStore(reducers, { runtimeChecks: {} })]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingOffencesComponent);
    component = fixture.debugElement.componentInstance;

    offences = [
      {
        id: '1',
        offenceCode: 'CJS24234',
        startDate: '20180-10-01',
        statementOfOffence: {
          title: 'Offence title',
          legislation: 'Legislation'
        }
      }
    ] as Offence[];
  });

  it('When number of offences is equal to One', () => {
    component.offences = offences;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('When number of offences is greater than One', () => {
    const fourOffences = [
      ...offences,
      {
        id: '4',
        offenceCode: 'CJS24234',
        startDate: '20180-10-01',
        statementOfOffence: {
          title: 'Test title 4',
          legislation: 'Test legislation 4'
        }
      },
      {
        id: '5',
        offenceCode: 'CJS24234',
        startDate: '20180-10-01',
        statementOfOffence: {
          title: 'Test title 5',
          legislation: 'Test legislation 5'
        }
      }
    ] as Offence[];

    component.offences = fourOffences;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});
