import { SimpleChange } from '@angular/core';
import { CourtSession, JudicialMember } from '../../../../core';
import { JudiciaryFormComponent } from './judiciary-form.component';

describe('JudiciaryFormComponent', () => {
  let component: JudiciaryFormComponent;

  beforeEach(() => {
    component = new JudiciaryFormComponent();
  });

  it('adds another searchable judiciary field and chairperson option', () => {
    component.onAddAnotherJudiciary();

    expect(component.judiciaryFields).toHaveLength(4);
    expect(component.selectedJudiciaries[3]).toEqual({
      index: 3,
      isEnabled: false,
      value: null
    });
  });

  it('restores more than three structured judiciaries and their chairperson', () => {
    const judiciaries = Array.from({ length: 4 }, (_, index) => ({
      judiciaryId: `00000000-0000-0000-0000-00000000000${index}`,
      benchChairman: index === 3,
      judicialMember: {
        id: `00000000-0000-0000-0000-00000000000${index}`,
        forenames: `Person ${index}`,
        surname: 'Example'
      } as JudicialMember
    }));
    const courtSession = { judiciaries } as CourtSession;

    component.courtSession = courtSession;
    component.ngOnChanges({
      courtSession: new SimpleChange(null, courtSession, true)
    });

    expect(component.judiciaryFields).toHaveLength(4);
    expect(component.selectedJudiciaries.every(judiciary => judiciary.isEnabled)).toBe(true);
    expect(component.selectedAmJudiciaryIndex).toBe(3);
  });
});
