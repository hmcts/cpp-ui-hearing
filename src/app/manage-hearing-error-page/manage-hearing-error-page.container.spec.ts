import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ManageHearingErrorPageContainer } from './manage-hearing-error-page.container';
import { DraftResultActions, ResultsState } from '../results/core/store';
import { ManageHearingPublicEventError } from './manage-hearing-error-page.interfaces';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

describe('ManageHearingErrorPageContainer', () => {
  let component: ManageHearingErrorPageContainer;
  let fixture: ComponentFixture<ManageHearingErrorPageContainer>;
  let store: MockStore<ResultsState>;
  let dispatchSpy: any;
  const initialState = {
    results: {
      manageHearingError: {} as ManageHearingPublicEventError,
    },
  } as ResultsState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ManageHearingErrorPageContainer],
      providers: [
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { hearingId: 'hearingId' },
            },
          },
        },
        provideMockStore({ initialState }),
      ],
    }).compileComponents();

    store = TestBed.inject(Store) as MockStore<ResultsState>;
    dispatchSpy = jest.spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(ManageHearingErrorPageContainer);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the container component', () => {
    expect(component).toBeTruthy();
  });

  it('should set hearingId from route params', () => {
    expect(component.hearingId).toBe('hearingId');
  });

  it('should select manageHearingError$ from the store', () => {
    component.manageHearingError$.subscribe((value) => {
      expect(value).toEqual({} as ManageHearingPublicEventError);
    });
  });

  it('should dispatch removeManageHearingError on ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(dispatchSpy).toHaveBeenCalledWith(DraftResultActions.removeManageHearingError());
  });
});
