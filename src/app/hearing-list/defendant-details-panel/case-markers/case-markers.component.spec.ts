import { Component, Input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CaseMarkersComponent } from './case-markers.component';
import { By } from '@angular/platform-browser';
import { Offence, ProsecutionCaseDetails } from '../../../core/model';
import { ReportingRestrictionsComponent } from '../../../shared/components/reporting-restrictions/reporting-restrictions.component';

describe('CaseMarkersComponent', () => {
  let component: CaseMarkersComponent;
  let fixture: ComponentFixture<CaseMarkersComponent>;

  const mockedCaseMarkers: string[] = [
    'Asset recovery',
    'Crime against an older person',
    'Police complaints',
    'Forced marriage'
  ];

  const mockProsecutionCaseDetails = {
    id: 'testCaseId',
    offences: [
      {
        id: 'testOffenceId'
      }
    ],
    prosecutionCaseIdentifier: {
      prosecutionAuthorityCode: 'TVL',
      prosecutionAuthorityId: '6b7b9adc-ccee-4b13-b2c7-499c28e98962',
      caseURN: '15GD6528020'
    }
  } as ProsecutionCaseDetails;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CaseMarkersComponent],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(CaseMarkersComponent, {
        remove: {
          imports: [ReportingRestrictionsComponent]
        },
        add: {
          imports: [TestReportingRestrictionsComponent]
        }
      })
      .compileComponents();
  }));

  describe('if case markers exists', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CaseMarkersComponent);
      component = fixture.componentInstance;
      component.markers = mockedCaseMarkers;
      component.prosecutionCaseDetails = mockProsecutionCaseDetails;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should render only three case markers and display + 1 others text', () => {
      const compiled = fixture.debugElement.query(By.css('.markers-list')).nativeElement;
      expect(compiled.querySelectorAll('.case-marker').length).toBe(3);
      expect(compiled.querySelector('.show-others').textContent.trim()).toEqual('+ 1 others');
    });
  });

  describe('if case markers do not exist', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CaseMarkersComponent);
      component = fixture.componentInstance;
      component.prosecutionCaseDetails = mockProsecutionCaseDetails;
      fixture.detectChanges();
    });

    it('should show "add case marker" link', () => {
      const compiled = fixture.debugElement.query(By.css('.add-marker')).nativeElement;
      expect(compiled.textContent).toContain('Add case marker');
    });
  });
});

@Component({
  selector: 'reporting-restrictions',
  template: `
    <div>caseId: {{ caseId }}</div>
    <div>offences: {{ offences | json }}</div>
  `,
  imports: [JsonPipe]
})
class TestReportingRestrictionsComponent {
  @Input() caseId: string;
  @Input() offences: Offence[];
}
