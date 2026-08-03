import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Action } from '@ngrx/store';
import {
  PdkBorderColorDirective,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkLinkDirective,
  PdkButtonGroupComponent,
  PdkMarginDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';

@Component({
  selector: 'cpp-draft-result-action-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="draft-result-action-bar draft-result-action-bar--sticky"
      pdk-border-colour="mid-grey"
      pdk-fill-colour="light-grey"
      pdk-padding-horizontal="3"
    >
      <div>
        @if (draftResultError) {
        <div data-test-id="draftResultError">
          There was an error saving the draft results.
          <a
            pdk-link
            href="javascript:void(0)"
            (click)="retryFailedAction.emit(draftResultError.action)"
            >Retry</a
          >
        </div>
        }
      </div>
      <pdk-button-group pdk-margin-top="3">
        <button pdk-margin-bottom="0" pdk-button (click)="submitAllParsers.emit()">
          Create draft results
        </button>
        <button
          [disabled]="!saveEnabled"
          pdk-button="secondary"
          pdk-margin-bottom="0"
          (click)="save.emit()"
        >
          Save and continue
        </button>
      </pdk-button-group>
    </div>
  `,
  styles: [
    `
      .draft-result-action-bar {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid;
        align-items: center;
      }
      .draft-result-action-bar--sticky {
        position: -webkit-sticky;
        position: sticky;
        top: 0;
        z-index: 1;
      }
    `
  ],
  imports: [
    PdkBorderColorDirective,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkLinkDirective,
    PdkButtonGroupComponent,
    PdkMarginDirective,
    PdkButtonComponent,
    PdkButtonDirective
  ]
})
export class DraftResultActionBarComponent {
  @Input() draftResultError: { action: Action } | null = null;
  @Input() draftResultSaving = false;
  @Input() saveEnabled = false;
  @Output() retryFailedAction = new EventEmitter<Action>();
  @Output() save = new EventEmitter();
  @Output() submitAllParsers = new EventEmitter();
}
