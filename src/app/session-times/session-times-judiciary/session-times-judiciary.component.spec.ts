import { NgForm } from '@angular/forms';
import { JudicialMember } from '../../core';
import { SessionTimesJudiciaryComponent } from './session-times-judiciary.component';

describe('SessionTimesJudiciaryComponent', () => {
  it('submits every dynamically added judiciary with the selected chairperson', () => {
    const component = new SessionTimesJudiciaryComponent();
    const judiciaries = Array.from({ length: 4 }).reduce<Record<string, JudicialMember>>(
      (members, _, index) => ({
        ...members,
        [index]: {
          id: `00000000-0000-0000-0000-00000000000${index}`,
          forenames: `Person ${index}`,
          surname: 'Example'
        } as JudicialMember
      }),
      {}
    );

    component.sessionTimesCourt = {
      courtHouseId: '10000000-0000-0000-0000-000000000000',
      courtRoomId: '20000000-0000-0000-0000-000000000000',
      courtSessionDate: '2026-08-27'
    };
    component.recordSessionTimesForm = {
      value: {
        am: {
          judiciaries,
          chairman: 3
        }
      }
    } as unknown as NgForm;

    const result = component.onPrepareSubmit();

    expect(result.amCourtSession.judiciaries).toHaveLength(4);
    expect(result.amCourtSession.judiciaries[3]).toEqual({
      judiciaryId: '00000000-0000-0000-0000-000000000003',
      benchChairman: true
    });
    expect(result.amCourtSession.judiciaries.slice(0, 3)).toEqual(
      expect.arrayContaining([expect.objectContaining({ benchChairman: false })])
    );
  });

  it('continues to submit existing name-only judiciary records', () => {
    const component = new SessionTimesJudiciaryComponent();
    component.sessionTimesCourt = {
      courtHouseId: '10000000-0000-0000-0000-000000000000',
      courtRoomId: '20000000-0000-0000-0000-000000000000',
      courtSessionDate: '2026-08-27'
    };
    component.recordSessionTimesForm = {
      value: {
        am: {
          otherJudiciaries: { 0: 'Legacy judiciary' }
        }
      }
    } as unknown as NgForm;

    expect(component.onPrepareSubmit().amCourtSession.judiciaries).toEqual([
      { judiciaryName: 'Legacy judiciary', benchChairman: false }
    ]);
  });
});
