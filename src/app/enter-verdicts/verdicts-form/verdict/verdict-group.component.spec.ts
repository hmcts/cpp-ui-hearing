import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Plea, ReferenceDataOffenceService } from '../../../core';
import { VerdictGroupComponent } from './verdict-group.component';

const mockPleas = require('../../mock-data/mock-pleas.json');
const mockVerdictTypes = require('../../mock-data/mock-verdict-types.json');
const plea = mockPleas[0];

let searchOffenceTypes: jest.Mock;

describe('VerdictGroupComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  searchOffenceTypes = jest.fn();

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        {
          provide: ReferenceDataOffenceService,
          useValue: {
            searchOffenceTypes
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  template: `
    <verdict-group
      [plea]="plea"
      [hearingType]="hearingType"
      [allVerdictTypes]="allVerdictTypes"
      [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction"
    >
    </verdict-group>
  `,
  imports: [VerdictGroupComponent]
})
class TestHostComponent {
  plea: Plea;
  allVerdictTypes = mockVerdictTypes;
  hearingType = 'CROWN';
  verdictTypesForHearingJurisdiction = mockVerdictTypes;
  constructor() {
    this.plea = plea;
  }
}
