import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CopyResultsContainerComponent } from '../copy-results.container';
import { CopyResultsComponent } from '../copy-results.component';
import {
  DraftResult,
  ResolvedDraftResultLine,
  CopyDraftResultsTarget
} from '../../results.interfaces';
import { AppState, HearingDetail, HearingDetailRedux, HearingLockState } from 'src/app/core';
import { DraftResultActions } from '../../core/store';
import { hearingMock, mockSummary } from 'src/app/mock-data/test-mock-data';

describe('CopyResultsContainerComponent', () => {
  let component: CopyResultsContainerComponent;
  let fixture: ComponentFixture<CopyResultsContainerComponent>;
  let store: MockStore<AppState>;
  const initialState = {
    hearings: {
      current: {
        hearing: hearingMock as unknown as HearingDetail,
        hearingState: HearingLockState.INITIALISED
      } as HearingDetailRedux,
      summaries: [mockSummary],
      selectedHearingDate: null,
      isRestricted: true
    },
    results: {
      invalidResultLines: null
    },
    usersGroups: {
      userGroups: [],
      userServices: []
    }
  } as unknown as AppState;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CopyResultsContainerComponent],
      providers: [
        provideStore({}, { runtimeChecks: {} }),
        provideRouter([]),
        provideMockStore({ initialState }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: jest.fn().mockReturnValue('mock-target-id')
              }
            }
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(CopyResultsContainerComponent, {
        remove: { imports: [CopyResultsComponent] },
        add: { imports: [MockCopyResultsComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CopyResultsContainerComponent);
    store = TestBed.inject(MockStore);
    component = fixture.componentInstance;
    fixture.detectChanges();
    jest.spyOn(store, 'dispatch');
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture).toMatchSnapshot();
  });

  it('should handle copying results', () => {
    const mockTargets: CopyDraftResultsTarget[] = [
      {
        caseId: 'ffe8dc29-bcb9-489f-a0fd-d9e7c6d19a2d',
        defendantId: 'd0116d56-616b-40dd-b4e7-9b5280e94a8a',
        masterDefendantId: '6ab2221b-0379-439b-b124-e14407a7c32e',
        offenceId: 'ca20e636-6fb3-4457-b3ee-39af1d7b4e3f',
        originalResultLineId: 'a6620f8b-e622-4f92-89fa-023cb8d42aa5'
      }
    ];
    component.handleCopyResults(mockTargets);
    expect(store.dispatch).toHaveBeenCalledWith(
      DraftResultActions.copyDraftResultLines({ copyTargets: mockTargets })
    );
  });

  it('should dispatch clearDraftResultLineErrors on destroy', () => {
    component.ngOnDestroy();
    expect(store.dispatch).toHaveBeenCalledWith(DraftResultActions.clearDraftResultLineErrors());
  });
});

@Component({
  selector: 'copy-results',
  template: `
    <div>
      <div>copyFromTargetId: {{ copyFromTargetId }}</div>
      <div>draftResult: {{ draftResult | json }}</div>
      <div>hearing: {{ hearing | json }}</div>
      <div>invalidResultLines: {{ invalidResultLines | json }}</div>
    </div>
  `,
  imports: [JsonPipe]
})
class MockCopyResultsComponent {
  @Input() copyFromTargetId: string;
  @Input() draftResult: DraftResult;
  @Input() hearing: HearingDetail;
  @Input() invalidResultLines: ResolvedDraftResultLine[];
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() copyResults = new EventEmitter<CopyDraftResultsTarget[]>();
}
