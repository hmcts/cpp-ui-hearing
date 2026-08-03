import { HearingCaseLink, HearingCaseLinkType } from '../core/model/hearing-case-link';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { HearingCaseLinksNotesComponent } from './hearing-case-links-notes.component';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState, HearingDetail } from '../core';
import {
  hearingCaseNoteMock,
  hearingMock,
  hearingMultidayCaseNotesMock
} from '../mock-data/test-mock-data';
import * as mockData from '../core/selectors/mock/hearing.json';

const mockHearing = (mockData as any).hearing as HearingDetail;

describe('HearingCaseLinksNotesComponent', () => {
  let component: HearingCaseLinksNotesComponent;
  let fixture: ComponentFixture<HearingCaseLinksNotesComponent>;
  let dispatchSpy = jest.fn();
  let state: any;
  const store: Store<AppState> = null;

  beforeEach(fakeAsync(() => {
    state = {
      hearings: {
        current: hearingMultidayCaseNotesMock,
        summaries: [],
        selectedHearingDate: null
      },
      hearingReferenceData: {
        organisationUnits: []
      }
    };

    let selectSpy = jest.fn().mockImplementation(selectorFunc => {
      return of(selectorFunc.call(store, state));
    });

    TestBed.configureTestingModule({
      imports: [HearingCaseLinksNotesComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: Store, useValue: { select: selectSpy, dispatch: dispatchSpy } }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingCaseLinksNotesComponent);
    component = fixture.debugElement.children[0].componentInstance;
    component.hearing = hearingMock as unknown as HearingDetail;
    component.hearingNotes = [hearingCaseNoteMock];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should filter out bulk cases', () => {
    const bulkCase = { ...mockHearing.prosecutionCases[0], isGroupMaster: true };
    component.hearing = {
      ...mockHearing,
      prosecutionCases: [...mockHearing.prosecutionCases, bulkCase]
    };
    component.prosecutionCasesWithoutBulkCases = [];
    component.ngOnInit();

    expect(component.prosecutionCasesWithoutBulkCases).toEqual([mockHearing.prosecutionCases[0]]);
  });

  it('#goToCaseLink', () => {
    const mockHearingCaseLink: HearingCaseLink = {
      caseId: 'caseId',
      type: HearingCaseLinkType.CASE_AT_A_GLANCE
    };

    jest.spyOn(component.onGoToCaseLink, 'emit');
    component.goToCaseLink(mockHearingCaseLink);
    fixture.detectChanges();
    expect(component.onGoToCaseLink.emit).toHaveBeenCalledWith(mockHearingCaseLink);
  });

  it('#goToCreateTask', () => {
    const mockCreateTaskParams = {
      caseUrn: 'caseUrn',
      courtCentreId: hearingMock.courtCentre.id
    };
    jest.spyOn(component.onGoToCreateTask, 'emit');
    component.goToCreateTask(mockCreateTaskParams.caseUrn);
    fixture.detectChanges();
    expect(component.onGoToCreateTask.emit).toHaveBeenCalledWith(mockCreateTaskParams);
  });

  describe('saveNote method ', () => {
    it('should trigger SaveHearingCaseNoteAction action when click save note ', () => {
      component.saveNote(hearingCaseNoteMock.note);
      fixture.detectChanges();
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('hearing notes textarea display', () => {
    it('should display textarea when hearing.hasSharedResults flag is false', () => {
      expect(fixture.elementRef.nativeElement.querySelector('hearing-note-text')).not.toBe(null);
    });
  });
});
