import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { ConfirmStartEventComponent } from './confirm-start-event.component';

describe('ConfirmStartEventComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: ConfirmStartEventComponent;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should emit cancel event when cancel is called', () => {
    jest.spyOn(component.cancelStartEvent, 'emit');
    component.cancel();
    expect(component.cancelStartEvent.emit).toHaveBeenCalledTimes(1);
  });

  it('should emit confirmation event when confirmed is called', () => {
    jest.spyOn(component.confirmStartEvent, 'emit');
    component.confirm();
    expect(component.confirmStartEvent.emit).toHaveBeenCalledTimes(1);
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    @if (showStartEventLogConfirmation) {
    <confirm-start-event
      (cancelStartEvent)="startEventConfirmationCancelled()"
      (confirmStartEvent)="startEventConfirmed()"
    >
    </confirm-start-event>
    }
  `,
  imports: [ConfirmStartEventComponent]
})
class TestHostComponent {
  showStartEventLogConfirmation = true;

  startEventConfirmationCancelled() {}
  startEventConfirmed() {}
}
