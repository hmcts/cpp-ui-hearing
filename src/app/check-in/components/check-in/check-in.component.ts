import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { ValidationError } from '@cpp/pdk';
import {
  CheckInAsProsecutor,
  HearingSummariesGroupedByCaseId,
  CourtCentre,
  CheckInPayload
} from '../../../core';
import { UserGroup, UserDetails } from '@cpp/users-groups';
import { FindCourtComponent } from '../find-court/find-court.component';

import { DefenceCheckInFormComponent } from '../defence-check-in-form/defence-check-in-form.component';

@Component({
  selector: 'check-in',
  templateUrl: './check-in.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FindCourtComponent, DefenceCheckInFormComponent]
})
export class CheckInComponent {
  @Input() appUrl: string;
  @Input() courtCentres: CourtCentre[];
  @Input() userGroups: UserGroup[];
  @Input() hearingSummariesGroupedByCaseId: HearingSummariesGroupedByCaseId[];
  @Input() loggedInUser: UserDetails;
  @Input() hasApiActivity: boolean;

  @Output() onCheckInHearing = new EventEmitter<CheckInPayload>();
  @Output() onSelectCourtCentre = new EventEmitter<CourtCentre>();
  @Output() onAddCheckinErrors = new EventEmitter<ValidationError[]>();
  @Output() onCheckInProsecution = new EventEmitter<CheckInAsProsecutor[]>();

  isDefenceUser(): boolean {
    const defenceUsers = ['defence users', 'advocates'];
    const userGroupName = this.userGroups.map(ug => ug.groupName.toLowerCase());
    return defenceUsers.some(user => userGroupName.includes(user));
  }

  addCheckinErrors(errors: ValidationError[]): void {
    this.onAddCheckinErrors.emit(errors);
  }

  checkInProsecution(checkInProsecutionPayload: CheckInAsProsecutor[]) {
    this.onCheckInProsecution.emit(checkInProsecutionPayload);
  }
}
