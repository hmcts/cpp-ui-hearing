import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { DefendantName, HearingSummary, RemoveFutureHearing, TrialType } from '../../../core/model';
import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppConfigService } from '../../../config';
import { Subject } from 'rxjs';
import { RecordIndex } from '../../model/record-index';
import * as formUtils from '../../utils/form-utils';
import {
  PdkTypographyDirective,
  PdkBorderColorDirective,
  PdkMarginDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkPaddingDirective,
  PdkCheckboxComponent,
  PdkLinkDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkTable
} from '@cpp/pdk';
import { NgClass, LowerCasePipe, TitleCasePipe, DatePipe } from '@angular/common';
import { DisableControlDirective } from '../../directives/disable-form-control.directive';
import { TranslatePipe } from '@ngx-translate/core';
import { FullNamePipe } from '../../../shared/pipes/full-name.pipe';
@Component({
  selector: 'remove-future-hearing-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-future-hearing-form.component.html',
  imports: [
    PdkTable,
    PdkTypographyDirective,
    PdkBorderColorDirective,
    PdkMarginDirective,
    FormsModule,
    PdkFormComponent,
    ReactiveFormsModule,
    PdkFormFieldComponent,
    PdkPaddingDirective,
    PdkCheckboxComponent,
    DisableControlDirective,
    NgClass,
    PdkLinkDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    LowerCasePipe,
    TitleCasePipe,
    DatePipe,
    TranslatePipe,
    FullNamePipe
  ]
})
export class RemoveFutureHearingFormComponent implements OnInit, OnChanges {
  @Input() hearingId = '';
  @Input() hearingSummaries: HearingSummary[] = [];
  @Input() reasonsForVacating: TrialType[] = [];
  @Input() isReadOnly: boolean;
  @Output() remove = new EventEmitter<{ removeFutureHearings: RemoveFutureHearing[] }>();
  @Output() readonlyMode = new EventEmitter<boolean>();

  displayedRecordList: RecordIndex[] = [];
  values: RemoveFutureHearing[] = [];

  source$ = new Subject<TrialType[]>();
  input$ = new Subject<string>();
  form: UntypedFormGroup;

  ctrlName = {
    MAIN: 'main',
    HEARINGS: 'hearings',
    CASES: 'cases',
    DEFENDANTS: 'defendants',
    OFFENCES: 'offences',
    REASON: 'reason'
  };

  constructor(private configService: AppConfigService, private router: Router) {
    this.input$
      .pipe(
        filter(text => text.trim().length > 2),
        map(text => {
          return this.reasonsForVacating.filter(reason => {
            return reason.reasonShortDescription.toLowerCase().includes(text.toLowerCase());
          });
        })
      )
      .subscribe(this.source$);
  }

  getHearingsArrayCtrl() {
    return this.form.get(this.ctrlName.HEARINGS) as UntypedFormArray;
  }

  getHearingCtrlByIndex(hIndex: number) {
    return this.getHearingsArrayCtrl().controls[hIndex];
  }

  getCaseCtrlByIndex(hIndex: number, cIndex: number) {
    const array = this.getHearingCtrlByIndex(hIndex).get(this.ctrlName.CASES) as UntypedFormArray;
    return array.controls[cIndex];
  }

  getDefendantCtrlByIndex(hIndex: number, cIndex: number, dIndex: number) {
    const array = this.getCaseCtrlByIndex(hIndex, cIndex).get(
      this.ctrlName.DEFENDANTS
    ) as UntypedFormArray;
    return array.controls[dIndex];
  }

  getOffenceCtrlByIndex(hIndex: number, cIndex: number, dIndex: number, oIndex: number) {
    const array = this.getDefendantCtrlByIndex(hIndex, cIndex, dIndex).get(
      this.ctrlName.OFFENCES
    ) as UntypedFormArray;

    return array.controls[oIndex];
  }

  requireReasonForHearingRemoval(hearing: HearingSummary, hearingIndex: number) {
    return (
      hearing.type.description.toLowerCase() === 'trial' &&
      this.getHearingCtrlByIndex(hearingIndex).value.selected
    );
  }

  isFirstRowForHearing(caseIndex: number, defendantIndex: number, offenceIndex: number) {
    return formUtils.isFirstRowForHearing(caseIndex, defendantIndex, offenceIndex);
  }

  hasRowDisplayed(
    kaseIndex: number,
    defendantIndex: number,
    offenceIndex: number,
    name: string,
    hearingIndex: number
  ) {
    return formUtils.hasRowDisplayed(
      kaseIndex,
      defendantIndex,
      offenceIndex,
      name,
      hearingIndex,
      this.displayedRecordList
    );
  }

  hasOffenceDisplayed(
    kaseIndex: number,
    defendantIndex: number,
    offenceIndex: number,
    hearingIndex: number
  ) {
    return formUtils.hasOffenceDisplayed(
      kaseIndex,
      defendantIndex,
      offenceIndex,
      hearingIndex,
      this.displayedRecordList
    );
  }

  isFirstRowForOffence(offenceIndex: number) {
    return formUtils.isFirstRowForOffence(offenceIndex);
  }

  defendantHasMultipleOffences(defendant: DefendantName) {
    return defendant.offences.length > 1;
  }

  hearingHasMultipleDefendants(hearing: HearingSummary) {
    return (
      hearing.prosecutionCaseSummaries.length > 1 ||
      hearing.prosecutionCaseSummaries[0].defendants.length > 1
    );
  }

  hearingHasSomethingSelected(hIndex: number): boolean {
    const hearingCtrl = this.getHearingCtrlByIndex(hIndex);
    const hearing = hearingCtrl.value;
    let hasSomethingSelected = false;
    if (hearing.selected) {
      hasSomethingSelected = true;
    }

    hearing[this.ctrlName.CASES].forEach((caseSummary: any) => {
      if (caseSummary.selected) {
        hasSomethingSelected = true;
      }
      caseSummary[this.ctrlName.DEFENDANTS].forEach((defendant: any) => {
        if (defendant.selected) {
          hasSomethingSelected = true;
        }
        defendant[this.ctrlName.OFFENCES].forEach((offence: any) => {
          if (offence.selected) {
            hasSomethingSelected = true;
          }
        });
      });
    });
    return hasSomethingSelected;
  }

  createCtrl(id: string, arrayName?: string, reason: boolean = false): UntypedFormGroup {
    const controller = new UntypedFormGroup({
      id: new UntypedFormControl(id),
      selected: new UntypedFormControl(false)
    });
    if (reason) {
      controller.addControl(this.ctrlName.REASON, new UntypedFormControl());
    }
    if (arrayName) {
      const arrayCtrl = new UntypedFormArray([]);
      controller.addControl(arrayName, arrayCtrl);

      // when item is selected, then select all children
      controller.valueChanges
        .pipe(
          distinctUntilChanged((prev, curr) => prev.selected === curr.selected),
          tap(() => {
            const valueObj = controller.value;
            const selected = valueObj.selected;
            valueObj[arrayName] = valueObj[arrayName].map((o: any) => ({ ...o, selected }));
            controller.patchValue({ ...valueObj });
          })
        )
        .subscribe();

      // when all children are selected select the parent
      arrayCtrl.valueChanges
        .pipe(
          map(values => values.filter((v: any) => v.selected)),
          distinctUntilChanged((prev, curr) => prev.length === curr.length),
          tap(selectedValues => {
            if (selectedValues.length === arrayCtrl.controls.length) {
              controller.patchValue({ selected: true });
            }
          })
        )
        .subscribe();
    }

    return controller;
  }

  createForm(): UntypedFormGroup {
    const mainCtrl = this.createCtrl(this.ctrlName.MAIN, this.ctrlName.HEARINGS);
    this.hearingSummaries.forEach(hearing => {
      const hearingCtrl = this.createCtrl(hearing.id, this.ctrlName.CASES, true);

      hearing.prosecutionCaseSummaries.forEach(caseSummary => {
        const caseCtrl = this.createCtrl(caseSummary.id, this.ctrlName.DEFENDANTS);

        caseSummary.defendants.forEach(defendant => {
          const defendantCtrl = this.createCtrl(defendant.id, this.ctrlName.OFFENCES);

          defendant.offences.forEach(offence => {
            const offenceCtrl = this.createCtrl(offence.id);
            const offencesCtrlArray = defendantCtrl.get(this.ctrlName.OFFENCES) as UntypedFormArray;
            offencesCtrlArray.push(offenceCtrl);
          });
          const defendantsCtrlArray = caseCtrl.get(this.ctrlName.DEFENDANTS) as UntypedFormArray;
          defendantsCtrlArray.push(defendantCtrl);
        });
        const casesCtrlArray = hearingCtrl.get(this.ctrlName.CASES) as UntypedFormArray;
        casesCtrlArray.push(caseCtrl);
      });
      const hearingsCtrlArray = mainCtrl.get(this.ctrlName.HEARINGS) as UntypedFormArray;
      hearingsCtrlArray.push(hearingCtrl);
    });
    return mainCtrl;
  }

  ngOnInit() {
    this.form = this.createForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hearingSummaries?.currentValue) {
      this.form = this.createForm();
    }
  }

  confirm() {
    this.values = this.getValues();
    this.readonlyMode.emit(true);
    window.scroll(0, 0);
  }

  basePath(): string {
    return this.configService.appUrl;
  }

  cancelClicked() {
    this.displayedRecordList = [];
    this.values = [];
    if (this.isReadOnly) {
      this.readonlyMode.emit(false);
      this.form = this.createForm();
    } else {
      this.router.navigate(['/', 'manage', this.hearingId]);
    }
  }

  getValues() {
    const removeFutureHearings: RemoveFutureHearing[] = [];
    const form = this.form.value;
    form[this.ctrlName.HEARINGS].forEach((hearing: any) => {
      const hearingOffences = [];
      const hearingToBeRemoved: RemoveFutureHearing = {
        hearingId: hearing.id,
        offenceIds: []
      };
      if (hearing.reason) {
        hearingToBeRemoved.reasonId = hearing.reason.id;
      }
      hearing[this.ctrlName.CASES].forEach((caseSummary: any) => {
        caseSummary[this.ctrlName.DEFENDANTS].forEach((defendant: any) => {
          defendant[this.ctrlName.OFFENCES].forEach((offence: any) => {
            hearingOffences.push(offence.id);
            if (offence.selected) {
              hearingToBeRemoved.offenceIds.push(offence.id);
            }
          });
        });
      });
      if (hearingToBeRemoved.offenceIds.length) {
        removeFutureHearings.push({
          ...hearingToBeRemoved,
          hearingToRemove: hearingOffences.length === hearingToBeRemoved.offenceIds.length
        });
      }
    });
    return removeFutureHearings;
  }

  submitForm() {
    this.remove.emit({
      removeFutureHearings: this.values
    });
  }
}
