import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { LinkType } from '@cpp/reference-data';
import { isEmpty } from 'lodash-es';
import {
  CourtApplication,
  VerdictType,
  LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE,
  HearingDetail
} from '../../core/model';
import {
  PdkGridComponent,
  PdkGridDirective,
  PdkPaddingDirective,
  PdkTextColorDirective,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkLinkDirective,
  PdkBorderColorDirective
} from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { RouterLink } from '@angular/router';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { ApplicationOffenceComponent } from './application-offence.component';
import { TranslatePipe } from '@ngx-translate/core';
import { CPPDatePipe } from '../../shared/pipes/cpp-date.pipe';
import { VerdictTypeDescriptionPipe } from '../../shared/pipes/verdict-type-description.pipe';

@Component({
  selector: 'application-results',
  template: `
    <pdk-grid container>
      <pdk-grid full pdk-padding-bottom="4">
        <div pdk-text-colour="dark-grey">
          {{ 'APPLICATION.REFERENCE' | translate }}
        </div>
        <div>
          <h4 pdk-typography="heading-small" pdk-margin-bottom="0">
            {{ courtApplication.applicationReference }}
          </h4>
        </div>
      </pdk-grid>
    </pdk-grid>
    <pdk-grid container>
      <pdk-grid one-third>
        <span data-test-id="applicationType">{{ courtApplication.type.type }}</span>
        <div pdk-text-colour="dark-grey" pdk-margin-top="2" pdk-typography="body-small">
          {{ 'APPLICATION.DUE_ON' | translate }}
          {{ courtApplication.applicationReceivedDate | cppDate : 'DD MMMM YYYY' }}
        </div>

        @if (hasAmendApplication) {
        <!-- Pleas -->
        <div pdk-margin-top="6" pdk-margin-bottom="6">
          <pdk-grid container>
            <pdk-grid full class="bold">
              {{ 'MANAGE_HEARING.PLEA' | translate }}
            </pdk-grid>
          </pdk-grid>
          @if (hasPlea) {
          <div>
            <pdk-grid container>
              <pdk-grid two-thirds [attr.data-role]="'offence-plea'">
                <span data-test-id="indicatedPlea">{{
                  pleasMapping[courtApplication.plea.pleaValue] ||
                    pleasMapping[courtApplication.indicatedPlea.indicatedPleaValue]
                }}</span>
              </pdk-grid>
              <pdk-grid one-third class="action-bar-column">
                @if (isPleaApplicableFlag) {
                <a
                  [attr.aria-label]="'Change plea for ' + courtApplication.type.type"
                  pdk-link
                  unvisited
                  pdk-text-colour="blue"
                  pageScroll
                  [pageScrollOffset]="50"
                  routerLink="./enter-pleas"
                  href="#{{ courtApplication.id }}"
                >
                  {{ 'COMMON.CHANGE' | translate }}
                </a>
                }
              </pdk-grid>
            </pdk-grid>
            <pdk-grid container>
              <pdk-grid two-thirds>
                <span class="date-message" pdk-text-colour="dark-grey">
                  {{ 'MANAGE_HEARING.PLEA_ENTERED_ON' | translate }}
                  {{
                    courtApplication.plea.pleaDate ||
                      courtApplication.indicatedPlea.indicatedPleaDate | date : 'dd MMMM yyyy'
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
          } @if (!hasPlea) {
          <pdk-grid container>
            <pdk-grid two-thirds>
              {{ 'MANAGE_HEARING.NO_PLEA_ENTERED' | translate }}
            </pdk-grid>
            <pdk-grid one-third class="action-bar-column">
              @if (isPleaApplicableFlag) {
              <a
                [attr.aria-label]="'Enter plea for ' + courtApplication.type.type"
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
              {{ courtApplication.verdict.verdictType | verdictTypeDescription : verdictTypes }}
            </pdk-grid>
            <pdk-grid one-third class="text-right">
              @if (isVerdictsPageAvailable && canChangeVerdict) {
              <a
                [attr.aria-label]="'Change verdict for ' + courtApplication.type.type"
                pdk-link
                unvisited
                pdk-text-colour="blue"
                role="link"
                pageScroll
                [pageScrollOffset]="50"
                routerLink="./enter-verdicts"
                href="#{{ courtApplication.id }}"
                data-test-id="application-change-verdict"
              >
                {{ 'COMMON.CHANGE' | translate }}
              </a>
              }
            </pdk-grid>
            } @if (isVerdictLesserOffence) {
            <pdk-grid full>
              {{ courtApplication.verdict?.lesserOrAlternativeOffence?.offenceTitle }}
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
                [attr.aria-label]="'Enter verdict for ' + courtApplication.type.type"
                pdk-link
                unvisited
                pdk-text-colour="blue"
                role="link"
                pageScroll
                [pageScrollOffset]="50"
                routerLink="./enter-verdicts"
                href="#{{ courtApplication.id }}"
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
        }
      </pdk-grid>

      <pdk-grid two-thirds>
        <div pdk-margin-bottom="6">
          <cpp-shareable-results-container
            [applicationId]="courtApplication.id"
            [showResultsPlaceholder]="true"
            [isCourtApplicationFinalised]="courtApplication.applicationStatus === 'FINALISED'"
            [isAmendmentAllowed]="courtApplication?.amendmentAllowed"
            [amendApplicationPermission]="amendApplicationPermission"
            [applicationCaseStatus]="applicationCaseStatus"
          ></cpp-shareable-results-container>
        </div>
      </pdk-grid>
    </pdk-grid>

    <pdk-grid container>
      <pdk-grid one-third>&nbsp;</pdk-grid>
      @if (!!!courtApplication?.courtOrder?.courtOrderOffences) {
      <pdk-grid two-thirds>
        <hr class="border" pdk-border-colour="mid-grey" />
      </pdk-grid>
      }
    </pdk-grid>
    @if (linkTypeIsNotFirstHearing) {
    <pdk-grid container>
      <pdk-grid full>
        @if (hasOffences) { @for ( caseDetails of courtApplication.courtApplicationCases; track
        caseDetails.prosecutionCaseId ) {
        <div>
          @for (offence of caseDetails.offences; track offence.id) {
          <application-offence
            [caseId]="caseDetails.prosecutionCaseId"
            [offence]="offence"
            [masterDefendantId]="courtApplication.subject.masterDefendant.masterDefendantId"
            [prosecutionCaseIdentifier]="caseDetails.prosecutionCaseIdentifier"
            [hearingType]="hearingType"
            [pleasMapping]="pleasMapping"
            [guiltyPleasValues]="guiltyPleasValues"
            [verdictTypes]="verdictTypes"
            [isPleaApplicableFlag]="isPleaApplicableFlag"
            [isVerdictsPageAvailable]="isVerdictsPageAvailable"
            (onGoToEnterResult)="onGoToEnterResult.emit()"
          >
          </application-offence>
          <pdk-grid container>
            <pdk-grid one-third>&nbsp;</pdk-grid>
            <pdk-grid two-thirds>
              <hr class="border" pdk-border-colour="mid-grey" />
            </pdk-grid>
          </pdk-grid>
          }
        </div>
        } } @if (courtApplication?.courtOrder) {
        <div>
          @for ( offenceDetails of courtApplication.courtOrder.courtOrderOffences; track
          offenceDetails.offence.id ) {
          <application-offence
            [caseId]="offenceDetails.prosecutionCaseId"
            [showCaseUrn]="false"
            [masterDefendantId]="courtApplication.subject.masterDefendant.masterDefendantId"
            [offence]="offenceDetails.offence"
            [prosecutionCaseIdentifier]="offenceDetails.prosecutionCaseIdentifier"
            [hearingType]="hearingType"
            [pleasMapping]="pleasMapping"
            [guiltyPleasValues]="guiltyPleasValues"
            [verdictTypes]="verdictTypes"
            [isPleaApplicableFlag]="isPleaApplicableFlag"
            [isVerdictsPageAvailable]="isVerdictsPageAvailable"
            (onGoToEnterResult)="onGoToEnterResult.emit()"
          >
          </application-offence>
          <pdk-grid container>
            <pdk-grid one-third>&nbsp;</pdk-grid>
            <pdk-grid two-thirds>
              <hr class="border" pdk-border-colour="mid-grey" />
            </pdk-grid>
          </pdk-grid>
          }
        </div>
        }
      </pdk-grid>
    </pdk-grid>
    }
  `,
  styles: [
    `
      .border {
        border: 0;
        border-top: 1px solid;
        height: 1px;
        display: block;
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
    PdkTextColorDirective,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkLinkDirective,
    NgxPageScrollModule,
    RouterLink,
    ShareableResultsContainerComponent,
    PdkBorderColorDirective,
    ApplicationOffenceComponent,
    DatePipe,
    TranslatePipe,
    CPPDatePipe,
    VerdictTypeDescriptionPipe
  ]
})
export class ApplicationResultsComponent implements OnChanges {
  readonly BY_JURY = 'BY_JURY';

  @Input() courtApplication: CourtApplication;
  @Input() hearingType: string;
  @Output() onGoToEnterResult: EventEmitter<void> = new EventEmitter();
  @Input() pleasMapping: { [key: string]: string } = {};
  @Input() guiltyPleasValues: string[] = [];
  @Input() verdictTypes: VerdictType[];
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() hearing: HearingDetail;
  @Input() amendApplicationPermission: boolean;
  @Input() applicationCaseStatus: string;
  hasAmendApplication = false;

  ngOnChanges(_: SimpleChanges) {
    this.hasAmendApplication = this.courtApplication?.type?.pleaApplicableFlag ? true : false;
    if (this.amendApplicationPermission) {
      this.hasAmendApplication =
        this.courtApplication?.type?.pleaApplicableFlag &&
        (this.courtApplication.applicationStatus !== 'FINALISED' ||
          (this.courtApplication.applicationStatus === 'FINALISED' &&
            this.courtApplication?.amendmentAllowed));
    }
  }

  get hasOffences(): boolean {
    if (
      this.courtApplication.courtApplicationCases &&
      this.courtApplication.courtApplicationCases.length
    ) {
      return this.courtApplication.courtApplicationCases.some(c => c.offences && c.offences.length);
    }

    if (
      this.courtApplication.courtOrder &&
      this.courtApplication.courtOrder.courtOrderOffences &&
      this.courtApplication.courtOrder.courtOrderOffences.length
    ) {
      return true;
    }

    return false;
  }

  get linkTypeIsNotFirstHearing(): boolean {
    return this.courtApplication.type.linkType !== LinkType.FIRST_HEARING;
  }

  get hasPlea(): boolean {
    const { plea, indicatedPlea } = this.courtApplication;
    let hasPlea: boolean;
    let hasIndicatedPlea: boolean;
    if (plea) {
      const { pleaValue, pleaDate } = plea;
      hasPlea = !!pleaValue && !!pleaDate;
    }
    if (indicatedPlea) {
      const { indicatedPleaValue, indicatedPleaDate } = indicatedPlea;
      hasIndicatedPlea = !!indicatedPleaValue && !!indicatedPleaDate;
    }
    return hasPlea || hasIndicatedPlea;
  }

  get hasConvictionDatePlea(): boolean {
    return this.courtApplication.convictionDate && this.hasGuiltyPlea;
  }

  get hasGuiltyPlea(): boolean {
    const { plea, indicatedPlea } = this.courtApplication;
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
    return this.courtApplication.convictionDate;
  }

  get hasConvictedVerdict(): boolean {
    const { verdict } = this.courtApplication;
    return (
      verdict.verdictType &&
      verdict.verdictType.category &&
      verdict.verdictType.category === 'Guilty' &&
      !verdict.isDeleted
    );
  }

  get hasConvictionDateVerdict(): boolean {
    return this.courtApplication.convictionDate && this.hasConvictedVerdict;
  }

  get isVerdictTypeByJury(): boolean {
    const { verdict } = this.courtApplication;
    return verdict && verdict.verdictType.categoryType.includes(this.BY_JURY);
  }

  get hasUnanimousVerdict(): boolean {
    const { verdict } = this.courtApplication;
    return !verdict.isDeleted && this.courtApplication.verdict.jurors.numberOfSplitJurors === 0;
  }

  get hasMajorityVerdict(): boolean {
    const { verdict } = this.courtApplication;
    return !verdict.isDeleted && this.courtApplication.verdict.jurors.numberOfSplitJurors > 0;
  }

  get numberOfJurors(): number {
    return this.courtApplication.verdict.jurors.numberOfJurors || 12;
  }

  get numberOfSplitJurors(): number {
    return this.courtApplication.verdict.jurors.numberOfSplitJurors || 0;
  }

  get verdictDate(): string {
    const { verdict } = this.courtApplication;
    return verdict.verdictDate;
  }

  get hasVerdict(): boolean {
    const { verdict } = this.courtApplication;
    return (
      verdict && !isEmpty(verdict.verdictType) && !!verdict.verdictType.id && !verdict.isDeleted
    );
  }

  // Added condition to exclude guilty of lesser or alternative offence because categoryType has changed in RefData
  // https://codereview.mdv.cpp.nonlive/c/cpp.static-data.patches/+/139146
  get hasVerdictDate(): boolean {
    const { verdict } = this.courtApplication;
    return (
      verdict &&
      verdict.verdictDate &&
      verdict.verdictType.categoryType.includes('NOT_GUILTY') &&
      verdict.verdictType.cjsVerdictCode !== LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE &&
      !verdict.isDeleted
    );
  }

  get isVerdictLesserOffence(): boolean {
    const { verdict } = this.courtApplication;
    const verdictType = (this.verdictTypes || []).find(({ id }) => id === verdict.verdictType.id);
    return !!verdictType
      ? verdictType.cjsVerdictCode === LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE &&
          !verdict.isDeleted
      : false;
  }

  get canChangeVerdict(): boolean {
    const { verdict } = this.courtApplication;
    const verdictType = (this.verdictTypes || []).find(({ id }) => id === verdict.verdictType.id);
    if (!verdictType) {
      return true;
    }
    if (verdictType.jurisdiction === this.hearing.jurisdictionType) {
      return true;
    }
    return false;
  }
}
