import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  Output,
  viewChildren
} from '@angular/core';
import { ControlContainer, FormsModule, NgForm, NgModel } from '@angular/forms';
import {
  PdkDetailsComponent,
  PdkDetailsSummary,
  PdkFieldsetComponent,
  PdkFormFieldComponent,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkRadio,
  PdkRadioButtonComponent,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { Defendant, Offence, PleaOption } from '../../../core';
import { OffenceSearchComponent } from '../../../shared/components/offence-search/offence-search.component';
import { DefendantNamePipe } from '../../../shared/pipes/defendant-name.pipe';
import { asapScheduler } from 'rxjs';

@Component({
  selector: 'plea-options',
  template: `
    <div>
      <pdk-form-field id="{{ offence.id }}" label="{{ label }}" labelType="small">
        <span pdk-visually-hidden>
          The following plea options are related to {{ defendant | defendantName }} for
          {{ offence.offenceTitle }}
        </span>
        <pdk-radio-group
          [ngClass]="{ 'plea-delegated-powers': isDelegatedPowers }"
          name="{{ type }}-{{ offence.id }}"
          data-role="defendant-pleas"
          [ngModel]="defaultPleaValue"
          (ngModelChange)="pleaSelected.emit($event)"
          [disabled]="disabled"
        >
          @if (hasCivilCase && civilCasePleaOptions?.length) {
          <div pdk-margin-bottom="6">
            @for (civilCasePleaOption of civilCasePleaOptions; track civilCasePleaOption.value) {
            <pdk-radio-button [value]="civilCasePleaOption.value">
              {{ civilCasePleaOption.label }}
            </pdk-radio-button>
            @if (isGuiltyToLesserOffence && pleaOptionIsSelected(civilCasePleaOption)) {
            <ng-template
              [ngTemplateOutlet]="isGuiltyToLesserOffenceTemplate"
              [ngTemplateOutletContext]="{
                      offence: offence,
                    }"
            >
            </ng-template>
            } }
          </div>
          } @else {
          <div pdk-margin-bottom="6">
            @for (standardOption of standardPleaOptions; track standardOption.value) {
            <pdk-radio-button [value]="standardOption.value">
              {{ standardOption.label }}
            </pdk-radio-button>
            } @for (otherOption of additionalOptions; track otherOption.value) { @if
            (pleaOptionIsSelected(otherOption)) {
            <pdk-radio-button [value]="otherOption.value">
              {{ otherOption.label }}
            </pdk-radio-button>
            @if (isGuiltyToLesserOffence) {
            <ng-template
              [ngTemplateOutlet]="isGuiltyToLesserOffenceTemplate"
              [ngTemplateOutletContext]="{
                      offence: offence,
                    }"
            >
            </ng-template>
            } } }
          </div>
          }
        </pdk-radio-group>
      </pdk-form-field>
      @if (!hasCivilCase && magsPleaOnlyOptions.length) {
      <details pdk-details data-test-id="additional-mags-pleas">
        <summary id="additional-mags-pleas">
          <span>{{ 'ENTER_PLEAS.ADDITIONAL_MAGS_PLEAS' | translate }}</span>
          <span pdk-visually-hidden>&nbsp;{{ 'ENTER_PLEAS.FOR' | translate }}&nbsp;</span>
          <span pdk-visually-hidden>{{ offence.offenceTitle }}</span>
        </summary>
        <pdk-details-text>
          <fieldset pdk-fieldset aria-labelledby="additional-mags-pleas">
            <pdk-radio-group
              ngModel
              [ngModelOptions]="{ standalone: true }"
              #additionalMagsPleaRadioGroup="ngModel"
              (ngModelChange)="selectAdditionalPlea($event, additionalMagsPleaRadioGroup)"
            >
              @for (magsPleaOption of magsPleaOnlyOptions; track magsPleaOption.value) {

              <pdk-radio-button [value]="magsPleaOption.value">
                {{ magsPleaOption.label }}
              </pdk-radio-button>
              }
            </pdk-radio-group>
          </fieldset>
        </pdk-details-text>
      </details>
      } @if (hearingType === 'CROWN' && crownPleaOnlyOptions.length) {
      <details pdk-details>
        <summary id="additional-crown-pleas">
          <span>{{ 'ENTER_PLEAS.ADDITIONAL_CC_PLEAS' | translate }}</span>
          <span pdk-visually-hidden>&nbsp;{{ 'ENTER_PLEAS.FOR' | translate }}&nbsp;</span>
          <span pdk-visually-hidden>{{ offence.offenceTitle }}</span>
        </summary>
        <pdk-details-text>
          <fieldset pdk-fieldset aria-labelledby="additional-crown-pleas">
            <pdk-radio-group
              ngModel
              [ngModelOptions]="{ standalone: true }"
              #additionalCrownPleaRadioGroup="ngModel"
              (ngModelChange)="selectAdditionalPlea($event, additionalCrownPleaRadioGroup)"
            >
              @for ( crownCourtPleaOption of crownPleaOnlyOptions; track crownCourtPleaOption.value
              ) {

              <pdk-radio-button [value]="crownCourtPleaOption.value">
                {{ crownCourtPleaOption.label }}
              </pdk-radio-button>
              }
            </pdk-radio-group>
          </fieldset>
        </pdk-details-text>
      </details>
      }
      <a pdk-link unvisited data-role="clear-plea" href="javascript:void(0);" (click)="clear()">
        Clear selection
      </a>
    </div>
    <ng-template #isGuiltyToLesserOffenceTemplate let-offence="offence">
      @if (isGuiltyToLesserOffence) {
      <pdk-radio-conditional>
        <pdk-form-field label="Lesser offence" id="{{ offence.id }}" labelType="none">
          <offence-search
            [selectedOffenceCode]="offence.plea?.lesserOrAlternativeOffence?.offenceCode"
            [ngModel]="offence.plea.value?.lesserOffence"
            (ngModelChange)="onUpdateLesserOrAlternativeOffence.emit($event)"
            name="lesserOffence-{{ offence.id }}"
          >
          </offence-search>
        </pdk-form-field>
      </pdk-radio-conditional>
      }
    </ng-template>
  `,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    NgTemplateOutlet,
    FormsModule,
    TranslatePipe,
    PdkFormFieldComponent,
    PdkVisuallyHiddenDirective,
    PdkRadio,
    PdkLinkDirective,
    DefendantNamePipe,
    OffenceSearchComponent,
    PdkDetailsSummary,
    PdkMarginDirective,
    PdkFieldsetComponent
  ]
})
export class PleaOptionsComponent {
  @Input() hearingType: string;
  @Input() hasCivilCase: boolean;
  @Input() isDelegatedPowers: boolean;
  @Input() label: string;
  @Input() disabled = false;
  @Input() type = 'pleaType';
  @Input() standardPleaOptions: PleaOption[];
  @Input() additionalOptions: PleaOption[] = [];
  @Input() magsPleaOnlyOptions: PleaOption[] = [];
  @Input() crownPleaOnlyOptions: PleaOption[] = [];
  @Input() civilCasePleaOptions: PleaOption[] = [];
  @Input() offence: Offence;
  @Input() defaultPleaValue: string;
  @Input() selectedOffenceCode: string;
  @Input() isGuiltyToLesserOffence = false;
  @Input() defendant: Defendant;
  @Output() pleaSelected: EventEmitter<string> = new EventEmitter();
  @Output() onUpdateLesserOrAlternativeOffence: EventEmitter<PleaOption> = new EventEmitter();

  @Output() clearPlea: EventEmitter<void> = new EventEmitter();

  readonly injector = inject(Injector);

  detailsDirectives = viewChildren(PdkDetailsComponent, { read: ElementRef<HTMLDetailsElement> });
  pdkRadios = viewChildren(PdkRadioButtonComponent);
  additionalPleaseModel: string = null;

  selectAdditionalPlea(optionValue: string, model: NgModel): void {
    this.pleaSelected.emit(optionValue);
    if (this.detailsDirectives()?.length > 0) {
      this.detailsDirectives().forEach(details => (details.nativeElement.open = false));
    }
    asapScheduler.schedule(
      () => model.control.setValue(null, { emitEvent: false, emitViewToModelChange: false }),
      300
    );
  }

  pleaOptionIsSelected(option: { label: string; value: string }): boolean {
    return option.value === this.offence.plea.pleaValue;
  }

  clear(): void {
    this.clearPlea.emit();
  }
}
