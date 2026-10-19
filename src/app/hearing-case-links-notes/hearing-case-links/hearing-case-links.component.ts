import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CourtApplication,
  getCaseIdFromApplication,
  HearingCaseLink,
  HearingCaseLinkType,
  isApplicationOnInactiveOffences,
  isStandaloneCourtApplication,
  ProsecutionCaseDetails
} from '../../core';
import { NgTemplateOutlet } from '@angular/common';
import {
  PdkVisuallyHiddenDirective,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkInsetTextComponent,
  PdkLinkDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

interface AddApplicationLink {
  applicationId: string;
  link: HearingCaseLink;
}

@Component({
  selector: 'hearing-case-links',
  template: `
    <div class="hearing-case-links">
      @if (!isStandAloneApplication) { @for (prosecutionCase of prosecutionCases; track
      prosecutionCase.id) {
      <div [attr.data-test-id]="getCaseReference(prosecutionCase)">
        <span pdk-visually-hidden>Case reference: </span>
        <h4 data-test-id="reference" pdk-typography="heading-small" pdk-margin-bottom="1">
          {{ getCaseReference(prosecutionCase) }}
        </h4>
        <pdk-inset-text pdk-margin-top="3">
          <div class="case-links">
            <a
              pdk-link
              href="javascript:void(0);"
              (click)="
                    onGoToCaseLink.emit({
                      caseId: prosecutionCase.id,
                      type: hearingCaseLinkType.CASE_AT_A_GLANCE,
                    })
                  "
            >
              {{ 'COMMON.CASE_AT_A_GLANCE' | translate }}
            </a>
            <a
              pdk-link
              href="javascript:void(0);"
              pdk-margin-top="2"
              (click)="
                    onGoToCaseLink.emit({
                      caseId: prosecutionCase.id,
                      type: hearingCaseLinkType.CASE_MATERIAL,
                    })
                  "
            >
              {{ 'COMMON.CASE_MATERIAL' | translate }}
            </a>
            <a
              pdk-link
              href="javascript:void(0);"
              pdk-margin-top="2"
              (click)="
                    onGoToCaseLink.emit({
                      caseId: prosecutionCase.id,
                      type: hearingCaseLinkType.ADD_APPLICATION,
                    })
                  "
            >
              {{ 'HEARING_LIST.GO_TO_ADD_APPLICATION' | translate }}
            </a>
            <a
              pdk-link
              href="javascript:void(0);"
              pdk-margin-top="2"
              (click)="goToCreateTask(prosecutionCase.prosecutionCaseIdentifier.caseURN)"
            >
              {{ 'HEARING_LIST.GO_TO_CREATE_TASK' | translate }}
            </a>
          </div>
        </pdk-inset-text>
      </div>
      } } @if (!prosecutionCases?.length) { @let addApplication = addApplicationLink; @for
      (application of courtApplications; track application.id) {
      <ng-template
        [ngTemplateOutlet]="applicationTemplate"
        [ngTemplateOutletContext]="{
            application: application,
            addLink: application.id === addApplication?.applicationId ? addApplication.link : null,
          }"
      >
      </ng-template>
      } }
      <ng-template #applicationTemplate let-application="application" let-addLink="addLink">
        <div [attr.data-test-id]="application.applicationReference">
          <span pdk-visually-hidden>Case reference: </span>
          <h4 data-test-id="reference" pdk-typography="heading-small" pdk-margin-bottom="1">
            {{ application.applicationReference }}
          </h4>
          <pdk-inset-text pdk-margin-top="3">
            <div class="case-links">
              <a
                pdk-link
                href="javascript:void(0);"
                (click)="
                  onGoToCaseLink.emit({
                    applicationId: application.id,
                    type: hearingCaseLinkType.APPLICATION_AT_A_GLANCE,
                  })
                "
              >
                {{ 'COMMON.CASE_AT_A_GLANCE' | translate }}
              </a>
              <a
                pdk-link
                href="javascript:void(0);"
                pdk-margin-top="2"
                (click)="
                  onGoToCaseLink.emit({
                    applicationId: application.id,
                    type: hearingCaseLinkType.APPLICATION_MATERIAL,
                  })
                "
              >
                {{ 'COMMON.CASE_MATERIAL' | translate }}
              </a>
              @if (addLink) {
              <a
                pdk-link
                href="javascript:void(0);"
                pdk-margin-top="2"
                data-test-id="add-application-link"
                (click)="onGoToCaseLink.emit(addLink)"
              >
                {{ 'HEARING_LIST.GO_TO_ADD_APPLICATION' | translate }}
              </a>
              }
            </div>
          </pdk-inset-text>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .case-links {
        display: flex;
        flex-direction: column;
      }
    `,
    `
      .hearing-case-links {
        word-break: break-word;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkVisuallyHiddenDirective,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkInsetTextComponent,
    PdkLinkDirective,
    NgTemplateOutlet,
    TranslatePipe
  ]
})
export class HearingCaseLinksComponent {
  @Input() prosecutionCases: ProsecutionCaseDetails[];
  @Input() courtApplications: CourtApplication[];
  @Input() isStandAloneApplication: boolean;
  @Input() canAddChildApplication = false;
  @Output() onGoToCaseLink: EventEmitter<HearingCaseLink> = new EventEmitter();
  @Output() onGoToCreateTask = new EventEmitter<string>();

  hearingCaseLinkType = HearingCaseLinkType;

  /**
   * The single "Add application" link for the hearing (at most one per hearing), or null.
   * Only used when the hearing has no prosecution cases. It sits in the box of the first
   * eligible application:
   * - child applications are skipped - a child cannot take a child; when its parent is in the
   *   same hearing the parent carries the link
   * - standalone applications are skipped - AAAG is the only child entry point for standalones
   * - application on inactive offences: creates a CHILD of it (needs the child application permission)
   * - application on active offences (or without offences): creates a new PARENT application
   * - mixed active and inactive applications in the hearing: no link
   */
  get addApplicationLink(): AddApplicationLink | null {
    const parentCandidates = (this.courtApplications || []).filter(
      application => !application.parentApplicationId && !isStandaloneCourtApplication(application)
    );
    const hasInactive = parentCandidates.some(isApplicationOnInactiveOffences);
    const hasActive = parentCandidates.some(
      application => !isApplicationOnInactiveOffences(application)
    );
    const isMixed = hasInactive && hasActive;

    if (!parentCandidates.length || isMixed) {
      return null;
    }

    const [application] = parentCandidates;
    const link = this.getAddLink(application);

    return link ? { applicationId: application.id, link } : null;
  }

  private getAddLink(application: CourtApplication): HearingCaseLink | null {
    const caseId = getCaseIdFromApplication(application);

    if (!isApplicationOnInactiveOffences(application)) {
      return { caseId, type: HearingCaseLinkType.ADD_APPLICATION };
    }

    return this.canAddChildApplication
      ? { caseId, applicationId: application.id, type: HearingCaseLinkType.ADD_CHILD_APPLICATION }
      : null;
  }

  getCaseReference(prosecutionCase: ProsecutionCaseDetails): string {
    return prosecutionCase.prosecutionCaseIdentifier.caseURN
      ? prosecutionCase.prosecutionCaseIdentifier.caseURN
      : prosecutionCase.prosecutionCaseIdentifier.prosecutionAuthorityReference;
  }

  goToCreateTask(caseURN: string): void {
    this.onGoToCreateTask.emit(caseURN);
  }
}
