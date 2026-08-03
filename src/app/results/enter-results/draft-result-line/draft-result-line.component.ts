import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ValidationError } from '@cpp/pdk';
import { AmendmentReason } from '../../../core';
import { isResolvedDraftResultLine } from '../../core/helpers';
import {
  DraftStatus,
  DraftResultRelation,
  ResolvedDraftResultLine,
  UnresolvedDraftResultLine,
  PromptEntry
} from '../../results.interfaces';
import {
  AddChildValue,
  ResolvedDraftResultLineComponent
} from './resolved-draft-result-line.component';
import { DraftResultLineParserComponent } from './draft-result-line-parser.component';
import { UnresolvedDraftResultLineComponent } from './unresolved-draft-result-line.component';

@Component({
  selector: 'cpp-draft-result-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showResultLineParser) {
    <cpp-draft-result-line-parser
      [originalText]="resultLine.originalText"
      (originalTextChange)="handleOriginalTextChange($event)"
      (cancel)="showResultLineParser = false"
    >
    </cpp-draft-result-line-parser>
    }
    <div [hidden]="showResultLineParser">
      @if (isResolved) {
      <cpp-resolved-draft-result-line
        [belongsToOptionalBranch]="belongsToOptionalBranch"
        [draftStatus]="draftStatus"
        [groupedWithResultDefinitionIds]="groupedWithResultDefinitionIds"
        [resultLine]="resultLine"
        [ruleType]="ruleType"
        [isApplication]="isApplication"
        [hasHmctsOrganisation]="hasHmctsOrganisation"
        [prosecutorToBeNotified]="prosecutorToBeNotified"
        [isExParteCase]="isExParteCase"
        [isCourtApplicationFinalised]="isCourtApplicationFinalised"
        [isAmendmentAllowed]="isAmendmentAllowed"
        [amendApplicationPermission]="amendApplicationPermission"
        [caseStatus]="caseStatus"
        [canAllocateRelatedHearing]="canAllocateRelatedHearing"
        (addChild)="addChild.emit($event)"
        (amend)="amend.emit($event)"
        (conditionalMandatoryValue)="conditionalMandatoryValue.emit($event)"
        (destroy)="destroy.emit()"
        (errors)="errors.emit($event)"
        (resultPromptsChange)="resultPromptsChange.emit($event)"
        (showResultLineParser)="showResultLineParser = true"
      >
      </cpp-resolved-draft-result-line>
      } @if (!isResolved) {
      <cpp-unresolved-draft-result-line
        [resultLine]="resultLine"
        (destroy)="destroy.emit()"
        (showResultLineParser)="showResultLineParser = true"
      >
      </cpp-unresolved-draft-result-line>
      }
    </div>
  `,
  imports: [
    DraftResultLineParserComponent,
    ResolvedDraftResultLineComponent,
    UnresolvedDraftResultLineComponent
  ]
})
export class DraftResultLineComponent {
  @Input() belongsToOptionalBranch = false;
  @Input() draftStatus: DraftStatus;
  @Input() groupedWithResultDefinitionIds: string[] = [];
  @Input() resultLine: ResolvedDraftResultLine | UnresolvedDraftResultLine;
  @Input() ruleType: DraftResultRelation['ruleType'];
  @Input() isApplication?: boolean;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() isExParteCase?: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() isCourtApplicationFinalised?: boolean;
  @Input() isAmendmentAllowed?: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() amend = new EventEmitter<{
    amendmentReason: AmendmentReason;
    destroyResultLine?: boolean;
  }>();
  @Output() addChild = new EventEmitter<AddChildValue>();
  @Output() conditionalMandatoryValue = new EventEmitter<boolean>();
  @Output() destroy = new EventEmitter();
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() originalTextChange = new EventEmitter<string>();
  @Output() resultPromptsChange = new EventEmitter<Record<string, unknown>>();

  showResultLineParser = false;

  get isResolved(): boolean {
    return isResolvedDraftResultLine(this.resultLine);
  }

  handleOriginalTextChange(originalText: string) {
    if (originalText && originalText !== this.resultLine.originalText) {
      this.originalTextChange.emit(originalText);
    }
    this.showResultLineParser = false;
  }
}
