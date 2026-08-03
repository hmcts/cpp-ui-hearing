import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OutstandingFinesCreateReportContainer } from './outstanding-fines-create-report.container';
import { Store } from '@ngrx/store';
import { AppConfigService } from '../../config';
import { OutstandingFineCreateReportFormValues } from '../outstanding-fines.interfaces';
import { of } from 'rxjs';

describe('OutstandingFinesCreateReportContainer', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: OutstandingFinesCreateReportContainer;

  let selectSpy: any;
  const appConfigServiceSpy = jest.fn().mockReturnValue('http://test');

  let state: any;

  beforeEach(waitForAsync(() => {
    state = {
      referencedata: {
        courtcentres: []
      }
    };

    selectSpy = jest.fn().mockImplementation(selectorFunc => {
      return of(selectorFunc.call({ select: selectSpy }, state));
    });

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        {
          provide: Store,
          useValue: { select: selectSpy, pipe: jest.fn().mockReturnValue(of(state)) }
        },
        { provide: AppConfigService, useValue: { getBaseUrl: appConfigServiceSpy } }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should open outstanding-fines in new tab', () => {
    window.open = jest.fn();
    const selectedOptions = {
      courtCentreFilter: {
        id: 'test-id-court-centre',
        name: 'test-court-centre-name'
      },
      courtRoomsFilter: ['test-id-courtroom'],
      dateFilter: 'test-date'
    } as OutstandingFineCreateReportFormValues;
    component.createReport(selectedOptions);
    expect(window.open).toHaveBeenCalledWith(
      `http://test/hearing/outstanding-fines/courtroom?courtCentreId=${
        selectedOptions.courtCentreFilter.id
      }&courtRoomsIds=${selectedOptions.courtRoomsFilter.join(',')}&hearingDate=${
        selectedOptions.dateFilter
      }`,
      '_blank'
    );
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <outstanding-fines-create-report></outstanding-fines-create-report> `,
  imports: [OutstandingFinesCreateReportContainer]
})
class TestHostComponent {}
