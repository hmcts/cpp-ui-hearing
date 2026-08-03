import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { EventNoteComponent } from './event-note.component';

describe('EventNoteComponent', () => {
  let component: EventNoteComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show event note', () => {
    fixture.detectChanges();

    const eventNote = fixture.debugElement.query(By.css('[data-test-id="event-note"]'));

    expect(eventNote).toBeTruthy();
  });
});

@Component({
  template: `
    <event-note
      [eventNoteCharacterLimit]="eventNoteCharacterLimit"
      [eventNote]="eventNote"
      (eventNoteChange)="onNoteChange($event)"
    ></event-note>
  `,
  imports: [EventNoteComponent]
})
class TestHostComponent {
  eventNoteCharacterLimit = 3000;
  eventNote: string;

  onNoteChange(note: string) {}
}
