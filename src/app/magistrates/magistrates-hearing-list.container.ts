import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppState } from '../core';
import { Store } from '@ngrx/store';
import { getMagistratesHearings, getHearingDate } from './store/magistrates-hearing.selector';
import { MagistratesHearing } from './interfaces/magistrates-hearing.interface';
import { AppConfigService } from '../config';
import {
  EXPECTED_HEARING_USER_PERMISSIONS,
  HearingUserPermissions
} from '../config/user-permissions';
import { HearingListComponent } from './components/hearing-list/hearing-list.component';
import { AsyncPipe } from '@angular/common';

const PROSECUTION_CASE_FILE_CASE_MATERIALS = 'prosecution-casefile/case-materials';

@Component({
  selector: 'magistrates-hearing-list',
  template: `
    <hearing-list
      [magistratesHearings]="magistratesHearings$ | async"
      [hearingDate]="hearingDate$ | async"
      [prosecutionCaseFileUrl]="prosecutionCaseFileUrl"
      [userHearingAccessPermission]="expectedPermissions?.hearingAccess"
      [viewHearingListPermission]="expectedPermissions?.viewHearingList"
    >
    </hearing-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HearingListComponent, AsyncPipe]
})
export class MagistratesHearingListContainer {
  magistratesHearings$: Observable<MagistratesHearing[]>;
  hearingDate$: Observable<string>;
  prosecutionCaseFileUrl: string;

  constructor(
    @Inject(EXPECTED_HEARING_USER_PERMISSIONS) public expectedPermissions: HearingUserPermissions,
    private store: Store<AppState>,
    appConfigService: AppConfigService
  ) {
    this.magistratesHearings$ = this.store.select(getMagistratesHearings);
    this.hearingDate$ = this.store.select(getHearingDate);
    this.prosecutionCaseFileUrl = `${appConfigService.getBaseUrl()}/${PROSECUTION_CASE_FILE_CASE_MATERIALS}`;
  }
}
