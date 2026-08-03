import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  ValidationError,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkVisuallyHiddenDirective,
  PdkCheckboxComponent,
  PdkListDirective
} from '@cpp/pdk';
import { difference, xor } from 'lodash-es';
import { CourtApplication, HearingDetail, Offence } from '../../../core';
import { OffenceConditionStatus } from '../../../core/model/offence-condition-status';
import {
  getTargetsForHearing,
  getTargetsHierarchy,
  TargetGroup,
  TargetsGroupedBySubject
} from '../../core/helpers';
import { getOffenceConditions } from '../../core/helpers/offence-conditions';
import { ApplicationItem, OffenceItem } from '../../core/helpers/target';
import {
  DraftResultRelation,
  DraftStatus,
  ParseTextOptionsForApplication,
  ParseTextOptionsForOffence,
  PromptEntry
} from '../../results.interfaces';
import { ValidationMessage } from '../../results-validation.interfaces';
import { DraftResultApplicationComponent } from './draft-result-application.component';
import { DraftResultOffenceComponent } from './draft-result-offence.component';
import { FormsModule } from '@angular/forms';
import { TargetSubjectNamePipe } from '../../common/pipes/target-subject-name.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { CaseReferencePipe } from '../../../shared/pipes/case-reference.pipe';

export type ParseTextValue =
  | Omit<ParseTextOptionsForApplication, 'orderedDate'>
  | Omit<ParseTextOptionsForOffence, 'orderedDate'>;

@Component({
  selector: 'cpp-draft-result-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (targetGroupsForSubject of targetsGroupedBySubject; track targetGroupsForSubject) {
    <div data-test-id="targetGroupsBySubject" pdk-margin-vertical="6">
      <h3 pdk-typography="heading-medium">
        @if (!isBulkDefendant(targetGroupsForSubject)) {
        {{ targetGroupsForSubject.subject | targetSubjectName }}
        } @else {
        {{ 'COMMON.BULK_DEFENDANT' | translate }}
        }
      </h3>

      @for (targetGroup of targetGroupsForSubject.targetGroups; track targetGroup) {
      <!-- Offences -->
      @if (getCaseLevelOffences(targetGroup)?.length > 0) { @if
      (!isBulkDefendant(targetGroupsForSubject)) {
      <h4 pdk-typography="heading-small">
        <span pdk-visually-hidden>Case reference: </span
        >{{ targetGroup.prosecutionCase | caseReference }}
      </h4>
      } @if (!readonly) {
      <pdk-checkbox
        data-test-id="toggleAllShadowListing"
        checkboxType="small"
        [ngModel]="getAllOffencesShadowListed(targetGroupsForSubject.targetGroups)"
        (ngModelChange)="
          handleShadowListingForAllOffences(targetGroupsForSubject.targetGroups, $event)
        "
        [ngModelOptions]="{}"
        >Exclude all offences from list (next hearing)</pdk-checkbox
      >
      }
      <h4 pdk-visually-hidden>Offences</h4>
      <ol pdk-list>
        @for ( offenceItem of getCaseLevelOffences(targetGroup); track offenceItem; let i = $index )
        {
        <li data-test-id="offence" pdk-margin-vertical="6" pdk-typography="body-small">
          <cpp-draft-result-offence
            #draftResultTarget
            [applicationId]="offenceItem.applicationId"
            [caseId]="offenceItem.caseId"
            [canCopyResults]="targetsForHearing.length > 1"
            [defendantId]="offenceItem.defendantId"
            [jurisdictionType]="hearing.jurisdictionType"
            [draftStatus]="getDraftStatusForTargetId(offenceItem.offenceId)"
            [hasSharedResults]="sharedTargetIds.includes(offenceItem.offenceId)"
            [masterDefendantId]="offenceItem.masterDefendantId"
            [offence]="offenceItem.offence"
            [relations]="relationsByTargetId[offenceItem.offenceId] || noRelations"
            [offenceConditionStatus]="getOffenceConditions(offenceItem)"
            [shadowListed]="shadowListedOffenceIds.includes(offenceItem.offenceId)"
            [canAllocateRelatedHearing]="canAllocateRelatedHearing"
            [validationErrorMessagesByOffenceId]="validationErrorMessagesByOffenceId"
            (shadowListedChange)="handleShadowListingForOffence(offenceItem.offenceId, $event)"
            (errors)="errors.emit($event)"
            (navigateToCopyResults)="navigateToCopyResults.emit($event)"
          >
          </cpp-draft-result-offence>
        </li>
        }
      </ol>
      }
      <!-- Applications -->
      @if (targetGroup.applicationItems.length > 0) {
      <h4 pdk-visually-hidden>Applications</h4>
      <ul pdk-list>
        @for (applicationItem of targetGroup.applicationItems; track applicationItem) {
        <li data-test-id="application" pdk-margin-vertical="6" pdk-typography="body-small">
          <cpp-draft-result-application
            #draftResultTarget
            [application]="applicationItem.application"
            [canCopyResults]="targetsForHearing.length > 1"
            [caseId]="applicationItem.caseId"
            [draftStatus]="getDraftStatusForTargetId(applicationItem.applicationId)"
            [hasSharedResults]="sharedTargetIds.includes(applicationItem.applicationId)"
            [isBoxwork]="hearing.isBoxHearing"
            [masterDefendantId]="applicationItem.masterDefendantId"
            [relations]="relationsByTargetId[applicationItem.applicationId] || noRelations"
            [hasHmctsOrganisation]="hasHmctsOrganisation"
            [prosecutorToBeNotified]="prosecutorToBeNotified"
            [isExParteCase]="isExParteCase"
            [canAllocateRelatedHearing]="canAllocateRelatedHearing"
            [amendApplicationPermission]="amendApplicationPermission"
            [caseStatus]="caseStatus"
            (errors)="errors.emit($event)"
            (navigateToCopyResults)="navigateToCopyResults.emit($event)"
          >
          </cpp-draft-result-application>
        </li>
        <!-- CourtOrderOffences -->
        @for ( offenceItem of getCourtOrderOffencesForApplication(applicationItem, targetGroup);
        track offenceItem; let i = $index ) {
        <li data-test-id="offence" pdk-margin-vertical="6" pdk-typography="body-small">
          <cpp-draft-result-offence
            #draftResultTarget
            [applicationId]="offenceItem.applicationId"
            [caseId]="offenceItem.caseId"
            [canCopyResults]="targetsForHearing.length > 1"
            [defendantId]="offenceItem.defendantId"
            [jurisdictionType]="hearing.jurisdictionType"
            [draftStatus]="getDraftStatusForTargetId(offenceItem.offenceId)"
            [hasSharedResults]="sharedTargetIds.includes(offenceItem.offenceId)"
            [masterDefendantId]="offenceItem.masterDefendantId"
            [offence]="offenceItem.offence"
            [relations]="relationsByTargetId[offenceItem.offenceId] || noRelations"
            [offenceConditionStatus]="getOffenceConditions(offenceItem)"
            [shadowListed]="shadowListedOffenceIds.includes(offenceItem.offenceId)"
            [canAllocateRelatedHearing]="canAllocateRelatedHearing"
            [validationErrorMessagesByOffenceId]="validationErrorMessagesByOffenceId"
            (shadowListedChange)="handleShadowListingForOffence(offenceItem.offenceId, $event)"
            (errors)="errors.emit($event)"
            (navigateToCopyResults)="navigateToCopyResults.emit($event)"
          >
          </cpp-draft-result-offence>
        </li>
        } }
      </ul>
      } }
    </div>
    }
  `,
  styles: [
    `
      [data-test-id='targetGroupsBySubject'] {
        border-bottom: 1px solid grey;
      }
    `
  ],
  imports: [
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkVisuallyHiddenDirective,
    PdkCheckboxComponent,
    FormsModule,
    PdkListDirective,
    DraftResultOffenceComponent,
    DraftResultApplicationComponent,
    TargetSubjectNamePipe,
    TranslatePipe,
    CaseReferencePipe
  ]
})
export class DraftResultBodyComponent implements OnInit {
  @Input() hearing: HearingDetail;
  @Input() readonly = false;
  @Input() relationsByTargetId: Record<string, DraftResultRelation[]>;
  @Input() sharedTargetIds: string[] = [];
  @Input() shadowListedOffenceIds: string[] = [];
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
  @Output() shadowListedOffenceIdsChange = new EventEmitter<string[]>();
  @Output() navigateToCopyResults = new EventEmitter<string>();
  @ViewChildren('draftResultTarget') draftResultTargetRefs: QueryList<
    DraftResultApplicationComponent | DraftResultOffenceComponent
  >;

  noRelations: DraftResultRelation[] = [];
  targetsForHearing: Array<Offence | CourtApplication> = [];
  targetsGroupedBySubject: TargetsGroupedBySubject[] = [];

  ngOnInit() {
    this.targetsForHearing = getTargetsForHearing(this.hearing);
    this.targetsGroupedBySubject = getTargetsHierarchy(this.hearing);
  }

  getAllOffencesShadowListed = (targetGroups: TargetGroup[]): boolean => {
    return targetGroups.every(tg => {
      return tg.offenceItems.every(({ offenceId }) =>
        this.shadowListedOffenceIds.includes(offenceId)
      );
    });
  };

  getDraftStatusForTargetId(targetId: string): DraftStatus {
    return this.readonly
      ? 'READONLY'
      : this.sharedTargetIds.includes(targetId)
      ? 'SHARED'
      : 'DRAFT';
  }

  getCaseLevelOffences(targetGroup: TargetGroup): OffenceItem[] {
    return (targetGroup.offenceItems || []).filter(oc => !!!oc.applicationId);
  }

  getCourtOrderOffencesForApplication(
    applicationItem: ApplicationItem,
    targetGroup: TargetGroup
  ): OffenceItem[] {
    return (targetGroup.offenceItems || []).filter(
      oc => oc.applicationId === applicationItem.applicationId
    );
  }

  handleShadowListingForAllOffences(targetGroups: TargetGroup[], allOffencesShadowListed: boolean) {
    const current = this.getAllOffencesShadowListed(targetGroups);

    if (current !== allOffencesShadowListed) {
      const offenceIds = targetGroups.reduce<string[]>((acc, targetGroup) => {
        return [...acc, ...targetGroup.offenceItems.map(({ offenceId }) => offenceId)];
      }, []);

      const shadowListedOffenceIds = difference(this.shadowListedOffenceIds, offenceIds);

      this.shadowListedOffenceIdsChange.emit(
        allOffencesShadowListed
          ? [...shadowListedOffenceIds, ...offenceIds]
          : shadowListedOffenceIds
      );
    }
  }

  handleShadowListingForOffence(offenceId: string, shadowListed: boolean) {
    const wasShadowListed = this.shadowListedOffenceIds.includes(offenceId);

    if (shadowListed !== wasShadowListed) {
      this.shadowListedOffenceIdsChange.emit(xor(this.shadowListedOffenceIds, [offenceId]));
    }
  }

  submitAllParsers() {
    const items: ParseTextValue[] = [];

    this.draftResultTargetRefs.forEach(draftResultTargetRef => {
      const parserOptions = draftResultTargetRef.getParserOptions();

      if (parserOptions) {
        const { rawText, ...other } = parserOptions;

        rawText
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .forEach(originalText => {
            items.push({ originalText, ...other });
          });

        draftResultTargetRef.resetParser();
      }
    });

    if (items.length > 0) {
      this.parseTextValues.emit(items);
    }
  }

  isBulkDefendant(input: TargetsGroupedBySubject): boolean {
    let result = false;

    if (
      input.targetGroups &&
      input.targetGroups.length > 0 &&
      input.targetGroups[0].offenceItems &&
      input.targetGroups[0].offenceItems.length > 0 &&
      input.targetGroups[0].offenceItems[0].bulkDefendant
    ) {
      result = true;
    }
    return result;
  }

  getOffenceConditions(offenceItem: OffenceItem): OffenceConditionStatus {
    return getOffenceConditions(
      offenceItem,
      this.electronicMonitoringOffences,
      this.warrantOfArrestOffences
    );
  }
}
