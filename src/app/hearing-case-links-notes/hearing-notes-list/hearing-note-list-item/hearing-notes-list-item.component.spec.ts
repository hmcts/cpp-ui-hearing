import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { HearingNotesListItemComponent } from './hearing-notes-list-item.component';
import { By } from '@angular/platform-browser';
import { hearingMultidayCaseNotesMock } from '../../../mock-data/test-mock-data';
import { HearingCaseNotes } from '../../../core';
import { provideTranslateService } from '@ngx-translate/core';

describe('HearingNotesListItemComponent', () => {
  const mockPrintWindow = {
    document: {
      write: jest.fn(),
      close: jest.fn()
    },
    focus: jest.fn(),
    print: jest.fn(),
    close: jest.fn()
  };
  const windowMock: Window = <any>{
    open: jest.fn().mockReturnValue(mockPrintWindow)
  };
  let component: HearingNotesListItemComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  function toggleNote() {
    const note: DebugElement = fixture.debugElement.query(By.css('.note-row-more'));
    note.nativeElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();
  }

  function clickExportButton() {
    const btn: DebugElement = fixture.debugElement.query(By.css('.button'));
    btn.nativeElement.dispatchEvent(new Event('click'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), { provide: 'Window', useFactory: () => windowMock }],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;

    fixture.detectChanges();
  });

  it('should have the expected collapsed template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should be able to toggle note to open template', () => {
    expect(component.isCollapsed).toBe(true);

    toggleNote();

    expect(fixture).toMatchSnapshot();
  });

  it('should be able to print', () => {
    jest.spyOn(component, 'printNote');

    toggleNote();
    clickExportButton();

    expect(component.printNote).toHaveBeenCalled();
  });
});

@Component({
  template: ` <hearing-note-list-item [hearingCaseNote]="hearingNotes"> </hearing-note-list-item> `,
  imports: [HearingNotesListItemComponent]
})
class TestHostComponent {
  hearingNotes: HearingCaseNotes = hearingMultidayCaseNotesMock[0];
}
