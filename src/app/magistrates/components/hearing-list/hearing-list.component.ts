import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { RolePermission, CppUserHasPermissionDirective } from '@cpp/users-groups';
import {
  MagistratesHearing,
  MagistratesHearingSummary
} from '../../interfaces/magistrates-hearing.interface';
import {
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkBorderColorDirective,
  PdkTextColorDirective,
  PdkVisuallyHiddenDirective,
  PdkTable
} from '@cpp/pdk';
import { CourtLocationComponent } from '../court-location/court-location.component';
import { HearingRowComponent } from '../hearing-row/hearing-row.component';
import { ApplicationRowComponent } from '../application-row/application-row.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hearing-list.component.html',
  styleUrls: ['./hearing-list.component.scss'],
  imports: [
    PdkTable,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkPaddingDirective,
    CourtLocationComponent,
    PdkBorderColorDirective,
    PdkTextColorDirective,
    PdkVisuallyHiddenDirective,
    CppUserHasPermissionDirective,
    HearingRowComponent,
    ApplicationRowComponent,
    TranslatePipe
  ]
})
export class HearingListComponent {
  @Input() magistratesHearings: MagistratesHearing[];
  @Input() hearingDate: string;
  @Input() prosecutionCaseFileUrl: string;
  @Input() userHearingAccessPermission: RolePermission;
  @Input() viewHearingListPermission: RolePermission;

  constructor(@Inject('Window') private window: Window) {}

  navigateToCaseMaterials(summary: MagistratesHearingSummary) {
    const {
      id: hearingId,
      prosecutionCase: { id: caseId },
      defendant: { id: defendantId }
    } = summary;
    const url = `${this.prosecutionCaseFileUrl}?caseId=${caseId}&hearingId=${hearingId}&defendantId=${defendantId}`;
    this.window.open(url, '_blank');
  }

  navigateToApplicationMaterials(summary: MagistratesHearingSummary) {
    const { application: { applicationId = '', hearingId = '' } = {} } = summary;
    const url = `${this.prosecutionCaseFileUrl}?applicationId=${applicationId}&hearingId=${hearingId}`;
    this.window.open(url, '_blank');
  }

  changeUserHearingAccessPermission(target: string): RolePermission {
    this.userHearingAccessPermission = { ...this.userHearingAccessPermission, target };
    return this.userHearingAccessPermission;
  }
}
