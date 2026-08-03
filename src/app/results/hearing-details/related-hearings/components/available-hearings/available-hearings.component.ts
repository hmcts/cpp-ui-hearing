import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ValidationError, PdkInsetTextComponent } from '@cpp/pdk';
import { AvailableHearing, CourtCentre, RelatedHearingSlot } from '../../../../../core';
import { JurisdictionTypes } from '../../../../../hearing-events-log/core/models/jurisdiction-types';
import { NgPlural, NgPluralCase } from '@angular/common';
import { AvailableHearingsTableComponent } from '../available-hearings-table/available-hearings-table.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'available-hearings',
  templateUrl: './available-hearings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkInsetTextComponent,
    NgPlural,
    NgPluralCase,
    AvailableHearingsTableComponent,
    TranslatePipe
  ]
})
export class AvailableHearingsComponent {
  @Input() hearings: AvailableHearing[];
  @Input() courtCentres: CourtCentre[];
  @Input() jurisdictionType?: JurisdictionTypes;
  @Input() futureHearingsById = {} as Record<string, AvailableHearing>;
  @Input() isCivil = false;

  @Output() onViewHearingDetails: EventEmitter<AvailableHearing> = new EventEmitter();
  @Output() onHearingSelection: EventEmitter<RelatedHearingSlot> = new EventEmitter();
  @Output() errors: EventEmitter<ValidationError[]> = new EventEmitter();

  get filteredHearings(): AvailableHearing[] {
    if (!this.hearings) {
      return [];
    }
    return this.hearings.filter(hearing => {
      if (!hearing?.listedCases || hearing.listedCases.length === 0) {
        return false;
      }
      if (this.isCivil) {
        return hearing.listedCases.some(listedCase => listedCase.isCivil);
      } else {
        return hearing.listedCases.every(listedCase => !listedCase.isCivil);
      }
    });
  }

  get isHearingWithAvailableHearings(): boolean {
    return this.filteredHearings.length > 0;
  }

  get isHearingWithoutAvailableHearings(): boolean {
    return !!this.hearings && this.filteredHearings.length === 0;
  }

  viewHearingDetails(hearing: AvailableHearing): void {
    this.onViewHearingDetails.emit(hearing);
  }

  hearingSelection(relatedHearingSlot: RelatedHearingSlot): void {
    this.onHearingSelection.emit(relatedHearingSlot);
  }
}
