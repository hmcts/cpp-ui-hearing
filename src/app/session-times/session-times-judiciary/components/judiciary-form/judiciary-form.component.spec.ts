import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, NgControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import {
  CourtOfficerTypeaheadOptions,
  CourtSession,
  JudicialMember,
  SessionTypeEnum
} from '../../../../core';
import { JudiciaryFormComponent } from './judiciary-form.component';
import { ReferenceDataService } from '../../../../core/services';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { of } from 'rxjs';

const judicialMember = {
  id: 'judicial-id-10',
  titlePrefix: 'Mr',
  surname: 'Smith',
  forenames: 'John',
  judiciaryType: 'Recorder'
} as JudicialMember;

describe('JudiciaryFormComponent', () => {
  let component: JudiciaryFormComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let getJudicialMembersByNamePattern = jest.fn(() => of([]));

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, TranslateModule.forRoot()],
      providers: [
        provideCppCoreHttpServices(),
        {
          provide: ReferenceDataService,
          useValue: { getJudicialMembersByNamePattern }
        },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn()
          }
        },
        NgControl
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.query(By.directive(JudiciaryFormComponent)).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add another judiciary and create a matching radio entry', () => {
    component.onAddAnotherJudiciary();

    expect(component.otherJudiciaries.length).toBe(1);
    expect(component.otherJudiciaries[0].value).toBeNull();
    expect(component.selectedJudiciaries.length).toBe(4);
    expect(component.selectedJudiciaries[3].isEnabled).toBe(false);
  });

  it('should set the other judiciary value and enable the matching radio', () => {
    component.onAddAnotherJudiciary();

    component.onSetOtherJudiciary(judicialMember, 0);

    expect(component.otherJudiciaries[0].value).toBe(judicialMember);
    expect(component.otherJudiciaries[0].isEnabled).toBe(true);
    expect(component.selectedJudiciaries[3].value).toBe(judicialMember.id);
    expect(component.selectedJudiciaries[3].isEnabled).toBe(true);
  });

  it('should disable the other judiciary radio when selection is cleared', () => {
    component.onAddAnotherJudiciary();
    component.onSetOtherJudiciary(judicialMember, 0);

    component.onSetOtherJudiciary(null, 0);

    expect(component.selectedJudiciaries[3].isEnabled).toBe(false);
  });

  it('should emit enableSave when an other judiciary is selected', () => {
    component.onAddAnotherJudiciary();
    const emitSpy = jest.spyOn(component.onEnableSave, 'emit');

    component.onSetOtherJudiciary(judicialMember, 0);

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should initialise extra judiciaries from a court session with more than 3 judiciaries', () => {
    const extraMember = { ...judicialMember, id: 'judicial-id-11' } as JudicialMember;
    fixture.componentRef.setInput('courtSession', {
      judiciaries: [
        { judiciaryId: '1', judicialMember: judicialMember, benchChairman: false },
        {
          judiciaryId: '2',
          judicialMember: { ...judicialMember, id: '2' } as JudicialMember,
          benchChairman: false
        },
        {
          judiciaryId: '3',
          judicialMember: { ...judicialMember, id: '3' } as JudicialMember,
          benchChairman: false
        },
        { judiciaryId: '11', judicialMember: extraMember, benchChairman: false }
      ]
    } as CourtSession);
    fixture.detectChanges();

    expect(component.otherJudiciaries.length).toBe(1);
    expect(component.otherJudiciaries[0].value).toBe(extraMember);
    expect(component.selectedJudiciaries.length).toBe(4);
    expect(component.selectedJudiciaries[3].isEnabled).toBe(true);
  });
});

@Component({
  template: `
    <form>
      <judiciary-form
        [courtSession]="courtSession"
        [sessionType]="sessionType"
        [courtOfficerOptions]="courtOfficerOptions"
      ></judiciary-form>
    </form>
  `,
  imports: [JudiciaryFormComponent, FormsModule]
})
class TestHostComponent {
  @Input() courtSession: CourtSession = {} as CourtSession;
  @Input() sessionType = SessionTypeEnum.AM;
  @Input() courtOfficerOptions: CourtOfficerTypeaheadOptions = {
    courtClerks: [],
    courtAssociate: [],
    legalAdvisers: []
  };
}
