import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { GroupedPlea, ReferenceDataOffenceService } from '../../../../core';
import { PleaGroupComponent } from '../plea-group.component';

import { By } from '@angular/platform-browser';
import { GROUPED_PLEA_MOCK } from '../mocks/grouped-plea-mock';
import { redirect } from 'src/bootstrap-app.config';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

let searchOffenceTypes: jest.Mock;

// Mock the redirect function to avoid JSDOM navigation errors
jest.mock('../../../../../bootstrap-app.config', () => ({
  redirect: jest.fn()
}));

describe('PleaGroupComponent', () => {
  let component: PleaGroupComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  searchOffenceTypes = jest.fn();

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
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
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should correctly render the amend link and navigate on click', fakeAsync(() => {
    const firstDefendant = component.plea.withoutCount[0];
    const firstOffence = firstDefendant.offences[0];

    const expectedUrl = `/prosecution-casefile/edit-case/${firstDefendant.prosecutionCaseId}/offences/${firstDefendant.id}/amend/${firstOffence.id}`;
    const spyOnNavigateToAmend = jest.spyOn(component, 'navigateToAmend');

    fixture.detectChanges();

    const amendLink = fixture.debugElement.query(
      By.css('[data-role="amend-offence"]')
    ).nativeElement;
    amendLink.click();
    fixture.detectChanges();

    expect(spyOnNavigateToAmend).toHaveBeenCalledWith(expectedUrl);
    expect(redirect).toHaveBeenCalledWith(expectedUrl);
  }));
});

@Component({
  template: ` <plea-group [plea]="plea"> </plea-group> `,
  imports: [PleaGroupComponent]
})
class TestHostComponent {
  plea: GroupedPlea;

  constructor() {
    this.plea = GROUPED_PLEA_MOCK as unknown as GroupedPlea;
  }
}
