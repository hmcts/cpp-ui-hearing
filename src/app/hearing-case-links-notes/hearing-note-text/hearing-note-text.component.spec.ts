import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { HearingNoteTextComponent } from './hearing-note-text.component';
import { hearingMultidayCaseNotesMock } from '../../mock-data/test-mock-data';
import { By } from '@angular/platform-browser';
import { HearingCaseNotes } from '../../core';
import { provideRouter, Router, NavigationStart } from '@angular/router';

describe('HearingNoteTextComponent', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    });
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  it('should have the expected template', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture).toMatchSnapshot();
  });

  it('should display emit event when user click the button', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const textAreaElement: DebugElement = fixture.debugElement.query(By.css('textarea'));
    textAreaElement.nativeElement.value = 'test note hearing';
    textAreaElement.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

    expect(hostComponent.clickOnSave).toHaveBeenCalledWith('test note hearing');
    expect(fixture).toMatchSnapshot();
  });

  it('should save note on router NavigationStart when note has changed', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.debugElement.query(
      By.directive(HearingNoteTextComponent)
    ).componentInstance;
    component.newNote = 'changed note';
    component.originalNote = 'original note';

    jest.spyOn(component.onClickSave, 'emit');

    const router = TestBed.inject(Router);
    const navigationStartEvent = new NavigationStart(1, '/new-url');
    (router.events as any).next(navigationStartEvent);

    expect(component.onClickSave.emit).toHaveBeenCalledWith('changed note');
  });
});

@Component({
  template: `
    <hearing-note-text
      [multiHearing]="multiHearing"
      [sharedHearing]="sharedHearing"
      [selectedHearingDate]="selectedHearingDate"
      [notes]="notes"
      (onClickSave)="clickOnSave($event)"
    >
    </hearing-note-text>
  `,
  imports: [HearingNoteTextComponent]
})
class TestHostComponent {
  multiHearing = true;
  sharedHearing = false;
  selectedHearingDate = '2018-12-03';
  notes: HearingCaseNotes[] = hearingMultidayCaseNotesMock;
  clickOnSave = jest.fn();
}
