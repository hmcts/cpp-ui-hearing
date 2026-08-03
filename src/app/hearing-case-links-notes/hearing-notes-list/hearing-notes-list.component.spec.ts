import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';

import { HearingNotesListComponent } from './hearing-notes-list.component';
import { hearingMultidayCaseNotesMock } from '../../mock-data/test-mock-data';
import { HearingCaseNotes } from '../../core';

@Component({
  selector: 'test-host',
  template: `
    <hearing-note-list
      [notes]="hearingNotes"
      [selectedHearingDate]="selectedHearingDate"
      [multiHearing]="multiHearing"
      [sharedHearing]="sharedHearing"
    ></hearing-note-list>
  `,
  imports: [HearingNotesListComponent]
})
class TestHostComponent {
  hearingNotes: HearingCaseNotes[];
  selectedHearingDate: string;
  multiHearing = true;
  sharedHearing = true;
}

describe('HearingNotesListComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  const windowMock: Window = <any>{};
  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), { provide: 'Window', useFactory: () => windowMock }],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });
  it('should display notes of previous hearing days for multi day hearing', waitForAsync(() => {
    component.selectedHearingDate = '2018-12-05';
    component.hearingNotes = hearingMultidayCaseNotesMock;
    fixture.detectChanges();
    const noteList = fixture.debugElement.children[0].componentInstance;
    expect(noteList.displayNotes.length === 3).toEqual(true);
  }));

  it('should display latest version of the notes for normal hearing if hearing is shared', () => {
    component.selectedHearingDate = '2018-12-04';
    component.multiHearing = false;
    component.hearingNotes = hearingMultidayCaseNotesMock;
    fixture.detectChanges();
    const noteList = fixture.debugElement.children[0].componentInstance;
    expect(noteList.displayNotes.length === 1).toBe(true);
  });

  it('should display notes from previous days for multi day hearing when not shared', () => {
    component.selectedHearingDate = '2018-12-05';
    component.multiHearing = true;
    component.sharedHearing = false;
    component.hearingNotes = hearingMultidayCaseNotesMock;
    fixture.detectChanges();
    const noteList = fixture.debugElement.children[0].componentInstance;
    expect(noteList.displayNotes.length).toBeGreaterThan(0);
    noteList.displayNotes.forEach((note: HearingCaseNotes) => {
      expect(new Date(note.noteDateTime).getTime()).toBeLessThan(
        new Date(component.selectedHearingDate).getTime()
      );
    });
  });
});
