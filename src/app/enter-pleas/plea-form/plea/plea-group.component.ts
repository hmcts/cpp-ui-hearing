import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AlcoholLevelMethod,
  ApplyDecisionPayload,
  ClearPleaInfo,
  CourtApplication,
  Defendant,
  GroupedPlea,
  Offence,
  PleaOption,
  SelectOption
} from '../../../core';
import {
  PdkBorderColorDirective,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { RouterLink } from '@angular/router';
import { DefendantNamePipe } from '../../../shared/pipes/defendant-name.pipe';
import { PleaComponent } from './plea.component';
import { redirect } from '../../../../bootstrap-app.config';

@Component({
  selector: 'plea-group',
  template: `
    <div data-role="offence-pleas">
      <hr pdk-border-colour="light-grey" />

      <h2 pdk-typography="heading-medium">
        <span pdk-visually-hidden>Case reference: </span>
        {{ plea.caseURN }}
      </h2>

      @for (offence of plea.withCount; track $index) {
      <section data-test-id="offencePlea">
        <h3 data-test-id="offenceTitle" pdk-typography="heading-small" pdk-margin-bottom="3">
          Count {{ offence.count }} - {{ offence.offenceTitle }}
        </h3>

        <div pdk-typography="body-small">
          {{ offence.offenceLegislation }}
        </div>
        @if (!offence.indictmentParticular) {
        <div data-test-id="offenceWording" pdk-typography="body-small">
          {{ offence.wording }}
        </div>
        } @if (offence.indictmentParticular) {
        <div data-test-id="indictmentParticulars" pdk-typography="body-small">
          <h3 pdk-typography="heading-small" pdk-margin-bottom="3">Indictment particulars</h3>
          {{ offence.indictmentParticular }}
        </div>
        } @for (defendant of offence.defendants; track defendant.id) {
        <section>
          <h4 data-test-id="defendantName" pdk-typography="heading-small" pdk-margin-bottom="3">
            {{ defendant | defendantName }}
          </h4>

          <plea
            [offence]="defendant.offences[0]"
            [defendant]="defendant"
            [isDelegatedPowers]="isDelegatedPowers"
            [hasCivilCase]="hasCivilCase"
            [courtApplications]="courtApplications"
            [motReasonOptions]="motReasonOptions"
            [selectedHearingDate]="selectedHearingDate"
            [sentencingDecisionOptions]="sentencingDecisionOptions"
            [hearingType]="hearingType"
            [standardPleaOptions]="standardPleaOptions"
            [eitherWayPleaOptions]="eitherWayPleaOptions"
            [indicatedPleaOptions]="indicatedPleaOptions"
            [magsExtraPleaOptions]="magsExtraPleaOptions"
            [crownExtraPleaOptions]="crownExtraPleaOptions"
            [civilCasePleaOptions]="civilCasePleaOptions"
            (updatePlea)="updatePlea.emit($event)"
            (clearOffencePlea)="clearOffencePlea.emit($event)"
            (applyDecision)="applyDecision.emit($event)"
          >
          </plea>

          <hr pdk-border-colour="light-grey" />
        </section>
        }
      </section>
      } @if (plea.withCount?.length > 0) {
      <h2 pdk-typography="heading-medium">Further offences</h2>
      } @for (defendant of plea.withoutCount; track defendant.id) {
      <section data-test-id="offencePlea">
        <h4 data-test-id="defendantName" pdk-typography="heading-small" pdk-margin-bottom="3">
          {{ defendant | defendantName }}
        </h4>

        @for (offence of defendant.offences; track offence.id) {
        <div>
          <h5 data-test-id="offenceTitle" pdk-typography="heading-small" pdk-margin-bottom="3">
            Offence {{ offence.orderIndex }} - {{ offence.offenceTitle }}
          </h5>

          <div pdk-typography="body-small">
            {{ offence.offenceLegislation }}
          </div>
          @if (!offence.indictmentParticular) {
          <div data-test-id="offenceWording" pdk-typography="body-small">
            {{ offence.wording }}
          </div>
          } @if (offence.indictmentParticular) {
          <div data-test-id="indictmentParticulars" pdk-typography="body-small">
            <h5 pdk-typography="heading-small" pdk-margin-bottom="3">Indictment particulars</h5>
            {{ offence.indictmentParticular }}
          </div>
          } @if (offence.offenceFacts) {
          <div pdk-margin-bottom="6">
            <div pdk-typography="body-small">
              <span pdk-typography="heading-small">Alcohol or drug level amount</span>
              {{ offence.offenceFacts.alcoholReadingAmount }}
            </div>
            <div pdk-typography="body-small">
              <span pdk-typography="heading-small"
                >Alcohol method (blood/breath/urine) or Drug type</span
              >
              {{ getAlcoholLevelMethod(offence.offenceFacts.alcoholReadingMethodCode) }}
            </div>
            <a
              [attr.aria-label]="'Amend ' + offence.offenceTitle"
              pdk-link
              unvisited
              [routerLink]=""
              (click)="
                navigateToAmend(
                  '/prosecution-casefile/edit-case/' +
                    defendant.prosecutionCaseId +
                    '/offences/' +
                    defendant.id +
                    '/amend/' +
                    offence.id
                )
              "
              data-role="amend-offence"
              >Edit values</a
            >
          </div>
          }
          <plea
            [offence]="offence"
            [defendant]="defendant"
            [isDelegatedPowers]="isDelegatedPowers"
            [hasCivilCase]="hasCivilCase"
            [courtApplications]="courtApplications"
            [motReasonOptions]="motReasonOptions"
            [selectedHearingDate]="selectedHearingDate"
            [sentencingDecisionOptions]="sentencingDecisionOptions"
            [hearingType]="hearingType"
            [standardPleaOptions]="standardPleaOptions"
            [eitherWayPleaOptions]="eitherWayPleaOptions"
            [indicatedPleaOptions]="indicatedPleaOptions"
            [magsExtraPleaOptions]="magsExtraPleaOptions"
            [crownExtraPleaOptions]="crownExtraPleaOptions"
            [civilCasePleaOptions]="civilCasePleaOptions"
            (updatePlea)="updatePlea.emit($event)"
            (clearOffencePlea)="clearOffencePlea.emit($event)"
            (applyDecision)="applyDecision.emit($event)"
          >
          </plea>

          <hr pdk-border-colour="light-grey" />
        </div>
        }
      </section>
      }
    </div>
  `,
  imports: [
    PdkBorderColorDirective,
    PdkTypographyDirective,
    PdkVisuallyHiddenDirective,
    PdkMarginDirective,
    DefendantNamePipe,
    PleaComponent,
    RouterLink,
    PdkLinkDirective
  ]
})
export class PleaGroupComponent {
  @Input() plea: GroupedPlea;
  @Input() hearingId: string;
  @Input() hasCivilCase: boolean;
  @Input() courtApplications: CourtApplication[];
  @Input() motReasonOptions: SelectOption[];
  @Input() sentencingDecisionOptions: SelectOption[];
  @Input() isDelegatedPowers: boolean;
  @Input() selectedHearingDate: string;
  @Input() hearingType: string;
  @Input() standardPleaOptions: PleaOption[] = [];
  @Input() eitherWayPleaOptions: PleaOption[] = [];
  @Input() indicatedPleaOptions: PleaOption[] = [];
  @Input() magsExtraPleaOptions: PleaOption[] = [];
  @Input() crownExtraPleaOptions: PleaOption[] = [];
  @Input() civilCasePleaOptions: PleaOption[] = [];
  @Input() alcoholMethodsOptions: AlcoholLevelMethod[] = [];
  @Output() updatePlea: EventEmitter<{
    offence: Offence;
    defendant: Defendant;
  }> = new EventEmitter();
  @Output() applyDecision: EventEmitter<ApplyDecisionPayload> = new EventEmitter();
  @Output() clearOffencePlea: EventEmitter<ClearPleaInfo> = new EventEmitter();

  getAlcoholLevelMethod(methodCode: string): string {
    const method = (this.alcoholMethodsOptions || []).find(m => m.methodCode === methodCode);
    return !!method ? method.methodDescription : '';
  }

  navigateToAmend(url: string): void {
    redirect(url);
  }
}
