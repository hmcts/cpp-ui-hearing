import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { findIndex } from 'lodash-es';
import { CourtApplication, HearingDetail, Offence, ProsecutionCaseIdentifier } from '../../core';
import {
  ApplicationItem,
  getResultLineById,
  getResultLinesGroupedByTargetId,
  getSortedRelations,
  getSubjectId,
  getTargetsForHearing,
  getTargetsHierarchy,
  isResolvedDraftResultLine,
  OffenceItem,
  TargetGroup,
  TargetsGroupedBySubject,
  TargetSubject
} from '../core/helpers';
import {
  CopyDraftResultsTarget,
  DraftResult,
  OffenceLike,
  ResolvedDraftResultLine
} from '../results.interfaces';
import {
  ErrorMessageConfig,
  ValidationError,
  PdkErrorSummaryComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkFillColorDirective,
  PdkTextColorDirective,
  PdkFieldsetComponent,
  PdkFieldsetLegendDirective,
  PdkVisuallyHiddenDirective,
  PdkCheckboxGroupComponent,
  PdkMinCountValidatorDirective,
  PdkCheckboxComponent,
  PdkListDirective,
  PdkFormFieldComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective,
  PdkErrorMessageComponent,
  PdkFoldableTextComponent
} from '@cpp/pdk';
import { DraftResultLineTagComponent } from '../common/components/draft-result-line-tag.component';
import { ResultPromptsSummaryComponent } from '../common/components/result-prompts-summary.component';
import { RouterLink } from '@angular/router';
import { TargetSubjectNamePipe } from '../common/pipes/target-subject-name.pipe';
import { CaseReferencePipe } from '../../shared/pipes/case-reference.pipe';

interface CopyFromApplication {
  subject: TargetSubject;
  application: CourtApplication;
  prosecutionCase?: { id: string; prosecutionCaseIdentifier: ProsecutionCaseIdentifier };
}

interface CopyFromOffence {
  subject: TargetSubject;
  offence: Offence;
  offenceIndex: number;
  prosecutionCase?: { id: string; prosecutionCaseIdentifier: ProsecutionCaseIdentifier };
}

type CopyFromTarget = CopyFromApplication | CopyFromOffence;

interface ResultGroup {
  resultLineId: string;
  resultLines: ResolvedDraftResultLine[];
}

interface CustomErrorMessage {
  targetId: string;
  resultLine: OffenceLike<ResolvedDraftResultLine>;
  errorType: ErrorMessageConfig;
}

const DEFAULT_ERROR_MESSAGES = {
  defendantLevelError: {
    rule: 'defendantLevelError',
    message: `You cannot apply [{{shortcode}}] to two or more offences for the same defendant`
  },
  caseDefendantLevelError: {
    rule: 'caseDefendantLevelError',
    message: `You cannot apply [{{shortcode}}] to the same defendant in the same case`
  }
};

@Component({
  selector: 'copy-results',
  templateUrl: './copy-results.component.html',
  imports: [
    PdkErrorSummaryComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    FormsModule,
    PdkPaddingDirective,
    PdkFillColorDirective,
    PdkTextColorDirective,
    PdkFieldsetComponent,
    PdkFieldsetLegendDirective,
    PdkVisuallyHiddenDirective,
    PdkCheckboxGroupComponent,
    PdkMinCountValidatorDirective,
    PdkCheckboxComponent,
    PdkListDirective,
    DraftResultLineTagComponent,
    ResultPromptsSummaryComponent,
    PdkFormFieldComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    RouterLink,
    TargetSubjectNamePipe,
    CaseReferencePipe,
    PdkErrorMessageComponent,
    PdkFoldableTextComponent
  ]
})
export class CopyResultsComponent implements OnChanges {
  @Input() copyFromTargetId: string;
  @Input() draftResult: DraftResult;
  @Input() hearing: HearingDetail;
  @Input() invalidResultLines: ResolvedDraftResultLine[];
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() copyResults = new EventEmitter<CopyDraftResultsTarget[]>();
  @ViewChild(NgForm) ngForm: NgForm;

  copyFromTarget: CopyFromTarget;
  resultGroups: ResultGroup[] = [];
  selectedTargetIds: string[] = [];
  selectedResultLineIds: string[] = [];
  targetsGroupedBySubject: TargetsGroupedBySubject[] = [];
  errors: ValidationError[] = [];

  private targetIds: string[] = [];

  get allTargetIdsSelected(): boolean {
    return this.targetIds.every(targetId => this.selectedTargetIds.includes(targetId));
  }

  getCaseLevelOffences(targetGroup: TargetGroup): OffenceItem[] {
    return (targetGroup.offenceItems || []).filter(oc => !!!oc.applicationId);
  }

  getCourtOrderOffences(targetGroup: TargetGroup): OffenceItem[] {
    return (targetGroup.offenceItems || []).filter(oc => !!oc.applicationId);
  }

  get copyFromApplication(): CopyFromApplication | undefined {
    return 'application' in this.copyFromTarget ? this.copyFromTarget : undefined;
  }

  get copyFromOffence(): CopyFromOffence | undefined {
    return 'offence' in this.copyFromTarget ? this.copyFromTarget : undefined;
  }

  sortcodesOfResultLinesToCopy(offenceId: string): string[] {
    return (this.invalidResultLines || [])
      .filter(r => (r as OffenceLike).offenceId === offenceId)
      .map(invalidResult => invalidResult.shortCode);
  }

  ngOnChanges() {
    this.targetsGroupedBySubject = getTargetsHierarchy(this.hearing);

    this.targetIds = getTargetsForHearing(this.hearing)
      .map(target => target.id)
      .filter(targetId => targetId !== this.copyFromTargetId);

    // Create the `copyFromTarget`, i.e. the target from which the result lines
    // will be copied. This `copyFromTarget` is just used for assembling data
    // used for rendering purposes and is not the source of the data to be
    // copied. Instead, the data is looked up the draft result using the
    // `copyFromTargetId`.

    iterator: for (const { subject, targetGroups } of this.targetsGroupedBySubject) {
      for (const { applicationItems, offenceItems, prosecutionCase } of targetGroups) {
        const offenceIndex = findIndex(offenceItems, { offenceId: this.copyFromTargetId });

        if (offenceIndex > -1) {
          this.copyFromTarget = {
            offenceIndex: offenceIndex + 1,
            offence: offenceItems[offenceIndex].offence,
            prosecutionCase,
            subject
          };
          break iterator;
        }

        const applicationIndex = findIndex(applicationItems, {
          applicationId: this.copyFromTargetId
        });

        if (applicationIndex > -1) {
          this.copyFromTarget = {
            application: applicationItems[applicationIndex].application,
            prosecutionCase,
            subject
          };
          break iterator;
        }
      }
    }

    // Create the result groups

    const relations = getResultLinesGroupedByTargetId(this.draftResult);
    const sortedRelationsForTarget = getSortedRelations(relations[this.copyFromTargetId] || []);
    const items: ResultGroup[] = [];

    for (const { resultLineId, ruleType } of sortedRelationsForTarget) {
      const resultLine = getResultLineById(this.draftResult, resultLineId);

      if (isResolvedDraftResultLine(resultLine)) {
        if (ruleType === 'standalone') {
          items.push({ resultLineId, resultLines: [resultLine] });
        } else if (ruleType !== 'unknown') {
          items[items.length - 1].resultLines.push(resultLine);
        }
      }
    }
    this.resultGroups = items;

    this.setValidationErrors();
  }

  canCopyToGroup(targetGroupsForSubject: TargetsGroupedBySubject): boolean {
    if (
      getSubjectId(targetGroupsForSubject.subject) === getSubjectId(this.copyFromTarget.subject)
    ) {
      const targetsCount = targetGroupsForSubject.targetGroups.reduce(
        (count, { applicationItems, offenceItems }) =>
          count + applicationItems.length + offenceItems.length,
        0
      );

      return targetsCount > 1;
    }
    return true;
  }

  handleSubmit(): void {
    this.errors = [];
    const copyTargets: CopyDraftResultsTarget[] = [];

    for (const { targetGroups } of this.targetsGroupedBySubject) {
      for (const { applicationItems, offenceItems, prosecutionCase } of targetGroups) {
        for (const { applicationId, offenceId, defendantId, masterDefendantId } of offenceItems) {
          if (this.selectedTargetIds.includes(offenceId)) {
            for (const originalResultLineId of this.selectedResultLineIds) {
              copyTargets.push({
                applicationId,
                caseId: prosecutionCase.id,
                defendantId,
                masterDefendantId,
                offenceId,
                originalResultLineId
              });
            }
          }
        }
        for (const { application } of applicationItems) {
          if (this.allowAmendApplication(application)) {
            for (const originalResultLineId of this.selectedResultLineIds) {
              copyTargets.push({
                applicationId: application.id,
                originalResultLineId
              });
            }
          }
        }
      }
    }
    this.copyResults.emit(copyTargets);
  }

  handleToggleAllTargetIds(): void {
    if (this.selectedTargetIds.length === this.targetIds.length) {
      this.selectedTargetIds = [];
    } else {
      this.selectedTargetIds = this.targetIds;
    }
  }

  getTargetHasError(targetId: string): boolean {
    return this.errors.some(e => e.id.startsWith(`${targetId}-`));
  }

  getErrorMessages(targetId: string, shortcode: string): ErrorMessageConfig[] {
    return (
      this.errors
        .filter(e => e.id === `${targetId}-${shortcode}`)
        .map((errorMessage: ValidationError) => ({
          rule: (errorMessage as unknown as ErrorMessageConfig).rule,
          message: errorMessage.message
        })) || []
    );
  }

  pushErrorMessage({ targetId, resultLine, errorType }: CustomErrorMessage): void {
    const message = (errorType.message as string).replace(
      '{{shortcode}}',
      resultLine.shortCode.toUpperCase()
    );
    this.errors.push({
      id: `${targetId}-${resultLine.shortCode}`,
      rule: errorType.rule,
      message,
      shouldFocus: true
    } as ValidationError);
  }

  private setValidationErrors(): void {
    this.errors = [];
    (this.invalidResultLines || []).forEach(result => {
      const errorType =
        result.resultLevel === 'D'
          ? DEFAULT_ERROR_MESSAGES.defendantLevelError
          : DEFAULT_ERROR_MESSAGES.caseDefendantLevelError;

      const resultWithOffence = result as OffenceLike<ResolvedDraftResultLine>;

      this.pushErrorMessage({
        targetId: resultWithOffence.offenceId,
        resultLine: resultWithOffence,
        errorType
      });
    });
  }

  get courtApplicationFinalised() {
    return (
      this.hearing.courtApplications &&
      this.hearing.courtApplications.some(
        courtApplication => courtApplication.applicationStatus === 'FINALISED'
      )
    );
  }

  get applicationAmendAllowed() {
    return (
      this.hearing.courtApplications &&
      this.hearing.courtApplications.some(courtApplication => courtApplication?.amendmentAllowed)
    );
  }

  hasAmendApplication(applicationItem: ApplicationItem): boolean {
    if (this.amendApplicationPermission) {
      return (
        applicationItem.applicationId !== this.copyFromTargetId &&
        (!this.courtApplicationFinalised ||
          (this.courtApplicationFinalised && this.applicationAmendAllowed))
      );
    }
    return applicationItem.applicationId !== this.copyFromTargetId;
  }

  allowAmendApplication(application: CourtApplication): boolean {
    if (this.amendApplicationPermission) {
      return (
        this.selectedTargetIds.includes(application.id) &&
        (application.applicationStatus !== 'FINALISED' ||
          (application.applicationStatus === 'FINALISED' && application?.amendmentAllowed))
      );
    }

    return this.selectedTargetIds.includes(application.id);
  }
}
