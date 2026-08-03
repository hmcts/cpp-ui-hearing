import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  generateId,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkFillColorDirective,
  PdkVisuallyHiddenDirective,
  PdkTypographyDirective
} from '@cpp/pdk';
import { AmendmentReason } from '../../core';
import { AmendmentService } from '../common/services/amendment.service';

@Component({
  selector: 'cpp-shareable-result-line-amendment-legacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      role="button"
      pdk-link
      [attr.aria-controls]="id + '_reason'"
      [attr.aria-expanded]="amendmentReasonExpanded"
      href="javascript:void(0)"
      (click)="amendmentReasonExpanded = !amendmentReasonExpanded"
      >{{ amendmentReasonExpanded ? 'Hide' : 'View' }} reason for change</a
    >
    <div
      [attr.id]="id + '_reason'"
      pdk-margin-vertical="2"
      pdk-padding="3"
      [pdk-fill-colour]="pending ? 'red' : 'mid-grey'"
      [pdk-visually-hidden]="!amendmentReasonExpanded"
    >
      <h5 pdk-typography="heading-small">Reason for change</h5>
      <p>{{ amendmentReason.reasonDescription }}</p>
      @if (!locked) {
      <a role="button" href="javascript:void(0)" pdk-link (click)="handleChangeAmendmentReason()"
        >Change<span pdk-visually-hidden> reason</span></a
      >
      }
    </div>
  `,
  imports: [
    PdkLinkDirective,
    PdkMarginDirective,
    PdkPaddingDirective,
    PdkFillColorDirective,
    PdkVisuallyHiddenDirective,
    PdkTypographyDirective
  ]
})
export class ShareableResultLineAmendmentLegacyComponent {
  @Input() amendmentReason: AmendmentReason;
  @Input() locked = false;
  @Input() pending = false;
  @Output() amendmentReasonChange = new EventEmitter<AmendmentReason>();

  constructor(private amendmentService: AmendmentService) {}

  amendmentReasonExpanded = false;
  id = generateId();

  handleChangeAmendmentReason = async () => {
    const amendmentReason = await this.amendmentService.requestAmendmentReason({
      initialValue: this.amendmentReason
    });

    if (amendmentReason && this.amendmentReason.id !== amendmentReason.id) {
      this.amendmentReasonChange.emit(amendmentReason);
    }
    this.amendmentReasonExpanded = false;
  };
}
