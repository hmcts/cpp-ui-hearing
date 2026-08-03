import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of, Observable } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { AppState, GroupedPlea } from '../../../core';
import * as mockData from '../../../core/selectors/mock/hearing.json';
import { ApplyDecisionContainer } from '../apply-decision.container';

const mockPleas: GroupedPlea[] = (mockData as any).groupedPleas;
const mockDefendantFromData = mockPleas[0].withoutCount[0];
const mockOffenceFromData = mockDefendantFromData.offences[0];

describe('ApplyDecisionContainer', () => {
  let fixture: ComponentFixture<ApplyDecisionContainer>;
  let selectSpy: jest.Mock<Observable<any>, [any]>;
  let dispatchSpy: jest.Mock<void, [any]>;
  let state: AppState;

  beforeEach(waitForAsync(() => {
    state = {
      hearings: {
        current: {}
      },
      referenceData: {}
    } as AppState;

    dispatchSpy = jest.fn();
    selectSpy = jest.fn().mockImplementation(selectorFunc => {
      return of(selectorFunc(state));
    });

    TestBed.configureTestingModule({
      imports: [ApplyDecisionContainer],
      providers: [
        provideTranslateService(),
        { provide: Store, useValue: { select: selectSpy, dispatch: dispatchSpy } }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplyDecisionContainer);
    const component = fixture.componentInstance;
    component.defendant = mockDefendantFromData;
    component.currentOffence = mockOffenceFromData;

    fixture.detectChanges();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });
});
