import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { ValidationError, PdkMarginDirective, PdkTypographyDirective } from '@cpp/pdk';
import { AmendmentReason } from '../../../core';
import { getChildResultDefinitionsForRuleType, getTargetId } from '../../core/helpers';
import { AmendmentService } from '../../common/services/amendment.service';
import {
  ChildResultDefinition,
  DraftResultPrompt,
  DraftResultRelation,
  DraftStatus,
  ExtendedResolvedDraftResultLine,
  NgChanges,
  PromptEntry
} from '../../results.interfaces';
import { DraftResultLineTagComponent } from '../../common/components/draft-result-line-tag.component';
import { PartsResolverContainerComponent } from '../parts-resolver/parts-resolver.container';
import { DraftResultLineOptionsComponent } from './draft-result-line-options.component';
import { ResultPromptsSummaryComponent } from '../../common/components/result-prompts-summary.component';
import { DraftResultLineBodyComponent } from './draft-result-line-body.component';
import { ConditionalMandatoryFormComponent } from './conditional-mandatory-form.component';
import { ChildResultDefinitionsFormComponent } from './child-result-definitions-form.component';

export interface AddChildValue {
  amendmentReason?: AmendmentReason;
  childResultDefinition: ChildResultDefinition;
}

@Component({
  selector: 'cpp-resolved-draft-result-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="result-line-header">
      <div pdk-margin-right="1" cpp-draft-result-line-tag data-test-id="resultLineTitle">
        <h6 pdk-typography="body-small" pdk-margin="0">
          <b>{{ resultLine.label }}</b>
        </h6>
      </div>

      @if (resultLine.unresolvedParts.length > 0) {
      <cpp-parts-resolver-container
        [parts]="resultLine.unresolvedParts"
        [resultLineId]="resultLine.resultLineId"
        pdk-margin-left="2"
      ></cpp-parts-resolver-container>
      } @if (hasAmendApplication) {
      <cpp-draft-result-line-options
        [resultLine]="resultLine"
        [ruleType]="ruleType"
        [draftStatus]="draftStatus"
        (amend)="amend.emit($event)"
        (destroy)="destroy.emit($event)"
        (showResultLineParser)="showResultLineParser.emit()"
      >
      </cpp-draft-result-line-options>
      }
    </div>

    @if (resultLine.resultPrompts.length > 0) {
    <cpp-result-prompts-summary
      [resultPrompts]="resultLine.resultPrompts"
    ></cpp-result-prompts-summary>
    } @if (draftStatus === 'DRAFT' && resultLine.promptChoices.length > 0) {
    <cpp-draft-result-line-body
      [resultLine]="resultLine"
      [required]="!belongsToOptionalBranch"
      [isApplication]="isApplication"
      [hasHmctsOrganisation]="hasHmctsOrganisation"
      [prosecutorToBeNotified]="prosecutorToBeNotified"
      [isExParteCase]="isExParteCase"
      [canAllocateRelatedHearing]="canAllocateRelatedHearing"
      (errors)="errors.emit($event)"
      (resultPromptsChange)="handleResultPromptsChanged($event)"
    >
    </cpp-draft-result-line-body>
    } @if (draftStatus !== 'READONLY' && resultLine.conditionalMandatory) {
    <cpp-conditional-mandatory-form
      [resultLine]="resultLine"
      [disabled]="draftStatus === 'SHARED'"
      [resultDefinitionLabel]="resultLine.label"
      [value]="resultLine.valid ? hasConditionalMandatoryChild : null"
      (valueChange)="conditionalMandatoryValue.emit($event)"
    >
    </cpp-conditional-mandatory-form>
    } @if (draftStatus !== 'READONLY' && showChildResultDefinitionsForm) {
    <cpp-child-result-definitions-form
      [atLeastOneOf]="atLeastOneOf"
      [oneOf]="oneOf"
      [required]="!belongsToOptionalBranch"
      [resultDefinitionLabel]="resultLine.label"
      [selectedChildResultDefinitionIds]="groupedWithResultDefinitionIds"
      (childResultDefinitionSelected)="handleChildResultDefinitionSelected($event)"
      pdk-margin-top="3"
      style="display: block"
    >
    </cpp-child-result-definitions-form>
    }
  `,
  styles: [
    `
      .result-line-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 3px;
        margin-top: -75px;
        padding-top: 75px;
      }
    `
  ],
  imports: [
    PdkMarginDirective,
    PdkTypographyDirective,
    DraftResultLineTagComponent,
    PartsResolverContainerComponent,
    DraftResultLineOptionsComponent,
    ResultPromptsSummaryComponent,
    DraftResultLineBodyComponent,
    ConditionalMandatoryFormComponent,
    ChildResultDefinitionsFormComponent
  ]
})
export class ResolvedDraftResultLineComponent implements OnChanges {
  @Input() belongsToOptionalBranch = false;
  @Input() draftStatus: DraftStatus;
  @Input() groupedWithResultDefinitionIds: string[] = [];
  @Input() resultLine: ExtendedResolvedDraftResultLine;
  @Input() ruleType: DraftResultRelation['ruleType'];
  @Input() isApplication?: boolean;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() isExParteCase?: boolean;
  @Input() isCourtApplicationFinalised?: boolean;
  @Input() isAmendmentAllowed?: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() caseStatus: string;
  @Output() addChild = new EventEmitter<AddChildValue>();
  @Output() amend = new EventEmitter<{
    amendmentReason: AmendmentReason;
    childResultDefinition?: ChildResultDefinition;
    destroyResultLine?: boolean;
  }>();
  @Output() conditionalMandatoryValue = new EventEmitter<boolean>();
  @Output() destroy = new EventEmitter();
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() resultPromptsChange = new EventEmitter<DraftResultPrompt[]>();
  @Output() showResultLineParser = new EventEmitter();

  hasConditionalMandatoryChild: boolean;
  atLeastOneOf: ChildResultDefinition[] = [];
  oneOf: ChildResultDefinition[] = [];

  hasAmendApplication = false;

  constructor(private elementRef: ElementRef, private amendmentService: AmendmentService) {}

  get showChildResultDefinitionsForm(): boolean {
    return this.atLeastOneOf.length > 0 || this.oneOf.length > 0;
  }

  ngOnChanges(changes: NgChanges<ResolvedDraftResultLineComponent>): void {
    if (changes.groupedWithResultDefinitionIds) {
      this.atLeastOneOf = getChildResultDefinitionsForRuleType(this.resultLine, 'atleastOneOf');
      this.oneOf = getChildResultDefinitionsForRuleType(this.resultLine, 'oneOf');
      // Where a "conditional mandatory" result definition exists (i.e. a
      // 'mandatory' child result definition that is not introduced
      // automatically), we determine the Yes/No value of the choice by its
      // presence in the result definitions ids this offence is grouped with
      if (this.resultLine.conditionalMandatory) {
        const conditionalMandatoryChildren = getChildResultDefinitionsForRuleType(
          this.resultLine,
          'mandatory'
        );

        const hasChildOfTrueResponse = conditionalMandatoryChildren.some(
          conMandChild => conMandChild.childOfTrueResponse === false
        );
        if (hasChildOfTrueResponse) {
          const selectedChildResult = conditionalMandatoryChildren.find(condMandChild =>
            this.groupedWithResultDefinitionIds.includes(condMandChild.code)
          );
          this.hasConditionalMandatoryChild =
            selectedChildResult?.childOfTrueResponse === false ? false : true;
          return;
        }

        this.hasConditionalMandatoryChild = this.groupedWithResultDefinitionIds.includes(
          conditionalMandatoryChildren[0].code
        );
      }
    }
    this.hasAmendApplication = true;
    if (this.amendApplicationPermission) {
      this.hasAmendApplication =
        !this.isCourtApplicationFinalised ||
        (this.isCourtApplicationFinalised && this.isAmendmentAllowed);
    }
  }

  handleChildResultDefinitionSelected = async (childResultDefinition: ChildResultDefinition) => {
    if (this.draftStatus !== 'SHARED') {
      this.addChild.emit({ childResultDefinition });
    } else {
      const amendmentReason = await this.amendmentService.requestAmendmentReason({
        targetIds: [getTargetId(this.resultLine)]
      });
      // If the result line is being amended by adding a child, then capture the
      // amendment reason and update the parent actions are both chained before updating
      // the draftresults in the BE side
      if (amendmentReason) {
        this.amend.emit({ amendmentReason, childResultDefinition: childResultDefinition });
      }
    }
  };

  handleResultPromptsChanged(resultPrompts: DraftResultPrompt[]) {
    this.resultPromptsChange.emit(resultPrompts);
    window.scroll(
      0,
      this.elementRef.nativeElement.getBoundingClientRect().top + window.pageYOffset
    );
  }
}
