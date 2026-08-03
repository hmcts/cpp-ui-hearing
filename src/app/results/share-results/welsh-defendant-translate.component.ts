import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  PDK_MODAL_DATA_TOKEN,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkTypographyDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkDetailsSummary,
  PdkCheckBox,
  PdkRadio,
  PdkForm
} from '@cpp/pdk';
import { IndividualDefendant, WelshDefendantTranslate } from '../../core';
import { FormsModule } from '@angular/forms';
import { FullNamePipe } from '../../shared/pipes/full-name.pipe';

interface FormValue {
  requireTranslation: boolean;
  toggleAll: boolean;
  defendantIds: string[];
}

export interface WelshDefendantTranslateData extends Record<string, unknown> {
  defendants: IndividualDefendant[];
  onSubmit: (formValue: WelshDefendantTranslate[]) => void;
  onCancel: () => void;
}

@Component({
  selector: 'welsh-defendant-translate-modal',
  template: `
    <div pdk-fill-colour="white" pdk-padding="6">
      <h2 pdk-typography="heading-xlarge">Do the notice(s) in this case require translation?</h2>

      <form
        #form="ngForm"
        pdk-form
        novalidate
        (validSubmit)="modalData.onSubmit(handlePayload(form.value))"
        data-test-id="requireTranslationForm"
      >
        <pdk-form-field label="Do any notices or orders require translation?" labelType="none">
          <pdk-radio-group name="requireTranslation" ngModel>
            <pdk-radio-button [value]="true"> Yes </pdk-radio-button>

            @if (!!form.value.requireTranslation) {
            <pdk-radio-conditional>
              @if (modalData.defendants.length > 1) {
              <a class="open-all" pdk-link href="javascript:void(0);" (click)="toggleDetailsOpen()">
                {{ isAllDetailsOpen ? 'Close all' : 'Open all' }}
              </a>
              }
              <pdk-form-field label="Select defendants require translation" labelType="none">
                <pdk-checkbox-group required name="defendantIds" [(ngModel)]="selectedDefendantIds">
                  @if (modalData.defendants.length > 1) {
                  <pdk-checkbox
                    name="toggleAll"
                    [ngModel]="selectedDefendantIds.length === modalData.defendants.length"
                    (ngModelChange)="toggleSelectAll()"
                  >
                    Select all
                  </pdk-checkbox>
                  } @for ( defendant of modalData.defendants; track defendant.defendantId; let i =
                  $index ) {
                  <pdk-checkbox [value]="defendant.defendantId">
                    <details
                      [open]="isDetailsOpenFor[i]"
                      (toggle)="isDetailsOpenFor[i] = $event.target.open"
                    >
                      <summary>{{ defendant | fullName : true }}</summary>

                      <p pdk-margin-top="3">Written - {{ defendant.documentationLanguageNeeds }}</p>

                      @if (defendant.interpreterLanguageNeeds) {
                      <p>Spoken - {{ defendant.interpreterLanguageNeeds }}</p>
                      }
                      <hr />
                    </details>
                  </pdk-checkbox>
                  }
                </pdk-checkbox-group>
              </pdk-form-field>
            </pdk-radio-conditional>
            }
            <pdk-radio-button [value]="false"> No </pdk-radio-button>
          </pdk-radio-group>
        </pdk-form-field>

        <div class="button-holder">
          <button pdk-button pdk-margin-bottom="0" type="submit" [disabled]="!form.touched">
            Continue
          </button>
          <a pdk-link pdk-margin-left="4" href="javascript:void(0);" (click)="modalData.onCancel()">
            Cancel
          </a>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      form {
        width: 320px;
        position: relative;
      }
      .open-all {
        position: absolute;
        right: 0;
        top: 10px;
        text-decoration: none;
      }
      summary {
        list-style: none;
        position: relative;
        display: flex;
        align-items: center;
        padding-right: 25px;
      }
      summary::-webkit-details-marker {
        display: none;
      }
      summary::after {
        content: ' +';
        position: absolute;
        right: 0;
        font-size: 30px;
        line-height: 25px;
      }
      summary span {
        text-decoration: none !important;
      }
      details[open] summary:after {
        content: ' –';
        line-height: 22px;
      }
      .button-holder {
        display: flex;
        align-items: center;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkCheckBox,
    PdkRadio,
    PdkForm,
    PdkDetailsSummary,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkTypographyDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkLinkDirective,
    PdkMarginDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    FullNamePipe
  ]
})
export class WelshDefendantTranslateComponent {
  isDetailsOpenFor: boolean[] = [];
  selectedDefendantIds: string[] = [];

  get isAllDetailsOpen() {
    return (
      this.isDetailsOpenFor.length === this.modalData.defendants.length &&
      this.isDetailsOpenFor.every(detail => detail)
    );
  }

  constructor(@Inject(PDK_MODAL_DATA_TOKEN) public modalData: WelshDefendantTranslateData) {}

  toggleDetailsOpen() {
    this.isDetailsOpenFor = this.isAllDetailsOpen ? [] : this.modalData.defendants.map(() => true);
  }

  toggleSelectAll() {
    this.selectedDefendantIds =
      this.selectedDefendantIds.length === this.modalData.defendants.length
        ? []
        : this.modalData.defendants.map(d => d.defendantId);
  }

  handlePayload({ defendantIds }: FormValue): WelshDefendantTranslate[] {
    return !defendantIds
      ? []
      : defendantIds.map(defendantId => ({ welshTranslation: true, defendantId }));
  }
}
