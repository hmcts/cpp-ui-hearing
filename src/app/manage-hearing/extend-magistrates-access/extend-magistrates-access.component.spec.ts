import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { ExtendMagistratesAccessComponent } from './extend-magistrates-access.component';
import * as StoreFunctions from '@ngrx/store';
import { AppState } from '../../core/reducers';
import { ExtendMagistratesAccess } from '../../core/actions';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';

xdescribe('ExtendMagistratesAccessComponent', () => {
  let component: ExtendMagistratesAccessComponent;
  let fixture: ComponentFixture<ExtendMagistratesAccessComponent>;
  const store: StoreFunctions.Store<AppState> = null;
  let state: AppState;
  let dispatchSpy: any;
  let pipeableSelectSpy;
  let actions$: Observable<Actions>;

  beforeEach(waitForAsync(() => {
    state = {
      hearings: {
        current: {}
      }
    } as AppState;

    dispatchSpy = jest.fn();
    pipeableSelectSpy = jest.fn().mockImplementation(selectFunc => {
      return selectFunc.call(store, of(state));
    });

    TestBed.configureTestingModule({
      imports: [ExtendMagistratesAccessComponent],
      providers: [
        provideTranslateService(),
        provideMockActions(() => actions$),
        {
          provide: StoreFunctions.Store,
          useValue: { pipe: pipeableSelectSpy, dispatch: dispatchSpy }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
    actions$ = TestBed.inject(Actions);
    fixture = TestBed.createComponent(ExtendMagistratesAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture).toMatchSnapshot();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should dispatch the ExtendMagistratesAccess access to add a permission', () => {
    component.extendMagistrateAccess(true);
    expect(dispatchSpy).toHaveBeenCalledWith(
      new ExtendMagistratesAccess({
        object: 'HearingAccess',
        active: true
      })
    );
  });

  it('should dispatch the ExtendMagistratesAccess access to cancel a permission', () => {
    component.extendMagistrateAccess(false);
    expect(dispatchSpy).toHaveBeenCalledWith(
      new ExtendMagistratesAccess({
        object: 'HearingAccess',
        active: false
      })
    );
  });
});
