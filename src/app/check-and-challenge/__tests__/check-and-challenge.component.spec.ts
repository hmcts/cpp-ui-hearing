import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideTranslateService } from '@ngx-translate/core';
import { reducers } from '../../core';
import { CheckAndChallengeComponent } from '../check-and-challenge.component';

describe('Check and challenge component', () => {
  let fixture: ComponentFixture<CheckAndChallengeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CheckAndChallengeComponent],
      providers: [
        provideTranslateService(),
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([])
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(CheckAndChallengeComponent);
  });

  it('should render the component', () => {
    expect(fixture).toMatchSnapshot();
  });
});
