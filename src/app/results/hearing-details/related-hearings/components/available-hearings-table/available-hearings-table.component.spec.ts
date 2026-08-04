import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { JsonPipe } from '@angular/common';
import { provideTranslateService } from '@ngx-translate/core';
import { TranslateMockPipe } from '../../../../../shared/pipes/mock-pipes/translate-mock.pipe';
import { CapitalizePipe } from '../../../../../shared/pipes/capitalize.pipe';
import { courtCentresMock, validAvailableHearingMock1 } from '../../mock/data';
import { AvailableHearingsTableComponent } from './available-hearings-table.component';
import { ActivatedRoute } from '@angular/router';
import { HearingOffencesComponent } from '../hearing-offences/hearing-offences.component';
import { AvailableHearingsCaseMarkersComponent } from '../available-hearings-case-markers/available-hearings-case-markers.component';
import { ListingNoteContainerComponent } from '@cpp/scheduling';
import { AvailableHearing, CourtApplication, Offence } from '../../../../../core';
import { ValidationError } from '@cpp/pdk';

@Component({
  selector: 'hearing-offences',
  template: `
    <div>offences: {{ offences | json }}</div>
    <div>applications: {{ applications | json }}</div>
    <div>hearingType: {{ hearingType }}</div>
  `,
  imports: [JsonPipe]
})
class MockHearingOffencesComponent {
  @Input() offences: Offence[];
  @Input() applications: CourtApplication[];
  @Input() hearingType: string;
}

@Component({
  selector: 'available-hearings-case-markers',
  template: ` <div>hearing: {{ hearing | json }}</div> `,
  imports: [JsonPipe]
})
class MockAvailableHearingsCaseMarkersComponent {
  @Input() hearing: AvailableHearing;
}

@Component({
  selector: 'listing-note-container',
  template: `
    <div>
      <div>courtRoomId: {{ courtRoomId }}</div>
      <div>listingNoteDate: {{ listingNoteDate }}</div>
    </div>
  `
})
class MockListingNoteContainerComponent {
  @Input() courtRoomId: string;
  @Input() listingNoteDate: string;
  @Output() onErrors = new EventEmitter<ValidationError[]>();
}

describe('AvailableHearingsTableComponent', () => {
  let component: AvailableHearingsTableComponent;
  let fixture: ComponentFixture<AvailableHearingsTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AvailableHearingsTableComponent],
      providers: [
        provideTranslateService(),
        TranslateMockPipe,
        CapitalizePipe,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(AvailableHearingsTableComponent, {
        remove: {
          imports: [
            HearingOffencesComponent,
            AvailableHearingsCaseMarkersComponent,
            ListingNoteContainerComponent
          ]
        },
        add: {
          imports: [
            MockHearingOffencesComponent,
            MockAvailableHearingsCaseMarkersComponent,
            MockListingNoteContainerComponent
          ]
        }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableHearingsTableComponent);
    component = fixture.componentInstance;
    component.hearings = [validAvailableHearingMock1];
    component.courtCentres = courtCentresMock;
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('#getCourtCentreName', () => {
    expect(component.getCourtCentreName(courtCentresMock[0].id)).toBe('Liverpool Crown Court');
  });

  it('#getCourtRoomName', () => {
    expect(
      component.getCourtRoomName(courtCentresMock[0].id, courtCentresMock[0].courtrooms[0].id)
    ).toBe('Courtroom 3-1');
  });

  it('#formatHearingType', () => {
    expect(component.formatHearingType(validAvailableHearingMock1.type)).toBe(
      'Further Plea & Trial Preparation'
    );
  });

  it('#viewHearingDetails', () => {
    jest.spyOn(component.onViewHearingDetails, 'emit');
    component.viewHearingDetails(validAvailableHearingMock1);
    fixture.detectChanges();
    expect(component.onViewHearingDetails.emit).toHaveBeenCalledWith(validAvailableHearingMock1);
  });

  it('#getRelatedHearingSlot should pass through courtScheduleId when present on the hearing day', () => {
    const hearingDay = {
      ...validAvailableHearingMock1.hearingDays[0],
      courtScheduleId: 'court-schedule-id',
    };
    expect(component.getRelatedHearingSlot(validAvailableHearingMock1, hearingDay)).toEqual(
      expect.objectContaining({
        courtScheduleId: 'court-schedule-id',
        hearingId: validAvailableHearingMock1.id,
      })
    );
  });
});
