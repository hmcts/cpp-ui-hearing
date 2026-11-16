import { SimpleChange } from '@angular/core';
import { JudiciaryFormComponent } from './judiciary-form.component';
import { CourtSession } from '../../../../core';
import { mockJudicialMembers } from '../../../../mock-data/test-mock-data';

describe('JudiciaryFormComponent', () => {
  let component: JudiciaryFormComponent;

  const setCourtSession = (courtSession: CourtSession) => {
    component.courtSession = courtSession;
    component.ngOnChanges({ courtSession: new SimpleChange(undefined, courtSession, true) });
  };

  beforeEach(() => {
    component = new JudiciaryFormComponent();
  });

  it('should fill the judiciary fields from the top most field', () => {
    setCourtSession({
      judiciaries: [
        { judiciaryId: mockJudicialMembers[0].id, judicialMember: mockJudicialMembers[0] },
        { judiciaryId: mockJudicialMembers[1].id, judicialMember: mockJudicialMembers[1] }
      ]
    });

    expect(component.getJudiciaryWithId(0)).toEqual(mockJudicialMembers[0]);
    expect(component.getJudiciaryWithId(1)).toEqual(mockJudicialMembers[1]);
    expect(component.getJudiciaryWithId(2)).toBeNull();
    expect(component.isChairmanDisabled(0)).toBe(false);
    expect(component.isChairmanDisabled(1)).toBe(false);
    expect(component.isChairmanDisabled(2)).toBe(true);
  });

  it('should not select a chairperson when none is provided', () => {
    setCourtSession({
      judiciaries: [
        { judiciaryId: mockJudicialMembers[0].id, judicialMember: mockJudicialMembers[0] }
      ]
    });

    expect(component.selectedAmJudiciaryIndex).toBeUndefined();
  });

  it('should select the saved chairperson', () => {
    setCourtSession({
      judiciaries: [
        { judiciaryId: mockJudicialMembers[0].id, judicialMember: mockJudicialMembers[0] },
        {
          judiciaryId: mockJudicialMembers[1].id,
          judicialMember: mockJudicialMembers[1],
          benchChairman: true
        }
      ]
    });

    expect(component.selectedAmJudiciaryIndex).toBe(1);
  });

  it('should skip a judiciary that is not found in reference data', () => {
    setCourtSession({
      judiciaries: [
        { judiciaryId: 'unknown-id', judicialMember: undefined },
        { judiciaryId: mockJudicialMembers[1].id, judicialMember: mockJudicialMembers[1] }
      ]
    });

    expect(component.getJudiciaryWithId(0)).toEqual(mockJudicialMembers[1]);
    expect(component.getJudiciaryWithId(1)).toBeNull();
    expect(component.isChairmanDisabled(1)).toBe(true);
  });

  it('should show name only judiciaries as other judiciaries', () => {
    setCourtSession({
      judiciaries: [{ judiciaryName: 'Joe Smith', benchChairman: false }]
    });

    expect(component.otherJudiciaries).toEqual(['Joe Smith']);
    expect(component.getJudiciaryWithId(0)).toBeNull();
  });
});
