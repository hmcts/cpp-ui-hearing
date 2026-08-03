import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AvailableHearing } from '../../../../../core';
import { PdkFillColorDirective, PdkTextColorDirective, PdkDetailsSummary } from '@cpp/pdk';
@Component({
  selector: 'available-hearings-case-markers',
  templateUrl: './available-hearings-case-markers.component.html',
  styleUrls: ['./available-hearings-case-markers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkFillColorDirective, PdkTextColorDirective, PdkDetailsSummary]
})
export class AvailableHearingsCaseMarkersComponent implements OnInit {
  @Input() hearing: AvailableHearing;

  title: string;
  casemarkers: string[] = [];

  constructor() {}

  ngOnInit() {
    if (this.hearing) {
      this.casemarkers = this.getCaseMarkers(this.hearing);
    }

    if (this.casemarkers.length > 1) {
      this.title = this.casemarkers.length + ' markers';
    }
  }

  getCaseMarkers(hearing: AvailableHearing): string[] {
    const caseMarkersArray: string[] = [];
    const { listedCases } = hearing;

    listedCases.forEach(listedCase => {
      if (listedCase.markers) {
        listedCase.markers.forEach(m => caseMarkersArray.push(m.markerTypeDescription));
      }
    });

    return caseMarkersArray;
  }
}
