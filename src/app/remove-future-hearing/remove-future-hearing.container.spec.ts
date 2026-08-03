import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RemoveFutureHearingContainer } from './remove-future-hearing.container';
import {
  getFutureHearings,
  getHearingId,
  HearingSummary,
  RemoveFutureHearing,
  TrialType
} from '../core';
import { mockSummary } from '../mock-data/test-mock-data';
import { RemoveFutureHearingFormComponent } from './components/remove-future-hearing-form/remove-future-hearing-form.component';
import { ResultedHearingsComponent } from './components/resulted-hearings/resulted-hearings.component';

@Component({
  selector: 'remove-future-hearing-form',
  template: `
    <pre>{{ hearingSummaries | json }}</pre>
    <pre>{{ hearingId | json }}</pre>
  `,
  imports: [JsonPipe]
})
class MockFutureHearingForm {
  @Input() hearingSummaries!: HearingSummary[];
  @Input() hearingId!: string;
  @Input() reasonsForVacating!: TrialType[];
  @Input() isReadOnly: boolean = false;
  @Output() remove = new EventEmitter<{ removeFutureHearings: RemoveFutureHearing[] }>();
  @Output() readonlyMode = new EventEmitter<boolean>();
}

@Component({
  selector: 'resulted-hearings',
  template: ` <pre>{{ hearingSummaries | json }}</pre> `,
  imports: [JsonPipe]
})
class MockResultedHearings {
  @Input() hearingSummaries!: HearingSummary[];
  @Input() isReadOnly: boolean = false;
}

describe('Remove future hearing container', () => {
  let fixture: ComponentFixture<RemoveFutureHearingContainer>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RemoveFutureHearingContainer],
      providers: [MockStore, provideMockStore({ initialState: {} })],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(RemoveFutureHearingContainer, {
        remove: {
          imports: [RemoveFutureHearingFormComponent, ResultedHearingsComponent]
        },
        add: {
          imports: [MockFutureHearingForm, MockResultedHearings]
        }
      })
      .compileComponents();

    getFutureHearings.setResult([mockSummary]);
    getHearingId.setResult('hearing-id');
    fixture = TestBed.createComponent(RemoveFutureHearingContainer);
  }));

  it('should display hearings', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});
