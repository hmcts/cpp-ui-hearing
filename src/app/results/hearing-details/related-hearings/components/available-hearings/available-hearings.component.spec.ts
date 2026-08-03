import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { JsonPipe } from '@angular/common';
import { courtCentresMock, validAvailableHearingMock1 } from '../../mock/data';
import { AvailableHearingsComponent } from './available-hearings.component';
import { AvailableHearingsTableComponent } from '../available-hearings-table/available-hearings-table.component';
import { provideTranslateService } from '@ngx-translate/core';
import { AvailableHearing, CourtCentre, RelatedHearingSlot } from '../../../../../core';
import { JurisdictionTypes } from '../../../../../hearing-events-log/core/models/jurisdiction-types';

@Component({
  selector: 'available-hearings-table',
  template: `
    <div>
      <div>hearings: {{ hearings | json }}</div>
      <div>courtCentres: {{ courtCentres | json }}</div>
      <div>jurisdictionType: {{ jurisdictionType }}</div>
      <div>futureHearingsById: {{ futureHearingsById | json }}</div>
    </div>
  `,
  imports: [JsonPipe]
})
class MockAvailableHearingsTableComponent {
  @Input() hearings: AvailableHearing[];
  @Input() courtCentres: CourtCentre[];
  @Input() jurisdictionType?: JurisdictionTypes;
  @Input() futureHearingsById: Record<string, AvailableHearing>;
  @Output() onViewHearingDetails = new EventEmitter<AvailableHearing>();
  @Output() onHearingSelection = new EventEmitter<RelatedHearingSlot>();
}

describe('AvailableHearingsComponent', () => {
  let component: AvailableHearingsComponent;
  let fixture: ComponentFixture<AvailableHearingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [AvailableHearingsComponent],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(AvailableHearingsComponent, {
        remove: { imports: [AvailableHearingsTableComponent] },
        add: { imports: [MockAvailableHearingsTableComponent] }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableHearingsComponent);
    component = fixture.componentInstance;
    component.hearings = [validAvailableHearingMock1];
    component.courtCentres = courtCentresMock;
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('#viewHearingDetails', () => {
    jest.spyOn(component.onViewHearingDetails, 'emit');
    component.viewHearingDetails(validAvailableHearingMock1);
    fixture.detectChanges();
    expect(component.onViewHearingDetails.emit).toHaveBeenCalledWith(validAvailableHearingMock1);
  });

  describe('#filteredHearings', () => {
    it('should return empty array when hearings is null', () => {
      component.hearings = null;
      expect(component.filteredHearings).toEqual([]);
    });

    it('should filter civil hearings when isCivil is true', () => {
      component.isCivil = true;
      component.hearings = [
        { listedCases: [{ isCivil: true }] } as Partial<AvailableHearing> as AvailableHearing,
        {
          listedCases: [{ isCivil: true }, { isCivil: false }]
        } as Partial<AvailableHearing> as AvailableHearing,
        { listedCases: [{ isCivil: false }] } as Partial<AvailableHearing> as AvailableHearing
      ];
      fixture.detectChanges();
      expect(component.filteredHearings.length).toBe(2);
    });

    it('should filter criminal hearings when isCivil is false', () => {
      component.isCivil = false;
      component.hearings = [
        { listedCases: [{}] } as Partial<AvailableHearing> as AvailableHearing,
        { listedCases: [{ isCivil: undefined }] } as Partial<AvailableHearing> as AvailableHearing,
        { listedCases: [{ isCivil: true }] } as Partial<AvailableHearing> as AvailableHearing
      ];
      fixture.detectChanges();
      expect(component.filteredHearings.length).toBe(2);
    });

    it('should exclude hearings with no listedCases', () => {
      component.isCivil = false;
      component.hearings = [
        { listedCases: [] } as Partial<AvailableHearing> as AvailableHearing,
        { listedCases: null } as unknown as AvailableHearing,
        { listedCases: [{ isCivil: false }] } as Partial<AvailableHearing> as AvailableHearing
      ];
      fixture.detectChanges();
      expect(component.filteredHearings.length).toBe(1);
    });
  });

  describe('#isHearingWithAvailableHearings', () => {
    it('should return true when filteredHearings has items', () => {
      component.isCivil = true;
      component.hearings = [
        { listedCases: [{ isCivil: true }] } as Partial<AvailableHearing> as AvailableHearing
      ];
      fixture.detectChanges();
      expect(component.isHearingWithAvailableHearings).toBe(true);
    });

    it('should return false when filteredHearings is empty', () => {
      component.isCivil = true;
      component.hearings = [
        { listedCases: [{ isCivil: false }] } as Partial<AvailableHearing> as AvailableHearing
      ];
      fixture.detectChanges();
      expect(component.isHearingWithAvailableHearings).toBe(false);
    });
  });

  describe('#isHearingWithoutAvailableHearings', () => {
    it('should return true when hearings exist but filteredHearings is empty', () => {
      component.isCivil = true;
      component.hearings = [
        { listedCases: [{ isCivil: false }] } as Partial<AvailableHearing> as AvailableHearing
      ];
      fixture.detectChanges();
      expect(component.isHearingWithoutAvailableHearings).toBe(true);
    });

    it('should return false when hearings is null', () => {
      component.hearings = null;
      fixture.detectChanges();
      expect(component.isHearingWithoutAvailableHearings).toBe(false);
    });
  });
});
