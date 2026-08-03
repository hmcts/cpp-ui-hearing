import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CaseAccessAlertComponent } from '../case-access-alert.component';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CaseAccessAlertService } from '../case-access-alert.service';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { REDIRECT_TOKEN } from '../../../bootstrap-app.config';
import { AppConfigService } from '../../config';
import { CaseAccessModalComponent } from '../case-access-modal.component';

@Component({
  selector: 'case-access-modal',
  template: ` Urns: {{ urns }} Show: {{ show }} `
})
class MockCaseAccessModalComponent {
  @Input() urns: string[];
  @Input() show: boolean;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onSubmit: EventEmitter<boolean> = new EventEmitter<boolean>();
}

@Component({
  selector: 'test-case-access-alert',
  template: `
    <case-access-alert
      [userId]="userId"
      [urns]="urns"
      [hearingIds]="hearingIds"
      [selectedHearingId]="selectedHearingId"
      [checkOneTime]="checkOneTime"
    ></case-access-alert>
  `,
  imports: [CaseAccessAlertComponent]
})
class TestCaseAccessAlertComponent {
  userId = 'userId';
  urns = ['URN1', 'URN2'];
  hearingIds = ['hearing1', 'hearing2'];
  selectedHearingId = 'selectedId';
  checkOneTime = true;
}

describe('CaseAccessAlertComponent', () => {
  let fixture: ComponentFixture<TestCaseAccessAlertComponent>;

  const shouldShowModal = jest.fn();
  const saveDecision = jest.fn();
  const redirect = jest.fn();
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestCaseAccessAlertComponent],
      providers: [
        MockStore,
        provideMockStore({ initialState: { router: { navigationId: 1 } } }),
        {
          provide: CaseAccessAlertService,
          useValue: {
            shouldShowModal,
            saveDecision
          }
        },
        {
          provide: AppConfigService,
          useValue: {
            cppHomeUrl: 'homeUrl'
          }
        },
        {
          provide: REDIRECT_TOKEN,
          useValue: redirect
        }
      ],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(CaseAccessAlertComponent, {
      remove: {
        imports: [CaseAccessModalComponent]
      },
      add: {
        imports: [MockCaseAccessModalComponent]
      }
    });

    fixture = TestBed.createComponent(TestCaseAccessAlertComponent);
  });

  it('should render the component', () => {
    shouldShowModal.mockReturnValueOnce(true);
    fixture.detectChanges();

    expect(shouldShowModal.mock.calls).toMatchSnapshot();
    expect(fixture).toMatchSnapshot();
  });

  it('should save decision', () => {
    shouldShowModal.mockReturnValueOnce(true);
    fixture.detectChanges();
    const modal = fixture.debugElement.query(
      By.directive(MockCaseAccessModalComponent)
    ).componentInstance;
    modal.onSubmit.emit(true);

    expect(saveDecision).toHaveBeenCalled();
    const component = fixture.debugElement.query(
      By.directive(CaseAccessAlertComponent)
    ).componentInstance;
    expect(component.hideModal).toBeTruthy();
  });

  it('should cancel modal and redirect back', () => {
    shouldShowModal.mockReturnValueOnce(true);
    fixture.detectChanges();
    const modal = fixture.debugElement.query(
      By.directive(MockCaseAccessModalComponent)
    ).componentInstance;
    modal.onCancel.emit();
    expect(redirect).toHaveBeenCalledWith('homeUrl');
  });
});
