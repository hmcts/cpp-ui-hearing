import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

import { IntermediaryAttendeesComponent } from './intermediary-attendees.component';
import { mockIntermediaryCounsels } from '../../../../mock-data/test-mock-data';
import { AttendantType, IntermediaryType } from '../../../../core';

describe('IntermediaryAttendeesComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should clear interpreters and intermediaries when the bound counsels change to empty', () => {
    const host = fixture.componentInstance;
    const child = fixture.debugElement.query(By.directive(IntermediaryAttendeesComponent))
      .componentInstance as IntermediaryAttendeesComponent;

    host.intermediariesCounsel = [
      {
        id: 'interpreter-1',
        firstName: '',
        lastName: '',
        attendanceDays: [],
        role: IntermediaryType.INTERPRETER,
        attendant: { defendantId: '', name: '', attendantType: AttendantType.DEFENDANTS }
      },
      {
        id: 'intermediary-1',
        firstName: '',
        lastName: '',
        attendanceDays: [],
        role: IntermediaryType.INTERMEDIARY,
        attendant: { defendantId: '', name: '', attendantType: AttendantType.DEFENDANTS }
      }
    ];
    fixture.detectChanges();

    expect(child.interpreterAttendees.length).toBe(1);
    expect(child.intermediaryAttendees.length).toBe(1);
    expect(child.showInterpreters).toBe(true);
    expect(child.showIntermediaries).toBe(true);

    host.intermediariesCounsel = [];
    fixture.detectChanges();

    expect(child.interpreterAttendees).toEqual([]);
    expect(child.intermediaryAttendees).toEqual([]);
    expect(child.showInterpreters).toBe(false);
    expect(child.showIntermediaries).toBe(false);
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <intermediary-attendees [intermediariesCounsel]="intermediariesCounsel">
    </intermediary-attendees>
  `,
  imports: [IntermediaryAttendeesComponent]
})
class TestHostComponent {
  intermediariesCounsel = mockIntermediaryCounsels;
}
