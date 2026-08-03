import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  ValidationError,
  PdkMarginDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkCheckboxGroupComponent,
  PdkCheckboxComponent,
  PdkVisuallyHiddenDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective,
  PdkAccordionComponent,
  PdkAccordionItemComponent,
  PdkTable
} from '@cpp/pdk';
import {
  CheckInAsDefence,
  CheckInPayload,
  getCPPDate,
  HearingSummariesGroupedByCaseId
} from '../../../core';
import { NgForm, FormsModule } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { UserDetails } from '@cpp/users-groups';
import { SelectAllComponent } from '../select-all/select-all.component';

interface FormSelector {
  [courtName: string]: {
    caseIds: string[];
    allDefendantIds: string[];
    selectedCases: string[];
    cases: Record<string, CaseDetails>;
  };
}

interface CaseDetails {
  hearingId: string;
  defendantIds: string[];
  defendants: string[];
}

@Component({
  selector: 'defence-check-in-form',
  templateUrl: './defence-check-in-form.component.html',
  styleUrls: ['./defence-check-in-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkTable,
    PdkMarginDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkCheckboxGroupComponent,
    SelectAllComponent,
    PdkCheckboxComponent,
    PdkVisuallyHiddenDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    TranslatePipe,
    PdkAccordionComponent,
    PdkAccordionItemComponent
  ]
})
export class DefenceCheckInFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() appUrl: string;
  @Input() hearingSummariesGroupedByCaseId: HearingSummariesGroupedByCaseId[] = [];
  @Input() loggedInUser: UserDetails;
  @Output() onCheckInHearing = new EventEmitter<CheckInPayload>();
  @Output() onAddCheckinErrors = new EventEmitter<ValidationError[]>();
  @ViewChild(NgForm, { static: true }) form: NgForm;

  selectedDefendants: string[] = [];
  errors: ValidationError[] = [];
  cppDateUtil = getCPPDate();
  translateSubscription: Subscription;
  translated: { [key: string]: string };
  formSelector: FormSelector;
  allAccordionItemsAreOpen = false;
  accordionItemCount: number;

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.translateSubscription = this.translateService
      .get(['CHECK_IN.SELECT_A_HEARING'])
      .subscribe(values => {
        this.translated = {
          SELECT_A_HEARING: values['CHECK_IN.SELECT_A_HEARING']
        };
      });
    this.accordionItemCount = this.hearingSummariesGroupedByCaseId.length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.hearingSummariesGroupedByCaseId &&
      changes.hearingSummariesGroupedByCaseId.currentValue !==
        changes.hearingSummariesGroupedByCaseId.previousValue
    ) {
      this.setSelectionObject();
    }
  }

  private setSelectionObject() {
    this.formSelector = this.hearingSummariesGroupedByCaseId.reduce((aggregator, group) => {
      const cases = group.cases.reduce((allCases, kase): Record<string, CaseDetails> => {
        return {
          ...allCases,
          [kase.caseId]: {
            hearingId: kase.hearingId,
            defendantIds: kase.defendants.map(({ id }) => id),
            defendants: []
          }
        };
      }, {} as Record<string, CaseDetails>);

      aggregator[group.courtroomName] = {
        caseIds: group.cases.map(({ caseId }) => caseId),
        allDefendantIds: group.cases.reduce(
          (ids, kase) => [...ids, ...kase.defendants.map(({ id }) => id)],
          []
        ),
        selectedCases: [],
        cases
      };
      return aggregator;
    }, {} as FormSelector);
  }

  onSubmit() {
    const selectedDefendants = this.extractDefendants();
    const selectedCases = this.extractCases();

    if (selectedDefendants.length > 0 || selectedCases.length > 0) {
      const defencePayload = (selectedDefendants || []).map(({ defendants, hearingId }) => {
        return {
          hearingId,
          defenceCounsel: {
            id: uuid(),
            firstName: this.loggedInUser.firstName,
            middleName: '',
            lastName: this.loggedInUser.lastName,
            title: '',
            status: 'Defence',
            defendants,
            attendanceDays: [
              this.cppDateUtil.format(
                this.cppDateUtil.getCurrentDate(),
                this.cppDateUtil.US_DATE_FORMAT
              )
            ]
          }
        } as CheckInAsDefence;
      });

      const prosecutionPayload = (selectedCases || []).map(({ prosecutionCases, hearingId }) => {
        return {
          hearingId,
          prosecutionCounsel: {
            id: uuid(),
            firstName: this.loggedInUser.firstName,
            middleName: '',
            lastName: this.loggedInUser.lastName,
            title: '',
            prosecutionCases,
            status: 'Prosecution',
            attendanceDays: [
              this.cppDateUtil.format(
                this.cppDateUtil.getCurrentDate(),
                this.cppDateUtil.US_DATE_FORMAT
              )
            ]
          }
        };
      });

      this.onCheckInHearing.emit({
        prosecution: prosecutionPayload,
        defence: defencePayload
      });
    } else {
      this.errors = [
        {
          id: 'defence-check-in-form',
          message: this.translated.SELECT_A_HEARING
        }
      ];
      this.onAddCheckinErrors.emit(this.errors);
    }
  }

  extractDefendants() {
    return Object.values(this.formSelector).reduce((selectedDefendants, { cases }) => {
      const filteredDefendants = Object.values(cases)
        .filter(kase => !!kase.defendants && kase.defendants.length > 0)
        .map(({ defendants, hearingId }) => ({
          hearingId,
          defendants
        }));
      return [...selectedDefendants, ...filteredDefendants];
    }, [] as Array<{ hearingId: string; defendants: string[] }>);
  }

  extractCases() {
    return Object.values(this.formSelector).reduce((extractedCases, { selectedCases, cases }) => {
      return [
        ...extractedCases,
        ...(selectedCases || []).map(caseId => ({
          prosecutionCases: [caseId],
          hearingId: cases[caseId].hearingId
        }))
      ];
    }, [] as Array<{ prosecutionCases: string[]; hearingId: string }>);
  }

  selectCases(courtRoomName: string, shouldSelect: boolean) {
    this.form.setValue({
      ...this.form.value,
      [`selectedCases_${courtRoomName}`]: shouldSelect
        ? this.formSelector[courtRoomName].caseIds.filter(id => !this.shouldDisableCase(id))
        : []
    });
  }

  hasAllCasesSelected(courtRoomName: string): boolean {
    const formValues = this.form.value[`selectedCases_${courtRoomName}`] || [];
    const enabledCases = this.formSelector[courtRoomName].caseIds.filter(
      id => !this.shouldDisableCase(id)
    );
    return enabledCases.length > 0 && enabledCases.every(id => formValues.includes(id));
  }

  selectDefendants(courtRoomName: string, shouldSelect: boolean) {
    const formValues = this.formSelector[courtRoomName].caseIds.reduce((records, id) => {
      if (this.shouldDisableDefendant(courtRoomName, id)) {
        return records;
      }
      return {
        ...records,
        [`selectedDefendants_${id}`]: shouldSelect
          ? this.formSelector[courtRoomName].cases[id].defendantIds
          : []
      };
    }, {} as Record<string, string[]>);
    this.form.setValue({
      ...this.form.value,
      ...formValues
    });
  }

  hasAllDefendantsSelected(courtRoomName: string): boolean {
    const formValues = this.formSelector[courtRoomName].caseIds.reduce((ids, id) => {
      return [...ids, ...(this.form.value[`selectedDefendants_${id}`] || [])];
    }, []);
    const enabledDefendantIds = this.formSelector[courtRoomName].caseIds.reduce(
      (defendantIds, id) => {
        if (this.shouldDisableDefendant(courtRoomName, id)) {
          return defendantIds;
        }
        return [...defendantIds, ...this.formSelector[courtRoomName].cases[id].defendantIds];
      },
      []
    );
    return (
      enabledDefendantIds.length > 0 && enabledDefendantIds.every(id => formValues.includes(id))
    );
  }

  shouldDisableCase(caseId: string): boolean {
    return (
      !!this.form.value[`selectedDefendants_${caseId}`] &&
      this.form.value[`selectedDefendants_${caseId}`].length > 0
    );
  }

  shouldDisableDefendant(courtRoomName: string, caseId: string): boolean {
    return (
      !!this.form.value[`selectedCases_${courtRoomName}`] &&
      this.form.value[`selectedCases_${courtRoomName}`].includes(caseId)
    );
  }

  ngOnDestroy() {
    this.translateSubscription.unsubscribe();
  }

  getFormValue() {
    return this.form.value;
  }
}
