import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Defendant,
  GroupedPlea,
  HearingDetail,
  Offence,
  OffenceType,
  VerdictType
} from '../../../core';
import {
  PdkBorderColorDirective,
  PdkTypographyDirective,
  PdkVisuallyHiddenDirective,
  PdkMarginDirective
} from '@cpp/pdk';

import { VerdictComponent } from './verdict.component';
import { DefendantNamePipe } from '../../../shared/pipes/defendant-name.pipe';

@Component({
  selector: 'verdict-group',
  template: `
    <div data-role="offence-pleas">
      <hr pdk-border-colour="light-grey" />
      <h2 pdk-typography="heading-medium">
        <span pdk-visually-hidden>Case reference: </span>
        {{ plea.caseURN }}
      </h2>
      @for (offence of plea.withCount; track $index) {
      <div data-test-id="offenceVerdict">
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
        <div>
          <h4 data-test-id="defendantName" pdk-typography="heading-small" pdk-margin-bottom="3">
            {{ defendant | defendantName }}
          </h4>
          <verdict
            [offence]="defendant.offences[0]"
            [defendant]="defendant"
            [hasCivilCase]="hasCivilCase"
            [hearingType]="hearingType"
            (updateVerdict)="updateVerdict.emit($event)"
            [allVerdictTypes]="allVerdictTypes"
            [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction"
            [currentHearingDetail]="currentHearingDetail"
          >
          </verdict>
          <hr pdk-border-colour="light-grey" />
        </div>
        }
      </div>
      } @if (plea.withCount?.length > 0) {
      <h2 pdk-typography="heading-medium">Further offences</h2>
      } @for (defendant of plea.withoutCount; track defendant.id) {
      <div data-test-id="offenceVerdict">
        <h4 data-test-id="defendantName" pdk-typography="heading-small" pdk-margin-bottom="3">
          {{ defendant | defendantName }}
        </h4>
        @for (offence of defendant.offences; track offence.id) {
        <div>
          <h3 data-test-id="offenceTitle" pdk-typography="heading-small" pdk-margin-bottom="3">
            Offence {{ offence.orderIndex }} - {{ offence.offenceTitle }}
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
          }
          <verdict
            [offence]="offence"
            [defendant]="defendant"
            [hasCivilCase]="hasCivilCase"
            [hearingType]="hearingType"
            (updateVerdict)="updateVerdict.emit($event)"
            (updateDefendantOffence)="updateDefendantOffence.emit($event)"
            [allVerdictTypes]="allVerdictTypes"
            [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction"
            [currentHearingDetail]="currentHearingDetail"
          >
          </verdict>
          <hr pdk-border-colour="light-grey" />
        </div>
        }
      </div>
      }
    </div>
  `,
  imports: [
    PdkBorderColorDirective,
    PdkTypographyDirective,
    PdkVisuallyHiddenDirective,
    PdkMarginDirective,
    VerdictComponent,
    DefendantNamePipe
  ]
})
export class VerdictGroupComponent {
  @Input() plea: GroupedPlea;
  @Input() hasCivilCase: boolean;
  @Input() hearingType: string;
  @Input() allVerdictTypes: VerdictType[];
  @Input() verdictTypesForHearingJurisdiction: VerdictType[];
  @Input() currentHearingDetail: HearingDetail;
  @Output() updateVerdict = new EventEmitter<{ offence: Offence; defendant: Defendant }>();
  @Output() updateDefendantOffence = new EventEmitter<{
    offence: Offence;
    defendant: Defendant;
    offenceType: OffenceType;
  }>();
}
