import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SuggestedEventsComponent } from './suggested-events.component';

let currentLoggedEvents = [] as any[];

describe('SuggestedEventsComponent', () => {
  let component: SuggestedEventsComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  function clickStartHearingButton() {
    fixture.debugElement.query(By.css('[data-role="suggested-event-start"]')).nativeElement.click();
  }

  function clickResumeHearingButton() {
    fixture.debugElement
      .query(By.css('[data-role="suggested-event-resume"]'))
      .nativeElement.click();
  }

  function clickEndHearingButton() {
    fixture.debugElement.query(By.css('[data-role="suggested-event-end"]')).nativeElement.click();
  }

  function clickPauseHearingButton() {
    fixture.debugElement.query(By.css('[data-role="suggested-event-pause"]')).nativeElement.click();
  }

  function clickChangeHearingTypeButton() {
    fixture.debugElement
      .query(By.css('[data-role="suggested-event-change-type"]'))
      .nativeElement.click();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  });

  describe('when jurisdiction type is crown', () => {
    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      component = fixture.debugElement.children[0].componentInstance;
    }));

    describe('when there are no logged events', () => {
      it('should render the template with the values expected', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should fire an event when clicking the start hearing button', () => {
        clickStartHearingButton();

        expect(fixture.componentInstance.eventSelected).toHaveBeenCalledTimes(1);
      });
    });

    describe('when there are logged events and hearing is stopped', () => {
      beforeEach(waitForAsync(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.debugElement.children[0].componentInstance;
        component.isHearingEventLogPaused = true;
        fixture.detectChanges();
      }));

      beforeAll(waitForAsync(() => {
        currentLoggedEvents = [{}];
      }));

      it('should render the template with the values expected', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should fire an event when clicking the resume hearing button', () => {
        clickResumeHearingButton();

        expect(fixture.componentInstance.eventSelected).toHaveBeenCalledTimes(1);
      });

      it('should fire an event when clicking the end hearing button', () => {
        clickEndHearingButton();

        expect(fixture.componentInstance.eventSelected).toHaveBeenCalledTimes(1);
      });
    });

    describe('when there are logged events and hearing is running', () => {
      beforeEach(waitForAsync(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.debugElement.children[0].componentInstance;
        component.isHearingEventLogPaused = false;
        fixture.detectChanges();
      }));

      beforeAll(waitForAsync(() => {
        currentLoggedEvents = [{}];
      }));

      it('should render the template with the values expected', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should fire an event when clicking the pause hearing button', () => {
        clickPauseHearingButton();

        expect(fixture.componentInstance.eventSelected).toHaveBeenCalledTimes(1);
      });

      it('should fire an event when clicking the end hearing button', () => {
        clickEndHearingButton();

        expect(fixture.componentInstance.eventSelected).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when jurisdiction type is magistrates', () => {
    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.debugElement.children[0].componentInstance;
      component.jurisdictionType = 'MAGISTRATES';
      component.showChangeTypeLink = true;
      fixture.detectChanges();
    }));

    describe('when there are logged events', () => {
      beforeAll(waitForAsync(() => {
        currentLoggedEvents = [{}];
      }));

      it('should render "change hearing type link when jurisdiction type is magistrates', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should fire an event when clicking the change hearing type button', () => {
        clickChangeHearingTypeButton();

        expect(fixture.componentInstance.changeHearingType).toHaveBeenCalledTimes(1);
      });
    });
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <suggested-events
      [loggedEvents]="loggedEvents"
      (eventSelected)="eventSelected($event)"
      (changeHearingType)="changeHearingType($event)"
    >
    </suggested-events>
  `,
  imports: [SuggestedEventsComponent]
})
class TestHostComponent {
  loggedEvents = currentLoggedEvents;

  eventSelected = jest.fn();
  changeHearingType = jest.fn();
}
