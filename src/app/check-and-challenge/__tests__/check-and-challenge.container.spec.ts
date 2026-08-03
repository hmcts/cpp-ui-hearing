import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppState, reducers } from '../../core';
import { CheckAndChallengeContainer } from '../check-and-challenge.container';

describe('Check and challenge container', () => {
  let fixture: ComponentFixture<CheckAndChallengeContainer>;
  let store: Store<AppState>;
  window.scrollTo = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CheckAndChallengeContainer],
      providers: [
        provideTranslateService(),
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({
              type: 'CAAG',
              target: 'case-id'
            })
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(CheckAndChallengeContainer);
    jest.spyOn(store, 'dispatch');
  });

  it('should render the container', () => {
    expect(fixture).toMatchSnapshot();
  });
});
