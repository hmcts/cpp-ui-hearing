import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  DestroyRef,
  inject
} from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AmendmentReason,
  getCurrentHearingId,
  getCurrentHearingState,
  getIsHearingLockedBySomeoneElse,
  HearingLockState
} from '../../core';
import { isResultLineForApplication, hasPendingAmendments } from '../core/helpers';
import {
  DraftResultActions,
  getHearingAmendedBySelf,
  getShareableResultLinesFor,
  ResultsState
} from '../core/store';
import {
  ChildResultDefinition,
  ExtendedResolvedDraftResultLine,
  ResolvedDraftResultLine
} from '../results.interfaces';
import { AsyncPipe } from '@angular/common';
import { ShareableResultLineComponent } from './shareable-result-line.component';
import { NoShareableResultsComponent } from './no-shareable-results.component';
import { DeletedResultLinesComponent } from './deleted-result-lines.component';

interface SortedResults {
  shortCode: string;
  children: SortedResults[];
}

@Component({
  selector: 'cpp-shareable-results-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resultLinesForResultLevel.length > 0) { @if (showResultsPlaceholder) {
    <b>Results</b>
    } @for (resultLine of resultLinesForResultLevel; track resultLine.resultLineId) {
    <cpp-shareable-result-line
      [hearingAmendedByCurrentUser]="hearingAmendedByCurrentUser$ | async"
      [hearingId]="hearingId$ | async"
      [hearingLockState]="hearingLockState$ | async"
      [resultLine]="resultLine"
      [isCourtApplicationFinalised]="isCourtApplicationFinalised"
      [isAmendmentAllowed]="isAmendmentAllowed"
      [amendApplicationPermission]="amendApplicationPermission"
      [caseStatus]="applicationCaseStatus"
      [conditonalMandatoryWithChild]="getConditionalMandatoryHasChild(resultLine)"
      (amendmentReasonChange)="handleChangeAmendmentReason(resultLine, $event)"
    >
    </cpp-shareable-result-line>
    } } @if (hasAmendApplication) {
    <cpp-no-shareable-results
      [isHearingLockedBySomeoneElse]="isHearingLockedBySomeoneElse$ | async"
    ></cpp-no-shareable-results>
    } @if (deletedResultLines.length > 0) {
    <cpp-deleted-result-lines [deletedResultLines]="deletedResultLines"></cpp-deleted-result-lines>
    }
  `,
  imports: [
    ShareableResultLineComponent,
    NoShareableResultsComponent,
    DeletedResultLinesComponent,
    AsyncPipe
  ]
})
export class ShareableResultsContainerComponent implements OnInit {
  @Input() applicationId?: string;
  @Input() caseId?: string;
  @Input() masterDefendantId?: string;
  @Input() offenceId?: string;
  @Input() applicationCaseStatus?: string;
  @Input() showResultsPlaceholder = false;
  @Input() isCourtApplicationFinalised = false;
  @Input() isAmendmentAllowed = false;
  @Input() amendApplicationPermission = false;
  @Input() showCaseLevelOffences = false;

  hearingAmendedByCurrentUser$: Observable<boolean>;
  hearingId$: Observable<string>;
  hearingLockState$: Observable<HearingLockState>;
  isHearingLockedBySomeoneElse$: Observable<boolean>;
  resultLines: ResolvedDraftResultLine[] = [];
  resultLinesForResultLevel: ExtendedResolvedDraftResultLine[] = [];
  deletedResultLines: ResolvedDraftResultLine[] = [];
  activeResultLines: ResolvedDraftResultLine[] = [];
  hasAmendApplication = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private store: Store<ResultsState>, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const filterByResultLevel: string[] = [];

    if (this.offenceId) {
      filterByResultLevel.push('O');
      if (this.showCaseLevelOffences) {
        filterByResultLevel.push('C');
      }
    } else if (this.caseId) {
      filterByResultLevel.push('C');
    } else if (this.masterDefendantId) {
      filterByResultLevel.push('D');
    }

    this.hearingAmendedByCurrentUser$ = this.store.pipe(select(getHearingAmendedBySelf));
    this.hearingId$ = this.store.pipe(select(getCurrentHearingId));
    this.hearingLockState$ = this.store.pipe(select(getCurrentHearingState));
    this.isHearingLockedBySomeoneElse$ = this.store.pipe(select(getIsHearingLockedBySomeoneElse));
    this.store
      .pipe(
        select(
          getShareableResultLinesFor({
            applicationId: this.applicationId,
            caseId: this.caseId,
            masterDefendantId: this.masterDefendantId,
            offenceId: this.offenceId
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(resultLines => {
        this.resultLines = resultLines;
        const resultLinesGroupedByResultLevel = resultLines.filter(resultLine =>
          filterByResultLevel.length > 0 && !isResultLineForApplication(resultLine)
            ? filterByResultLevel.includes(resultLine.resultLevel as string)
            : true
        );
        this.resultLinesForResultLevel = resultLinesGroupedByResultLevel.filter(
          resultLine =>
            !resultLine.deleted || (resultLine.deleted && hasPendingAmendments(resultLine))
        ) as Array<ExtendedResolvedDraftResultLine>; /* The code should be checked it seems there won't be any childResultDefinitions in the result line */
        this.deletedResultLines = resultLinesGroupedByResultLevel.filter(
          resultLine =>
            resultLine.deleted &&
            !hasPendingAmendments(resultLine) &&
            !!resultLine.amendmentsLog &&
            resultLine.amendmentsLog.amendmentsRecord.length > 0
        );
        this.activeResultLines = resultLines.filter(resultLine => !resultLine.deleted);
        this.resultLinesForResultLevel = this.sortResults();
        this.canAmendmentApplication();
        this.cdr.markForCheck();
      });
  }

  canAmendmentApplication() {
    this.hasAmendApplication = this.activeResultLines.length === 0 && this.showResultsPlaceholder;
    if (this.amendApplicationPermission) {
      this.hasAmendApplication =
        this.activeResultLines.length === 0 &&
        this.showResultsPlaceholder &&
        (!this.isCourtApplicationFinalised ||
          (this.isCourtApplicationFinalised && this.isAmendmentAllowed));
    }
  }

  sortResults(): ExtendedResolvedDraftResultLine[] {
    const getChildren = (r: ExtendedResolvedDraftResultLine): SortedResults[] => {
      const childrenArray: SortedResults[] = [];
      (r.childResultDefinitions || []).forEach((child: ChildResultDefinition) => {
        this.resultLinesForResultLevel.forEach(resultLineForResultLevel => {
          if (child.shortCode === resultLineForResultLevel.shortCode) {
            const childResult = {
              shortCode: resultLineForResultLevel.shortCode,
              children: getChildren(resultLineForResultLevel)
            };
            childrenArray.push(childResult);
          }
        });
      });
      return childrenArray;
    };

    const flattenHierarchy = (
      sortedResults: SortedResults[]
    ): ExtendedResolvedDraftResultLine[] => {
      let flattened: ExtendedResolvedDraftResultLine[] = [];

      for (const sortedResult of sortedResults) {
        const result = this.resultLinesForResultLevel.find(
          r => r.shortCode === sortedResult.shortCode
        );

        if (!!result) {
          this.resultLinesForResultLevel.splice(this.resultLinesForResultLevel.indexOf(result), 1);
          flattened.push(result);
        }

        if (sortedResult.children) {
          flattened = flattened.concat(flattenHierarchy(sortedResult.children));
        }
      }
      return flattened;
    };

    const returnedResults: SortedResults[] = [];
    (this.resultLinesForResultLevel || []).forEach(result => {
      if (
        !(this.resultLinesForResultLevel || []).some(r =>
          (r.childResultDefinitions || []).some(child => child.shortCode === result.shortCode)
        )
      ) {
        const tempSortedResult = {
          shortCode: result.shortCode,
          children: getChildren(result)
        };
        returnedResults.push(tempSortedResult);
      }
    });

    return flattenHierarchy(returnedResults);
  }

  handleChangeAmendmentReason(
    { resultLineId }: ResolvedDraftResultLine,
    amendmentReason: AmendmentReason
  ) {
    this.store.dispatch(
      DraftResultActions.setAmendmentReason({
        resultLineId,
        amendmentReason
      })
    );
  }

  getConditionalMandatoryHasChild(resultLine: ExtendedResolvedDraftResultLine): boolean {
    if (!resultLine.conditionalMandatory) {
      return undefined;
    }
    return (resultLine.childResultDefinitions || []).some(child =>
      this.resultLinesForResultLevel.some(r => {
        if (child.childOfTrueResponse === undefined) {
          return r.shortCode === child.shortCode;
        }
        const childResultDefsCodes = resultLine.childResultDefinitions.map(
          childDef => childDef.code
        );
        const resultDefinitionIdsForResultLevel = this.resultLinesForResultLevel.map(
          resultLine => resultLine.resultDefinitionId
        );
        const defaultedChildCode = resultDefinitionIdsForResultLevel.filter(groupDefId =>
          childResultDefsCodes.includes(groupDefId)
        );

        if (defaultedChildCode && defaultedChildCode.length) {
          return false;
        }

        return true;
      })
    );
  }
}
