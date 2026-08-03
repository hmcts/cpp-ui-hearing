import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { ExtendMagistratesAccess } from '../../core/actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../core/reducers';
import {
  EXPECTED_HEARING_USER_PERMISSIONS,
  HearingUserPermissions
} from '../../config/user-permissions';
import { CppUserHasPermissionDirective } from '@cpp/users-groups';
import {
  PdkButtonComponent,
  PdkButtonDirective,
  PdkMarginDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'extend-magistrates-access',
  template: `
    @if (isLegalAdviser) {
    <ng-container *cppUserHasPermission="expectedPermissions.userGrantAccess">
      <button
        pdk-button="secondary"
        data-test-id="extend-magistrate-access"
        pdk-margin-bottom="2"
        (click)="extendMagistrateAccess(true)"
        *cppUserHasPermission="
          expectedPermissions.hearingAccess;
          required: false;
          target: hearingId
        "
      >
        {{ 'MANAGE_HEARING.EXTEND_MAGISTRATES_ACCESS' | translate }}
      </button>
      <ng-container *cppUserHasPermission="expectedPermissions.hearingAccess; target: hearingId">
        <div class="extend-magistrate-access-block">
          <pdk-badge data-test-id="extend-magistrate-access" pdk-margin-bottom="2">
            {{ 'MANAGE_HEARING.MAGISTRATES_ACCESS_EXTENDED' | translate }}
          </pdk-badge>
          <a
            pdk-link
            class="cancel-link"
            pdk-margin-top="2"
            href="javascript:void(0);"
            (click)="extendMagistrateAccess(false)"
          >
            {{ 'MANAGE_HEARING.CANCEL_MAGISTRATE_ACCESS_EXTENSION' | translate }}
          </a>
        </div>
      </ng-container>
    </ng-container>
    }
  `,
  styleUrls: ['./extend-magistrates-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CppUserHasPermissionDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkMarginDirective,
    PdkLinkDirective,
    TranslatePipe
  ]
})
export class ExtendMagistratesAccessComponent {
  @Input() hearingId: string;
  @Input() hearingAccessPermissionId: string;
  @Input() isLegalAdviser: boolean;

  constructor(
    private store: Store<AppState>,
    @Inject(EXPECTED_HEARING_USER_PERMISSIONS) public expectedPermissions: HearingUserPermissions
  ) {}

  extendMagistrateAccess(active: boolean): void {
    if (active) {
      this.store.dispatch(
        new ExtendMagistratesAccess({
          target: this.hearingId,
          object: 'HearingAccess',
          active: active
        })
      );
    } else {
      this.store.dispatch(
        new ExtendMagistratesAccess({
          target: this.hearingId,
          object: 'HearingAccess',
          active: active,
          id: this.hearingAccessPermissionId
        })
      );
    }
  }
}
