import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ValidationError } from '@cpp/pdk';
import { createSelector, select, Store } from '@ngrx/store';
import { isEqual } from 'lodash-es';
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { AmendmentReason } from '../../../core';
import {
  getResultDefinitionIdsGroupedWith,
  hasPendingAmendments,
  isResolvedDraftResultLine,
  isSharedResultLine
} from '../../core/helpers';
import {
  DraftResultActions,
  getBelongsToOptionalBranch,
  getDraftResult,
  getDraftResultLineById,
  getDraftResultReadOnly,
  ResultsState
} from '../../core/store';
import {
  ChildResultDefinition,
  DraftResultPrompt,
  DraftResultRelation,
  DraftStatus,
  ParseChildOptions,
  PromptEntry,
  ResolvedDraftResultLine,
  UnresolvedDraftResultLine
} from '../../results.interfaces';
import { AddChildValue } from './resolved-draft-result-line.component';
import { DraftResultLineComponent } from './draft-result-line.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'cpp-draft-result-line-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cpp-draft-result-line
      [belongsToOptionalBranch]="belongsToOptionalBranch$ | async"
      [draftStatus]="draftStatus$ | async"
      [groupedWithResultDefinitionIds]="groupedWithResultDefinitionIds$ | async"
      [caseStatus]="caseStatus"
      [resultLine]="resultLine"
      [ruleType]="ruleType"
      [isApplication]="isApplication"
      [hasHmctsOrganisation]="hasHmctsOrganisation"
      [prosecutorToBeNotified]="prosecutorToBeNotified"
      [isExParteCase]="isExParteCase"
      [isCourtApplicationFinalised]="isCourtApplicationFinalised"
      [isAmendmentAllowed]="isAmendmentAllowed"
      [amendApplicationPermission]="amendApplicationPermission"
      [canAllocateRelatedHearing]="canAllocateRelatedHearing"
      (addChild)="handleAddChildResultDefinition($event)"
      (amend)="handleAmendResultLine($event)"
      (conditionalMandatoryValue)="handleConditionalMandatoryValue($event)"
      (destroy)="handleDestroyResultLine()"
      (errors)="errors.emit($event)"
      (originalTextChange)="handleReplaceResultLine($event)"
      (resultPromptsChange)="handleUpdateResultPrompts($event)"
    >
    </cpp-draft-result-line>
  `,
  imports: [DraftResultLineComponent, AsyncPipe]
})
export class DraftResultLineContainerComponent {
  @Input()
  set resultLineId(resultLineId: string) {
    this.resultLineId$.next(resultLineId);
  }
  @Input() ruleType: DraftResultRelation['ruleType'];
  @Input() targetStatus: DraftStatus;
  @Input() isApplication?: boolean;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() isExParteCase?: boolean;
  @Input() isCourtApplicationFinalised?: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() isAmendmentAllowed?: boolean;
  @Input() amendApplicationPermission?: boolean;
  @Input() caseStatus?: string;
  @Output() errors = new EventEmitter<ValidationError[] | null>();

  belongsToOptionalBranch$: Observable<boolean>;
  draftStatus$: Observable<DraftStatus>;
  groupedWithResultDefinitionIds$: Observable<string[]>;
  resultLine: ResolvedDraftResultLine | UnresolvedDraftResultLine;

  private resultLineId$ = new ReplaySubject<string>(1);

  constructor(private store: Store<ResultsState>) {
    const resultLine$ = this.resultLineId$.pipe(
      switchMap(resultLineId => store.pipe(select(getDraftResultLineById(resultLineId)))),
      filter(resultLine => Boolean(resultLine)),
      tap(resultLine => {
        // piggy back on this subscription to take a local copy of the
        // resultLine for working with it in other methods on this component
        this.resultLine = resultLine;
      })
    );

    this.belongsToOptionalBranch$ = this.resultLineId$.pipe(
      switchMap(resultLineId => store.pipe(select(getBelongsToOptionalBranch(resultLineId))))
    );

    // The status of a draft result line is unique to itself, in that one result
    // line may be shared while another is only a draft, so it must be
    // determined independently
    this.draftStatus$ = combineLatest([
      resultLine$,
      this.store.pipe(select(getDraftResultReadOnly))
    ]).pipe(
      map(([resultLine, readonly]) => {
        const isShared =
          (this.targetStatus === 'SHARED' && !isSharedResultLine(resultLine)) ||
          isSharedResultLine(resultLine);

        if (readonly) {
          return 'READONLY';
        }

        if (isShared && !hasPendingAmendments(resultLine)) {
          return 'SHARED';
        }

        return 'DRAFT';
      })
    );

    this.groupedWithResultDefinitionIds$ = resultLine$.pipe(
      filter(isResolvedDraftResultLine),
      map(resultLine =>
        // get the result line to determine the caseId, masterDefendantId, and
        // offenceId against which to match – from this we create a selector on
        // the fly that is scoped to these values (for performance benefits)
        createSelector(getDraftResult, draftResult =>
          getResultDefinitionIdsGroupedWith(draftResult, resultLine)
        )
      ),
      switchMap(selector => store.pipe(select(selector))),
      catchError(() => of([])),
      distinctUntilChanged(isEqual)
    );
  }

  handleAddChildResultDefinition({ childResultDefinition, ...other }: AddChildValue) {
    this.store.dispatch(
      DraftResultActions.addChildToDraftResultLine({
        options: {
          belongsToResultLineId: this.resultLine.resultLineId,
          orderedDate: this.resultLine.orderedDate,
          shortCode: childResultDefinition.shortCode,
          ...other
        }
      })
    );
  }

  handleAmendResultLine({
    amendmentReason,
    childResultDefinition,
    destroyResultLine
  }: {
    amendmentReason: AmendmentReason;
    childResultDefinition?: ChildResultDefinition;
    destroyResultLine?: boolean;
  }) {
    const childResultOptions: ParseChildOptions | undefined = childResultDefinition
      ? {
          belongsToResultLineId: this.resultLine.resultLineId,
          orderedDate: this.resultLine.orderedDate,
          shortCode: childResultDefinition.shortCode
        }
      : undefined;

    this.store.dispatch(
      DraftResultActions.setAmendmentReason({
        resultLineId: this.resultLine.resultLineId,
        amendmentReason,
        childResultOptions,
        destroyResultLine
      })
    );
  }

  handleConditionalMandatoryValue(selected: boolean) {
    this.store.dispatch(
      DraftResultActions.setConditionalMandatory({
        resultLineId: this.resultLine.resultLineId,
        selected
      })
    );
  }

  handleDestroyResultLine() {
    this.store.dispatch(
      DraftResultActions.destroyDraftResultLine({
        resultLineId: this.resultLine.resultLineId
      })
    );
  }

  handleReplaceResultLine(originalText: string) {
    this.store.dispatch(
      DraftResultActions.replaceDraftResultLine({
        options: {
          resultLineId: this.resultLine.resultLineId,
          originalText,
          orderedDate: this.resultLine.orderedDate
        }
      })
    );
  }

  handleUpdateResultPrompts(resultPrompts: DraftResultPrompt[]) {
    this.store.dispatch(
      DraftResultActions.updateResultPromptsForDraftResultLine({
        resultLineId: this.resultLine.resultLineId,
        resultPrompts
      })
    );
  }
}
