import { SimpleChange } from '@angular/core';
import { SessionTimesJudiciaryComponent } from './session-times-judiciary.component';
import { SessionTimesCourt } from '../../core';

describe('SessionTimesJudiciaryComponent', () => {
  let component: SessionTimesJudiciaryComponent;

  const sessionTimesCourt = {
    courtHouseId: 'court-house-id',
    courtRoomId: 'court-room-id',
    courtSessionDate: '2026-11-19'
  } as SessionTimesCourt;

  beforeEach(() => {
    component = new SessionTimesJudiciaryComponent();
    component.isSaveBtnEnabled = true;
  });

  describe('ngOnChanges', () => {
    it('should disable the save button when new session times are loaded', () => {
      component.ngOnChanges({
        sessionTimesCourt: new SimpleChange(null, sessionTimesCourt, false)
      });

      expect(component.isSaveBtnEnabled).toBe(false);
    });

    it('should disable the save button when session times are cleared by a new filter', () => {
      component.ngOnChanges({
        sessionTimesCourt: new SimpleChange(sessionTimesCourt, null, false)
      });

      expect(component.isSaveBtnEnabled).toBe(false);
    });

    it('should keep the save button enabled when only other inputs change', () => {
      component.ngOnChanges({
        courtOfficerOptions: new SimpleChange(null, {}, false)
      });

      expect(component.isSaveBtnEnabled).toBe(true);
    });
  });
});
