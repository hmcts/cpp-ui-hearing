import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OutstandingFinesCreateReportFormComponent } from './outstanding-fines-create-report-form.component';
import { provideMockStore } from '@ngrx/store/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

function fixTypeahead(fixture: ComponentFixture<TestHostComponent>) {
  const courtCentreTypeaheadEl = fixture.debugElement.queryAll(By.css('pdk-typeahead input'));
  courtCentreTypeaheadEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
}

describe('OutstandingFinesCreateReportFormComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: OutstandingFinesCreateReportFormComponent;

  const mockInitialState = {
    referenceData: {
      organisationUnits: [
        {
          id: 'court-centre-002',
          oucodeL3Name: 'Liverpool Crown Court',
          courtrooms: [
            { id: '7cb09222', courtroomName: 'Crown Court 3-1' },
            { id: 'eab274c1', courtroomName: 'Crown Court 5-2' },
            { id: 'fbe3ca1a', courtroomName: 'Crown Court 5-3' }
          ]
        }
      ]
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule],
      providers: [provideTranslateService(), provideMockStore({ initialState: mockInitialState })],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  }));

  it('should render the template with the values expected', () => {
    fixTypeahead(fixture);
    expect(fixture).toMatchSnapshot();
  });

  it('should populate court room options for selected court Centre', () => {
    component.courtCentreSelected({
      id: 'id',
      oucodeL3Name: 'court-centre-001',
      oucodeL3Code: 'court001',
      courtrooms: [
        {
          id: '7cb09222',
          courtroomName: 'Crown Court 3-1',
          courtroomId: 1,
          venueName: 'Crown Court 3-1'
        },
        {
          id: 'eab274c1',
          courtroomName: 'Crown Court 5-2',
          courtroomId: 2,
          venueName: 'Crown Court 5-2'
        },
        {
          id: 'fbe3ca1a',
          courtroomName: 'Crown Court 5-3',
          courtroomId: 3,
          venueName: 'Crown Court 5-3'
        }
      ]
    });

    expect(component.courtRoomOptions[0].value).toBe('all-courtrooms');
    expect(component.courtRoomOptions[1].label).toBe('Crown Court 3-1');
    expect(component.courtRoomOptions[2].label).toBe('Crown Court 5-2');
    expect(component.courtRoomOptions[3].label).toBe('Crown Court 5-3');
  });

  it('should toggle court rooms filter', () => {
    component.courtCentreSelected({
      id: 'id',
      oucodeL3Name: 'court-centre-002',
      oucodeL3Code: 'court002',
      courtrooms: [
        {
          id: '7cb09222',
          courtroomName: 'Crown Court 3-1',
          courtroomId: 1,
          venueName: 'Crown Court 3-1'
        },
        {
          id: 'eab274c1',
          courtroomName: 'Crown Court 5-2',
          courtroomId: 2,
          venueName: 'Crown Court 5-2'
        },
        {
          id: 'fbe3ca1a',
          courtroomName: 'Crown Court 5-3',
          courtroomId: 3,
          venueName: 'Crown Court 5-3'
        }
      ]
    });
    component.courtroomSelected({ source: { value: 'all-courtrooms' } as any, checked: false });
    expect(component.selectedOptions.courtRoomsFilter).toEqual([]);

    component.courtroomSelected({ source: { value: 'all-courtrooms' } as any, checked: true });
    expect(component.selectedOptions.courtRoomsFilter).toEqual([
      'all-courtrooms',
      '7cb09222',
      'eab274c1',
      'fbe3ca1a'
    ]);

    component.courtroomSelected({ source: { value: 'eab274c1' } as any, checked: true });
    expect(component.selectedOptions.courtRoomsFilter).toEqual([
      '7cb09222',
      'eab274c1',
      'fbe3ca1a'
    ]);
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <outstanding-fines-create-report-form></outstanding-fines-create-report-form> `,
  imports: [OutstandingFinesCreateReportFormComponent]
})
class TestHostComponent {}
