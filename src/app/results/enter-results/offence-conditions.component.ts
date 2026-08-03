import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  ValidationError,
  PdkAlertComponent,
  PdkErrorSummaryComponent,
  PdkMarginDirective,
  PdkTypographyDirective
} from '@cpp/pdk';
import { Action } from '@ngrx/store';
import { AmendmentReason, HearingDetail } from '../../core';
import { Offence } from '../../magistrates/interfaces/magistrates-hearing.interface';
import { AmendmentService } from '../common/services/amendment.service';
import { DraftResultRelation, PromptEntry } from '../results.interfaces';
import { ValidationMessage } from '../results-validation.interfaces';
import { ParseTextValue } from './draft-result/draft-result-body.component';
import { OffenceConditionsDialogComponent } from './offence-conditions-dialog.component';
import { DraftResultComponent } from './draft-result/draft-result.component';
import { DelegatedPowersComponent } from '../../shared/components/delegated-powers/delegated-powers.component';

export interface DelegatedPowersValue {
  delegatedPowers: boolean;
  amendmentReason?: AmendmentReason;
}

@Component({
  selector: 'cpp-enter-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isSelectedHearingInFuture) {
    <div pdk-margin-bottom="3">
      <pdk-alert type="warning" icon="true" data-test-id="futureHearingWarningBanner">
        This hearing is in the future. Are you sure you want to result it?
      </pdk-alert>
    </div>
    }
    <offence-conditions-dialog [offences]="offencesWithConditions"></offence-conditions-dialog>

    @if (errors) {
    <pdk-error-summary [errors]="errors"></pdk-error-summary>
    }
    <header>
      <h1 pdk-margin-top="3" pdk-typography="heading-xlarge">Enter results</h1>
      <delegated-powers
        [delegatedPowers]="delegatedPowers"
        (delegatedPowersChange)="handleChangeDelegatedPowers($event)"
      ></delegated-powers>
    </header>

    <cpp-draft-result
      [draftResultError]="draftResultError"
      [draftResultPromptsValid]="draftResultPromptsValid"
      [draftResultRelations]="draftResultRelations"
      [draftResultSaving]="draftResultSaving"
      [hearing]="hearing"
      [readonly]="readonly"
      [sharedTargetIds]="sharedTargetIds"
      [shadowListedOffenceIds]="shadowListedOffenceIds"
      [electronicMonitoringOffences]="electronicMonitoringOffences"
      [warrantOfArrestOffences]="warrantOfArrestOffences"
      [hasHmctsOrganisation]="hasHmctsOrganisation"
      [prosecutorToBeNotified]="prosecutorToBeNotified"
      [isExParteCase]="isExParteCase"
      [canAllocateRelatedHearing]="canAllocateRelatedHearing"
      [amendApplicationPermission]="amendApplicationPermission"
      [caseStatus]="caseStatus"
      [validationErrorMessagesByOffenceId]="validationErrorMessagesByOffenceId"
      (errors)="handleFormErrors($event)"
      (parseTextValues)="parseTextValues.emit($event)"
      (retryFailedAction)="retryFailedAction.emit($event)"
      (saveAndContinue)="saveAndContinue.emit()"
      (shadowListedOffenceIdsChange)="shadowListedOffenceIdsChange.emit($event)"
    >
    </cpp-draft-result>
  `,
  styles: [
    `
      header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
      }

      :host ::ng-deep .govuk-error-summary__list a {
        white-space: pre-line;
      }
    `
  ],
  imports: [
    PdkAlertComponent,
    PdkErrorSummaryComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    OffenceConditionsDialogComponent,
    DraftResultComponent,
    DelegatedPowersComponent
  ],
  providers: [AmendmentService]
})
export class EnterResultsComponent implements OnChanges {
  @Input() isSelectedHearingInFuture = false;
  @Input() delegatedPowers = false;
  @Input() draftResultError = false;
  @Input() draftResultPromptsValid = false;
  @Input() draftResultRelations: Record<string, DraftResultRelation[]>;
  @Input() draftResultSaving = false;
  @Input() hearing: HearingDetail;
  @Input() readonly = false;
  @Input() shadowListedOffenceIds: string[] = [];
  @Input() sharedTargetIds: string[] = [];
  @Input() electronicMonitoringOffences: Offence[];
  @Input() offencesWithConditions: Offence[];
  @Input() warrantOfArrestOffences: Offence[];
  @Input() hasHmctsOrganisation: boolean;
  @Input() prosecutorToBeNotified: PromptEntry[];
  @Input() isExParteCase: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Input() validationErrorMessagesByOffenceId: Map<string, ValidationMessage[]> = new Map();
  @Input() validationSummaryErrors: ValidationError[] = [];
  @Output() delegatedPowersChange = new EventEmitter<DelegatedPowersValue>();
  @Output() parseTextValues = new EventEmitter<ParseTextValue[]>();
  @Output() retryFailedAction = new EventEmitter<Action>();
  @Output() saveAndContinue = new EventEmitter<void>();
  @Output() shadowListedOffenceIdsChange = new EventEmitter<string[]>();

  errors: ValidationError[] | null = null;
  private formErrors: ValidationError[] | null = null;

  constructor(private amendmentService: AmendmentService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['validationSummaryErrors']) {
      this.errors = this.combineErrors();

      if (this.validationSummaryErrors?.length) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  handleFormErrors(formErrors: ValidationError[] | null): void {
    this.formErrors = formErrors;
    this.errors = this.combineErrors();
  }

  private combineErrors(): ValidationError[] | null {
    const combined = [...(this.formErrors || []), ...(this.validationSummaryErrors || [])];
    return combined.length > 0 ? combined : null;
  }

  async handleChangeDelegatedPowers(delegatedPowers: boolean) {
    if (this.sharedTargetIds.length > 0) {
      const amendmentReason = await this.amendmentService.requestAmendmentReason();

      if (amendmentReason) {
        this.delegatedPowersChange.emit({ amendmentReason, delegatedPowers });
      }
    } else {
      this.delegatedPowersChange.emit({ delegatedPowers });
    }
  }
}
