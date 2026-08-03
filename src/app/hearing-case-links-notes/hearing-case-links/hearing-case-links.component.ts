import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CourtApplication,
  HearingCaseLink,
  HearingCaseLinkType,
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
      } } @if (parentApplication) {
      <ng-template
        [ngTemplateOutlet]="applicationTemplate"
        [ngTemplateOutletContext]="{
            application: parentApplication,
            isChild: false,
            addType: hearingCaseLinkType.ADD_CHILD_APPLICATION,
            caseId: caseIdFromParentApplication,
          }"
      >
      </ng-template>
      } @if (isStandAloneApplication && !parentApplication) { @for (application of
      courtApplications; track application.id) {
      <div [attr.data-test-id]="application.applicationReference">
        <ng-template
          [ngTemplateOutlet]="applicationTemplate"
          [ngTemplateOutletContext]="{
                application: application,
                isChild: !!application.parentApplicationId,
                addType: hearingCaseLinkType.ADD_APPLICATION,
                caseId: application.courtApplicationCases?.length
                  ? application.courtApplicationCases[0].prosecutionCaseId
                  : null,
              }"
        >
        </ng-template>
      </div>
      } }
      <ng-template
        #applicationTemplate
        let-application="application"
        let-addType="addType"
        let-caseId="caseId"
        let-isChild="isChild"
      >
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
              @if ( !isChild && (addType !== hearingCaseLinkType.ADD_CHILD_APPLICATION ||
              canAddChildApplication) ) {
              <a
                pdk-link
                href="javascript:void(0);"
                pdk-margin-top="2"
                (click)="
                    onGoToCaseLink.emit({
                      caseId: caseId,
                      applicationId: application.id,
                      type: addType,
                    })
                  "
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

  get parentApplication(): CourtApplication | null {
    // This check is valid for only  application hearing with inactive cases
    if (this.prosecutionCases && this.prosecutionCases.length > 0) {
      return null;
    }

    // Cases attached to the applications must be inactive
    return this.courtApplications.find(application => {
      if (application.parentApplicationId) {
        return false;
      }

      // Check if the application is a court order
      if (application.courtOrder) {
        return true;
      }

      return (application.courtApplicationCases || []).every(
        ({ caseStatus }) => caseStatus === 'INACTIVE'
      );
    });
  }

  get caseIdFromParentApplication(): string {
    const parentApplication = this.parentApplication;

    return (
      parentApplication?.courtApplicationCases?.[0]?.prosecutionCaseId ??
      parentApplication?.courtOrder?.courtOrderOffences?.[0]?.prosecutionCaseId ??
      null
    );
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
