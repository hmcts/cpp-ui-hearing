import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ValidationError,
  PdkMarginDirective,
  PdkBorderColorDirective,
  PdkPaddingDirective,
  PdkTypographyDirective,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkVisuallyHiddenDirective,
  PdkInsetTextComponent,
  PdkLinkDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import {
  AvailableHearing,
  CourtCentre,
  Defendant,
  DefendantListing,
  HearingType,
  ListingHearingDay,
  Offence,
  RelatedHearingSlot
} from '../../../../../core';
import { CapitalizePipe } from '../../../../../shared';
import { JurisdictionTypes } from '../../../../../hearing-events-log/core/models/jurisdiction-types';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HearingOffencesComponent } from '../hearing-offences/hearing-offences.component';
import { AvailableHearingsCaseMarkersComponent } from '../available-hearings-case-markers/available-hearings-case-markers.component';
import { ListingNoteContainerComponent } from '@cpp/scheduling';
import { TranslatePipe } from '@ngx-translate/core';
import { FullNamePipe } from '../../../../../shared/pipes/full-name.pipe';
import { CPPDatePipe } from '../../../../../shared/pipes/cpp-date.pipe';

@Component({
  selector: 'available-hearings-table',
  templateUrl: './available-hearings-table.component.html',
  styleUrls: ['./available-hearings-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkMarginDirective,
    PdkBorderColorDirective,
    PdkPaddingDirective,
    PdkTypographyDirective,
    PdkRadioGroupComponent,
    FormsModule,
    NgClass,
    PdkRadioButtonComponent,
    HearingOffencesComponent,
    AvailableHearingsCaseMarkersComponent,
    ListingNoteContainerComponent,
    PdkVisuallyHiddenDirective,
    PdkInsetTextComponent,
    PdkLinkDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe,
    FullNamePipe,
    CPPDatePipe
  ],
  providers: [CapitalizePipe]
})
export class AvailableHearingsTableComponent {
  @Input() hearings: AvailableHearing[];
  @Input() jurisdictionType?: JurisdictionTypes;
  @Input() futureHearingsById = {} as Record<string, AvailableHearing>;
  @Input() courtCentres: CourtCentre[];

  @Output() onViewHearingDetails: EventEmitter<any> = new EventEmitter();
  @Output() onHearingSelection: EventEmitter<RelatedHearingSlot> = new EventEmitter();
  @Output() errors: EventEmitter<ValidationError[]> = new EventEmitter();

  selectedRelatedHearingSlot: RelatedHearingSlot;
  isApplication: boolean;
  constructor(private capitalizeFirstLetter: CapitalizePipe, private route: ActivatedRoute) {
    this.isApplication = !!this.route.snapshot.queryParams.isApplication;
  }

  formatHearingType(hearingType: HearingType): string {
    return this.capitalizeFirstLetter.transform(hearingType.description);
  }

  getCourtCentreName(courtCentreId: string): string {
    return this.courtCentres.find(cc => cc.id === courtCentreId).name;
  }

  getCourtRoomName(courtCentreId: string, courtRoomId: string): string {
    return courtRoomId
      ? this.courtCentres
          .find(cc => cc.id === courtCentreId)
          .courtrooms.find(cr => cr.id === courtRoomId).name
      : null;
  }

  viewHearingDetails(hearing: AvailableHearing): void {
    this.onViewHearingDetails.emit(hearing);
  }

  selectRelatedHearingSlotHandler() {
    this.onHearingSelection.emit({ ...this.selectedRelatedHearingSlot });
  }

  getRelatedHearingSlot(hearing: AvailableHearing, hearingDay: ListingHearingDay) {
    return {
      startTime: hearingDay.startTime,
      courtCentreId: hearing.courtCentreId,
      courtRoomId: hearing.courtRoomId,
      estimatedMinutes: hearing.estimatedMinutes,
      hearingType: hearing.type.description,
      hearingId: hearing.id
    };
  }

  allOffencesFor(defendants: (Defendant | DefendantListing)[]): Offence[] {
    return (defendants || [])
      .map(defendant => defendant.offences)
      .reduce((acc, cur) => acc.concat(cur), []);
  }
}
