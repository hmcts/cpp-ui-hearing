import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { v4 as uuid } from 'uuid';
import {
  CounselsCache,
  IntermediaryCounsel,
  Defendant,
  AttendantType,
  IntermediaryType
} from '../../../core';
import { cloneDeep } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkLinkDirective,
  PdkFormFieldComponent,
  PdkTextInputDirective,
  PdkRadio
} from '@cpp/pdk';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'intermediary-counsels-panel',
  templateUrl: './intermediary-counsels-panel.component.html',
  styleUrls: ['./intermediary-counsels-panel.component.scss'],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    PdkFormFieldComponent,
    PdkRadio,
    PdkTextInputDirective,
    TranslatePipe
  ]
})
export class IntermediaryCounselsPanelComponent implements OnInit {
  @Input()
  get intermediariesCounsel(): IntermediaryCounsel[] {
    return this._intermediariesCounsel;
  }
  set intermediariesCounsel(value: IntermediaryCounsel[]) {
    this._intermediariesCounsel = cloneDeep(value);
  }

  @Input() attendanceDay: string;

  @Output()
  onUpdateIntermediary: EventEmitter<{
    intermediary?: IntermediaryCounsel;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() validState: EventEmitter<boolean> = new EventEmitter();

  @Input() defendants: Defendant[];

  _intermediariesCounsel: IntermediaryCounsel[];

  attendantType = AttendantType;

  get defendantOptions(): any[] {
    return this.defendants
      .filter(d => !d.isGroupMaster)
      .map(defendant => {
        if (defendant.personDefendant) {
          return {
            value: defendant.id,
            label:
              `${defendant.personDefendant.personDetails.firstName} ` +
              `${defendant.personDefendant.personDetails.lastName}`
          };
        } else {
          return {
            value: defendant.id,
            label: defendant.legalEntityDefendant.organisation.name
          };
        }
      });
  }

  get roleOptions(): any[] {
    return [
      {
        label: 'Interpreter',
        value: IntermediaryType.INTERPRETER
      },
      {
        label: 'Intermediary',
        value: IntermediaryType.INTERMEDIARY
      }
    ];
  }

  @Input() counselsCacheOptions: CounselsCache;

  ngOnInit() {
    if (!this.intermediariesCounsel || this.intermediariesCounsel.length === 0) {
      this.intermediariesCounsel = [];
      this.addIntermediary();
    } else {
      this.intermediariesCounsel.forEach(i => {
        if (i.attendant.attendantType === AttendantType.WITNESS) {
          i.attendant.defendantId = AttendantType.WITNESS;
        }
      });
      this.checkIsValid(this.intermediariesCounsel);
    }
  }

  disableDelete() {
    return (
      this.intermediariesCounsel &&
      this.intermediariesCounsel.length === 1 &&
      this.intermediariesCounsel[0].firstName === '' &&
      this.intermediariesCounsel[0].lastName === '' &&
      this.intermediariesCounsel[0].role === null &&
      this.intermediariesCounsel[0].attendant.attendantType === null
    );
  }

  isWitnessDisabled(index: number) {
    return this.intermediariesCounsel[index].attendant.attendantType !== AttendantType.WITNESS;
  }

  addIntermediary(): void {
    const newIntermediary: IntermediaryCounsel = {
      id: uuid(),
      firstName: '',
      lastName: '',
      attendanceDays: [this.attendanceDay],
      role: null,
      attendant: {
        defendantId: '',
        name: '',
        attendantType: null
      }
    };

    this.updateCounsel(newIntermediary);
  }

  removeCounsel(index: number) {
    this.onUpdateIntermediary.emit({ removeIndex: index });
  }

  updateCounselRole(interpreterCounsel: IntermediaryCounsel, event: any): void {
    interpreterCounsel.role = event.value;
    this.updateCounsel(interpreterCounsel);
  }

  updateDefendant(interpreterCounsel: IntermediaryCounsel, event: any): void {
    interpreterCounsel.attendant.attendantType = AttendantType.DEFENDANTS;

    if (event.value === AttendantType.WITNESS) {
      interpreterCounsel.attendant.attendantType = AttendantType.WITNESS;
    } else {
      interpreterCounsel.attendant.defendantId = event.value;
    }

    this.updateCounsel(interpreterCounsel);
  }

  updateCounsel(intermediary: IntermediaryCounsel) {
    this.onUpdateIntermediary.emit({ intermediary });
    this.checkIsValid(this.intermediariesCounsel);
  }

  checkIsValid(counsels: IntermediaryCounsel[]) {
    const isValid =
      counsels.length > 0 &&
      counsels.every(
        counsel =>
          counsel.firstName !== '' &&
          counsel.lastName !== '' &&
          counsel.role !== null &&
          ((counsel.attendant.attendantType === AttendantType.WITNESS &&
            counsel.attendant.name !== undefined &&
            counsel.attendant.name.trim() !== '') ||
            (counsel.attendant.attendantType !== AttendantType.WITNESS &&
              counsel.attendant.defendantId !== ''))
      );
    this.validState.emit(isValid);
  }
}
