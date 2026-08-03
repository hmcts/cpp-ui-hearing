import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { GroupedPlea } from '../../core';
import { VerdictFormComponent } from './verdict-form.component';
import * as mockData from '../../core/selectors/mock/hearing.json';

const mockPleas: GroupedPlea[] = (mockData as any).groupedPleas as GroupedPlea[];
const mockDefendant = mockPleas[0].withoutCount[0];
const mockVerdictTypes = require('../mock-data/mock-verdict-types.json');

describe('VerdictFormComponent', () => {
  let component: VerdictFormComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should fire an event when invoked', fakeAsync(() => {
    const defendant = { ...mockDefendant };

    defendant.offences[0].plea.pleaValue = 'NOT_GUILTY';
    component.updateVerdict({
      defendant: mockDefendant,
      offence: defendant.offences[0]
    });

    expect(mockDefendant.offences[0].verdict).toEqual(defendant.offences[0].verdict);
  }));
});

@Component({
  template: `
    <verdict-form
      [pleas]="mockPleas"
      [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction"
    ></verdict-form>
  `,
  imports: [VerdictFormComponent]
})
class TestHostComponent {
  mockPlea: GroupedPlea[];
  verdictTypesForHearingJurisdiction = mockVerdictTypes;
  constructor() {
    this.mockPlea = mockPleas;
  }
  updatePlea() {}
}
