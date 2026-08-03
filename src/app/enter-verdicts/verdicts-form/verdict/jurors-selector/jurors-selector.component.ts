import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Offence, Verdict } from '../../../../core';
import { cloneDeep } from 'lodash-es';
import { PdkLinkDirective } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'jurors-selector',
  templateUrl: './jurors-selector.html',
  styleUrls: ['./jurors-selector.scss'],
  imports: [PdkLinkDirective, TranslatePipe]
})
export class JurorsSelectorComponent implements OnInit {
  @Input() offence: Offence;
  @Output() changed: EventEmitter<Offence> = new EventEmitter();

  isEditMode = false;
  optionsSplit: Record<number, { label: string; value: number }[]> = {
    10: [
      { label: 'Unanimous', value: 0 },
      { label: '9:1', value: 1 }
    ],
    11: [
      { label: 'Unanimous', value: 0 },
      { label: '10:1', value: 1 }
    ],
    12: [
      { label: 'Unanimous', value: 0 },
      { label: '11:1', value: 1 },
      { label: '10:2', value: 2 }
    ]
  };
  options;
  offenceCopy: Offence;

  constructor() {
    this.options = Object.keys(this.optionsSplit).map(Number);
  }

  ngOnInit() {
    if (this.offence) {
      this.offenceCopy = cloneDeep(this.offence);
    }
    if (this.offenceCopy.verdict) {
      this.offenceCopy.verdict = this.addDefaultValues(this.offenceCopy);
    }
  }

  addDefaultValues(offence: Offence): Verdict {
    return {
      ...offence.verdict,
      jurors: {
        numberOfSplitJurors: offence.verdict.jurors.numberOfSplitJurors || 0,
        numberOfJurors: offence.verdict.jurors.numberOfJurors || 12,
        unanimous:
          offence.verdict.jurors.unanimous || offence.verdict.jurors.numberOfSplitJurors === 0
      },
      offenceId: offence.verdict.offenceId || offence.id
    };
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    this.offenceCopy.verdict.jurors.unanimous =
      this.offenceCopy.verdict.jurors.numberOfSplitJurors === 0;
    if (!this.isEditMode) {
      this.changed.emit(this.offenceCopy);
    }
  }

  selectNumberOfJurors(numberOfJurors: number): void {
    this.offenceCopy.verdict.jurors.numberOfJurors = numberOfJurors;
    this.offenceCopy.verdict.jurors.numberOfSplitJurors = 0;
  }

  selectSplit(numberOfSplitJurors: number) {
    this.offenceCopy.verdict.jurors.numberOfSplitJurors = numberOfSplitJurors;
  }

  getNumberOfSplitJurorsLabel = () =>
    this.optionsSplit[this.offenceCopy.verdict.jurors.numberOfJurors].find(
      item => item.value === this.offenceCopy.verdict.jurors.numberOfSplitJurors
    ).label;

  get hasVerdictCleared(): boolean {
    return !this.offenceCopy.verdict.isDeleted;
  }
}
