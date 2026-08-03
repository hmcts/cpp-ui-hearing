import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { isEmpty } from 'lodash-es';
import {
  LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE,
  Offence,
  VerdictType
} from '../../core/model';
import { ProsecutionCaseIdentifier } from '../../core/model/shared/prosecution-case-identifier';
import {
  PdkGridComponent,
  PdkGridDirective,
  PdkPaddingDirective,
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkTypographyDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { RouterLink } from '@angular/router';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { TranslatePipe } from '@ngx-translate/core';
import { CPPDatePipe } from '../../shared/pipes/cpp-date.pipe';
import { VerdictTypeDescriptionPipe } from '../../shared/pipes/verdict-type-description.pipe';

@Component({
  selector: 'application-offence',
  template: `
    <pdk-grid container pdk-padding-bottom="4">
      @if (showCaseUrn) {
      <pdk-grid full pdk-margin-bottom="4">
        <b>
          {{
            prosecutionCaseIdentifier.caseURN ||
              prosecutionCaseIdentifier.prosecutionAuthorityReference
          }}
        </b>
      </pdk-grid>
      }
      <pdk-grid one-third>
        <div class="offence-index" pdk-margin-right="2">
          @if (offence.count && hearingType === 'CROWN') { Count {{ offence.count }} - } @if
          (!offence.count || hearingType === 'MAGISTRATES') { {{ offence.orderIndex }}. }
        </div>
        <span data-test-id="offenceTitle">{{ offence.offenceTitle }}</span>

        <div pdk-text-colour="dark-grey" pdk-typography="body-small" pdk-margin-top="2">
          <div>On {{ offence.chargeDate | cppDate : 'DD MMMM YYYY' }}</div>
        </div>

        <!-- Pleas -->
        <div pdk-margin-top="6" pdk-margin-bottom="6">
          <pdk-grid container>
            <pdk-grid full class="bold">
              {{ 'MANAGE_HEARING.PLEA' | translate }}
            </pdk-grid>
          </pdk-grid>

          @if (!!pleaValue) {
          <div>
            <pdk-grid container>
              <pdk-grid two-thirds [attr.data-role]="'offence-plea'">
                <span data-test-id="indicatedPlea">{{ pleaValue }}</span>
              </pdk-grid>

              <pdk-grid one-third class="action-bar-column">
                @if (isPleaApplicableFlag) {
                <a
                  [attr.aria-label]="'Change plea for ' + offence.offenceTitle"
                  pdk-link
                  unvisited
                  pdk-text-colour="blue"
                  pageScroll
                  [pageScrollOffset]="50"
                  routerLink="./enter-pleas"
                  href="#{{ offence.id }}"
                >
                  {{ 'COMMON.CHANGE' | translate }}
                </a>
                }
              </pdk-grid>
            </pdk-grid>

            <pdk-grid container>
              <pdk-grid two-thirds>
                <span class="date-message" pdk-text-colour="dark-grey" pdk-text-colour="dark-grey">
                  {{ 'MANAGE_HEARING.PLEA_ENTERED_ON' | translate }}
                  {{
                    offence.plea.pleaDate || offence.indicatedPlea.indicatedPleaDate
                      | date : 'dd MMMM yyyy'
                  }}
                </span>
              </pdk-grid>
              <pdk-grid one-third></pdk-grid>
            </pdk-grid>

            @if (hasConvictionDatePlea) {
            <span class="date-message" pdk-text-colour="dark-grey">
              {{ 'MANAGE_HEARING.CONVICTED_ON' | translate }}
              {{ convictionDate | date : 'dd MMMM yyyy' }}
            </span>
            }
          </div>
          } @if (!pleaValue) {
          <pdk-grid container>
            <pdk-grid two-thirds>
              {{ 'MANAGE_HEARING.NO_PLEA_ENTERED' | translate }}
            </pdk-grid>
            <pdk-grid one-third class="action-bar-column">
              @if (isPleaApplicableFlag) {
              <a
                [attr.aria-label]="'Enter plea for ' + offence.offenceTitle"
                pdk-link
                unvisited
                class="link"
                routerLink="./enter-pleas"
                >{{ 'COMMON.ENTER' | translate }}</a
              >
              }
            </pdk-grid>
          </pdk-grid>
          }
        </div>
        <!-- Plea end -->

        <!-- Allocation decision -->
        @if (offence.allocationDecision) {
        <div>
          @if (offence.allocationDecision.motReasonDescription) {
          <div pdk-margin-bottom="4">
            <pdk-grid container>
              <pdk-grid full class="bold">
                {{ 'MANAGE_HEARING.ALLOCATION_DECISION' | translate }}
              </pdk-grid>
            </pdk-grid>

            <div>
              <pdk-grid container>
                <pdk-grid
                  two-thirds
                  data-role="offence-allocation-decision"
                  class="allocation-decision"
                >
                  {{ offence.allocationDecision.motReasonDescription }}
                </pdk-grid>
              </pdk-grid>
              <pdk-grid container>
                <pdk-grid two-thirds>
                  @if (offence?.allocationDecision?.allocationDecisionDate) {
                  <span class="date-message" pdk-text-colour="dark-grey">
                    {{ 'MANAGE_HEARING.ALLOCATION_DECISION_RECORDED_ON' | translate }}
                    {{ offence.allocationDecision.allocationDecisionDate | date : 'dd MMMM yyyy' }}
                  </span>
                  }
                </pdk-grid>
              </pdk-grid>
            </div>
          </div>
          }
          <!-- Sentencing decision -->
          @if (offence.allocationDecision.courtIndicatedSentence) {
          <div>
            @if ( offence.allocationDecision.courtIndicatedSentence
            .courtIndicatedSentenceDescription ) {
            <div pdk-margin-bottom="4">
              <pdk-grid container>
                <pdk-grid full class="bold">
                  {{ 'MANAGE_HEARING.SENTENCING_INDICATION' | translate }}
                </pdk-grid>
              </pdk-grid>

              <div>
                <pdk-grid container>
                  <pdk-grid
                    two-thirds
                    data-role="offence-sentencing-decision"
                    class="sentencing-decision"
                  >
                    {{
                      offence.allocationDecision.courtIndicatedSentence
                        .courtIndicatedSentenceDescription
                    }}
                  </pdk-grid>
                </pdk-grid>
              </div>
            </div>
            }
          </div>
          }
        </div>
        }
        <!-- Verdicts -->
        @if (!hasGuiltyPlea) {
        <div pdk-margin-bottom="6">
          <pdk-grid container>
            <pdk-grid one-third class="bold">
              {{ 'MANAGE_HEARING.VERDICT' | translate }}
            </pdk-grid>

            @if (isVerdictTypeByJury) {
            <pdk-grid two-thirds class="jurors-column">
              @if (hasUnanimousVerdict && hearingType === 'CROWN') {
              <span class="bold"> {{ 'MANAGE_HEARING.UNANIMOUS' | translate }}. </span>
              } @if (hasMajorityVerdict) {
              <span>
                <span>{{ 'MANAGE_HEARING.MAJORITY_VERDICT' | translate }}</span>
                <span>{{ numberOfJurors - numberOfSplitJurors }}:</span>
                <span>{{ numberOfSplitJurors }}.</span>
              </span>
              } @if (hearingType === 'CROWN') {
              <span class="jurors-numbers" pdk-text-colour="dark-grey">({{ numberOfJurors }})</span>
              }
            </pdk-grid>
            }
          </pdk-grid>
          <pdk-grid container>
            @if (hasVerdict) {
            <pdk-grid two-thirds data-test-id="verdict" data-role="offence-verdict">
              {{ offence.verdict.verdictType | verdictTypeDescription : verdictTypes }}
            </pdk-grid>
            <pdk-grid one-third class="text-right">
              @if (isVerdictsPageAvailable) {
              <a
                [attr.aria-label]="'Change verdict for ' + offence.offenceTitle"
                pdk-link
                unvisited
                pdk-text-colour="blue"
                role="link"
                pageScroll
                [pageScrollOffset]="50"
                routerLink="./enter-verdicts"
                href="#{{ offence.id }}"
              >
                {{ 'COMMON.CHANGE' | translate }}
              </a>
              }
            </pdk-grid>
            } @if (isVerdictLesserOffence) {
            <pdk-grid full>
              {{ offence.verdict?.lesserOrAlternativeOffence?.offenceTitle }}
            </pdk-grid>
            } @if (hasVerdictDate) {
            <pdk-grid two-thirds>
              <span class="date-message" pdk-text-colour="dark-grey">
                {{ 'MANAGE_HEARING.VERDICT_ENTERED_ON' | translate }}
                {{ verdictDate | date : 'dd MMMM yyyy' }}
              </span>
            </pdk-grid>
            }
          </pdk-grid>

          @if (hasConvictionDateVerdict) {
          <span class="date-message" pdk-text-colour="dark-grey">
            {{ 'MANAGE_HEARING.CONVICTED_ON' | translate }}
            {{ convictionDate | date : 'dd MMMM yyyy' }}
          </span>
          } @if (!hasVerdict) {
          <pdk-grid container>
            <pdk-grid two-thirds>
              {{ 'MANAGE_HEARING.NO_VERDICT_ENTERED' | translate }}
            </pdk-grid>

            <pdk-grid one-third class="action-bar-column">
              @if (isVerdictsPageAvailable) {
              <a
                [attr.aria-label]="'Enter verdict for ' + offence.offenceTitle"
                pdk-link
                unvisited
                pdk-text-colour="blue"
                role="link"
                pageScroll
                [pageScrollOffset]="50"
                routerLink="./enter-verdicts"
                href="#{{ offence.id }}"
              >
                {{ 'COMMON.ENTER' | translate }}
              </a>
              }
            </pdk-grid>
          </pdk-grid>
          }
        </div>
        }
        <!-- Verdicts end -->
      </pdk-grid>

      <pdk-grid two-thirds>
        <!-- Results -->
        <div>
          <cpp-shareable-results-container
            [offenceId]="offence.id"
            [showResultsPlaceholder]="true"
            [showCaseLevelOffences]="true"
          ></cpp-shareable-results-container>
        </div>
        <!-- Results End -->
      </pdk-grid>
    </pdk-grid>
  `,
  styles: [
    `
      .offence-index {
        float: left;
        width: 30px;
      }

      .action-bar-column {
        text-align: right;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkGridComponent,
    PdkGridDirective,
    PdkPaddingDirective,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    NgxPageScrollModule,
    RouterLink,
    ShareableResultsContainerComponent,
    DatePipe,
    TranslatePipe,
    CPPDatePipe,
    VerdictTypeDescriptionPipe
  ]
})
export class ApplicationOffenceComponent {
  readonly BY_JURY = 'BY_JURY';

  @Input() caseId: string;
  @Input() masterDefendantId: string;
  @Input() offence: Offence;
  @Input() prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  @Input() hearingType: string;
  @Input() pleasMapping: { [key: string]: string } = {};
  @Input() guiltyPleasValues: string[] = [];
  @Input() verdictTypes: VerdictType[];
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() showCaseUrn = true;
  @Output() onGoToEnterResult: EventEmitter<void> = new EventEmitter();

  get pleaValue(): string {
    const { plea, indicatedPlea } = this.offence;
    if (plea) {
      const { pleaValue, pleaDate } = plea;
      if (!!pleaValue && !!pleaDate) {
        return this.pleasMapping[pleaValue];
      }
    }
    if (indicatedPlea) {
      const { indicatedPleaValue, indicatedPleaDate } = indicatedPlea;
      if (!!indicatedPleaValue && !!indicatedPleaDate) {
        return this.pleasMapping[indicatedPleaValue];
      }
    }
    return undefined;
  }

  get hasConvictionDatePlea(): boolean {
    return this.offence.convictionDate && this.hasGuiltyPlea;
  }

  get hasGuiltyPlea(): boolean {
    const { plea, indicatedPlea } = this.offence;
    let hasGuiltyPlea: boolean;
    let hasGuiltyIndicatedPlea: boolean;
    if (plea) {
      hasGuiltyPlea =
        plea && this.guiltyPleasValues.some(guiltyPlea => guiltyPlea === plea.pleaValue);
    }
    if (indicatedPlea) {
      hasGuiltyIndicatedPlea =
        indicatedPlea && indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY';
    }
    return hasGuiltyPlea || hasGuiltyIndicatedPlea;
  }

  get convictionDate(): string {
    return this.offence.convictionDate;
  }

  get hasConvictedVerdict(): boolean {
    const { verdict } = this.offence;
    return (
      verdict &&
      verdict.verdictType &&
      verdict.verdictType.category &&
      verdict.verdictType.category === 'Guilty' &&
      !verdict.isDeleted
    );
  }

  get hasConvictionDateVerdict(): boolean {
    return this.offence.convictionDate && this.hasConvictedVerdict;
  }

  get isVerdictTypeByJury(): boolean {
    const { verdict } = this.offence;
    return verdict && verdict.verdictType.categoryType.includes(this.BY_JURY);
  }

  get hasUnanimousVerdict(): boolean {
    const { verdict } = this.offence;
    return !verdict.isDeleted && this.offence.verdict.jurors.numberOfSplitJurors === 0;
  }

  get hasMajorityVerdict(): boolean {
    const { verdict } = this.offence;
    return !verdict.isDeleted && this.offence.verdict.jurors.numberOfSplitJurors > 0;
  }

  get numberOfJurors(): number {
    return this.offence.verdict.jurors.numberOfJurors || 12;
  }

  get numberOfSplitJurors(): number {
    return this.offence.verdict.jurors.numberOfSplitJurors || 0;
  }

  get verdictDate(): string {
    const { verdict } = this.offence;
    return verdict.verdictDate;
  }

  get hasVerdict(): boolean {
    const { verdict } = this.offence;
    return (
      verdict && !isEmpty(verdict.verdictType) && !!verdict.verdictType.id && !verdict.isDeleted
    );
  }

  // Added condition to exclude guilty of lesser or alternative offence because categoryType has changed in RefData
  // https://codereview.mdv.cpp.nonlive/c/cpp.static-data.patches/+/139146
  get hasVerdictDate(): boolean {
    const { verdict } = this.offence;
    return (
      verdict &&
      verdict.verdictDate &&
      verdict.verdictType.categoryType.includes('NOT_GUILTY') &&
      verdict.verdictType.cjsVerdictCode !== LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE &&
      !verdict.isDeleted
    );
  }

  get isVerdictLesserOffence(): boolean {
    const { verdict } = this.offence;
    const verdictType = (this.verdictTypes || []).find(({ id }) => id === verdict.verdictType.id);
    return !!verdictType
      ? verdictType.cjsVerdictCode === LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE &&
          !verdict.isDeleted
      : false;
  }
}
