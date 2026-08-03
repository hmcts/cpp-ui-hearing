import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ValidationError } from '@cpp/pdk';
import { Action } from '@ngrx/store';
import { HearingDetail } from '../../../core';
import { Offence } from '../../../magistrates/interfaces/magistrates-hearing.interface';
import { DraftResultRelation, PromptEntry } from '../../results.interfaces';
import { ValidationMessage } from '../../results-validation.interfaces';
import { ParseTextValue, DraftResultBodyComponent } from './draft-result-body.component';
import { ChildResultDefinitionsFormComponent } from '../draft-result-line/child-result-definitions-form.component';
import { DraftResultActionBarComponent } from './draft-result-action-bar.component';

export interface DraftResultChildForm {
  errors: ValidationError[] | null;
  submit(): void;
}

@Component({
  selector: 'cpp-draft-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!readonly) {
    <cpp-draft-result-action-bar
      [draftResultError]="draftResultError"
      [draftResultSaving]="draftResultSaving"
      (retryFailedAction)="retryFailedAction.emit($event)"
      [saveEnabled]="draftResultPromptsValid"
      (save)="handleSubmitRegisteredChildForms()"
      (submitAllParsers)="draftResultBodyRef.submitAllParsers()"
    >
    </cpp-draft-result-action-bar>
    }
    <cpp-draft-result-body
      #draftResultBodyRef
      [hearing]="hearing"
      [relationsByTargetId]="draftResultRelations"
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
      (errors)="errors.emit($event)"
      (parseTextValues)="parseTextValues.emit($event)"
      (shadowListedOffenceIdsChange)="shadowListedOffenceIdsChange.emit($event)"
      (navigateToCopyResults)="handleNavigateToCopyResults($event)"
    >
    </cpp-draft-result-body>
  `,
  imports: [DraftResultActionBarComponent, DraftResultBodyComponent]
})
export class DraftResultComponent {
  @Input() draftResultError: { action: Action } | null = null;
  @Input() draftResultPromptsValid = false;
  @Input() draftResultRelations: Record<string, DraftResultRelation[]>;
  @Input() draftResultSaving = false;
  @Input() hearing: HearingDetail;
  @Input() readonly = false;
  @Input() shadowListedOffenceIds: string[] = [];
  @Input() sharedTargetIds: string[] = [];
  @Input() electronicMonitoringOffences: Offence[];
  @Input() warrantOfArrestOffences: Offence[];
  @Input() hasHmctsOrganisation: boolean;
  @Input() prosecutorToBeNotified: PromptEntry[];
  @Input() isExParteCase: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Input() validationErrorMessagesByOffenceId: Map<string, ValidationMessage[]> = new Map();
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() parseTextValues = new EventEmitter<ParseTextValue[]>();
  @Output() retryFailedAction = new EventEmitter<Action>();
  @Output() saveAndContinue = new EventEmitter<void>();
  @Output() shadowListedOffenceIdsChange = new EventEmitter<string[]>();
  @Output() navigateToCopyResults = new EventEmitter<string>();

  // Due to the fact that the draft result is a collection of many smaller
  // forms, if we want to submit all such forms concurrently, their submission
  // must be triggered programmatically. It is the responsibility of any such
  // child forms that wish to hook into this submission to register themselves
  // with this componennt.
  private registeredForms: DraftResultChildForm[] = [];

  constructor(private router: Router) {}

  handleNavigateToCopyResults(targetId: string) {
    this.router.navigate(['/manage', this.hearing.id, 'enter-results', 'copy-results', targetId]);
  }

  handleSubmitRegisteredChildForms() {
    let errors: ValidationError[] = [];
    // Iterate through each registered form and trigger its submit. This will
    // update the errors on the registered form, which can be aggregated and
    // emitted together.
    for (const registeredForm of this.registeredForms) {
      registeredForm.submit();

      if (registeredForm.errors) {
        errors = [...errors, ...registeredForm.errors];
      }
    }
    if (errors.length === 0) {
      this.saveAndContinue.emit();
    } else {
      this.errors.emit(errors);
    }
  }

  registerResultLineChildForm(form: DraftResultChildForm) {
    this.registeredForms.push(form);
  }

  deregisterResultLineChildForm(form: DraftResultChildForm) {
    const idx = this.registeredForms.indexOf(form);

    if (idx !== -1) {
      this.registeredForms.splice(idx, 1);
    }
  }

  isResultLineChildFormRegistered(resultLineChildId: string): boolean {
    return (
      this.registeredForms.length > 0 &&
      (this.registeredForms as ChildResultDefinitionsFormComponent[]).some(r =>
        (r.selectedChildResultDefinitionIds || []).includes(resultLineChildId)
      )
    );
  }
}
