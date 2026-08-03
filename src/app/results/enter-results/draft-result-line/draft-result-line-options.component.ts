import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AmendmentReason } from '../../../core';
import { getTargetId, isConditionalMandatoryDraftResultLine } from '../../core/helpers';
import { AmendmentService } from '../../common/services/amendment.service';
import {
  DraftResultRelation,
  DraftStatus,
  ExtendedResolvedDraftResultLine
} from '../../results.interfaces';
import { PdkLinkDirective, PdkVisuallyHiddenDirective } from '@cpp/pdk';
import { LinkGroupComponent } from '../../../shared/components/link-group.component';

@Component({
  selector: 'cpp-draft-result-line-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canAmend || canDelete || canChangeOriginalText) {
    <pdk-link-group>
      @if (canAmend) {
      <a
        data-test-id="amend-result-line"
        pdk-link
        href="javascript:void(0)"
        (click)="handleAmendResultLine()"
        >Amend<span pdk-visually-hidden> {{ resultLine.label }}</span></a
      >
      } @if (canChangeOriginalText) {
      <a
        data-test-id="change-result-line"
        pdk-link
        href="javascript:void(0)"
        (click)="showResultLineParser.emit()"
        >Change<span pdk-visually-hidden> {{ resultLine.label }}</span></a
      >
      } @if (canDelete) {
      <a
        data-test-id="delete-result-line"
        pdk-link
        href="javascript:void(0)"
        (click)="handleDestroyResultLine()"
        >Delete<span pdk-visually-hidden> {{ resultLine.label }}</span></a
      >
      }
    </pdk-link-group>
    }
  `,
  imports: [PdkLinkDirective, PdkVisuallyHiddenDirective, LinkGroupComponent]
})
export class DraftResultLineOptionsComponent {
  @Input() draftStatus: DraftStatus;
  @Input() resultLine: ExtendedResolvedDraftResultLine;
  @Input() ruleType: DraftResultRelation['ruleType'];
  @Output() amend = new EventEmitter<{
    amendmentReason: AmendmentReason;
    destroyResultLine?: boolean;
  }>();
  @Output() destroy = new EventEmitter();
  @Output() showResultLineParser = new EventEmitter();

  constructor(private amendmentService: AmendmentService) {}

  get canAmend(): boolean {
    return (
      this.draftStatus === 'SHARED' &&
      ((isConditionalMandatoryDraftResultLine(this.resultLine) && !this.resultLine.disabled) ||
        this.resultLine.promptChoices.length > 0)
    );
  }

  get canChangeOriginalText(): boolean {
    return this.draftStatus === 'DRAFT' && this.ruleType === 'standalone';
  }

  get canDelete(): boolean {
    return (
      this.draftStatus !== 'READONLY' &&
      this.ruleType !== 'mandatory' &&
      this.ruleType !== 'optional'
    );
  }

  handleAmendResultLine = async () => {
    const amendmentReason = await this.amendmentService.requestAmendmentReason({
      targetIds: [getTargetId(this.resultLine)]
    });

    if (amendmentReason) {
      this.amend.emit({ amendmentReason });
    }
  };

  handleDestroyResultLine = async () => {
    if (this.draftStatus === 'SHARED') {
      const amendmentReason = await this.amendmentService.requestAmendmentReason({
        targetIds: [getTargetId(this.resultLine)]
      });

      if (!amendmentReason) {
        return;
      }
      this.amend.emit({ amendmentReason, destroyResultLine: true });
      return;
    }
    this.destroy.emit();
  };
}
