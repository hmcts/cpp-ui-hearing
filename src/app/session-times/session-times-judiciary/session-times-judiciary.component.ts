import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import {
  CourtOfficerTypeaheadOptions,
  CourtSession,
  SessionTimesCourt,
  SessionTimesCourtForm,
  SessionTypeEnum,
  JudicialMember
} from '../../core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import {
  ValidationError,
  PdkFormComponent,
  PdkMarginDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import cleanDeep from 'clean-deep';
import { JudiciarySearchFilterSummaryComponent } from '../judiciary-search-filter-summary/judiciary-search-filter-summary.component';
import { JudiciaryFormComponent } from './components/judiciary-form/judiciary-form.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'session-times-judiciary-form',
  templateUrl: './session-times-judiciary.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkMarginDirective,
    PdkGridComponent,
    PdkGridDirective,
    JudiciarySearchFilterSummaryComponent,
    JudiciaryFormComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class SessionTimesJudiciaryComponent {
  @ViewChild('recordSessionTimesForm') recordSessionTimesForm: NgForm;
  @Input() sessionTimesCourt: SessionTimesCourt;
  @Input() selectedCourtCentre: string;
  @Input() selectedCourtRoom: string;
  @Input() sessionDate: string;
  @Input() courtOfficerOptions: CourtOfficerTypeaheadOptions;

  @Output() onCourtJudiciaryFormSubmit: EventEmitter<SessionTimesCourt> = new EventEmitter();
  @Output() onError = new EventEmitter<ValidationError[]>();

  sessionType = SessionTypeEnum;

  isSaveBtnEnabled = false;

  getTodayDate() {
    return new Date();
  }

  onPrepareSubmit(): SessionTimesCourt {
    const { am, pm } = cleanDeep(this.recordSessionTimesForm.value);
    const amCourtSession = this.toSession(am);
    const pmCourtSession = this.toSession(pm);

    if (!!amCourtSession || !!pmCourtSession) {
      return {
        courtHouseId: this.sessionTimesCourt.courtHouseId,
        courtRoomId: this.sessionTimesCourt.courtRoomId,
        courtSessionDate: this.sessionTimesCourt.courtSessionDate,
        ...(amCourtSession && { amCourtSession }),
        ...(pmCourtSession && { pmCourtSession })
      };
    }
    return null;
  }

  private toSession(form: SessionTimesCourtForm) {
    if (!form) {
      return null;
    }

    let session: CourtSession;

    session = this.addJudicialMemnberToSession(form.judge1, 0, form, session);
    session = this.addJudicialMemnberToSession(form.judge2, 1, form, session);
    session = this.addJudicialMemnberToSession(form.judge3, 2, form, session);

    session = this.addOtherJudiciariesToSession(form.otherJudiciaries, session);

    if (!!form.startTime) {
      session = {
        ...session,
        startTime: form.startTime
      };
    }
    if (!!form.endTime) {
      session = {
        ...session,
        endTime: form.endTime
      };
    }

    if (!!form.courtClerk) {
      session = {
        ...session,
        courtClerkId: form.courtClerk.id
      };
    }

    if (!!form.courtAssociate) {
      session = {
        ...session,
        courtAssociateId: form.courtAssociate.id
      };
    }

    if (!!form.legalAdviser) {
      session = {
        ...session,
        legalAdviserId: form.legalAdviser.id
      };
    }

    return session;
  }

  onSubmit() {
    const sessionTimes = this.onPrepareSubmit();
    if (sessionTimes) {
      this.onCourtJudiciaryFormSubmit.emit(sessionTimes);
    }
    this.isSaveBtnEnabled = false;
  }

  private addJudicialMemnberToSession(
    judicialMember: JudicialMember,
    judicialMemberIndex: number,
    form: SessionTimesCourtForm,
    session: CourtSession
  ): CourtSession {
    if (!!judicialMember) {
      return {
        ...session,
        judiciaries: [
          ...(session && session.judiciaries ? session.judiciaries : []),
          {
            judiciaryId: judicialMember.id,
            benchChairman: form.chairman === judicialMemberIndex
          }
        ]
      };
    }
    return session;
  }

  private addOtherJudiciariesToSession(
    otherJudiciaries: object,
    session: CourtSession
  ): CourtSession {
    if (!!otherJudiciaries) {
      const nameOnlyJudiciaries = Object.values(otherJudiciaries).map(name => ({
        judiciaryName: name,
        benchChairman: false
      }));
      return {
        ...session,
        judiciaries: [
          ...(session && session.judiciaries ? session.judiciaries : []),
          ...nameOnlyJudiciaries
        ]
      };
    }
    return session;
  }
}
