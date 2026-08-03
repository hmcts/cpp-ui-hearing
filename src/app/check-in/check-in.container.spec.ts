import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AppConfigService } from '../config';
import {
  CheckInHearings,
  CheckInPayload,
  loadCheckInHearingList,
  CheckInAsProsecutorAction,
  CheckInAsProsecutor,
  clearCheckInHearingList,
  CheckInHearingSummary,
  HearingSummariesGroupedByCaseId
} from '../core';
import { CheckInContainer } from './check-in.container';
import { OrganisationUnit } from '@cpp/reference-data';
import { ValidationError } from '@cpp/pdk';
import { CheckInComponent } from './components/check-in/check-in.component';
import { UserDetails, UserGroup } from '@cpp/users-groups';

@Component({
  selector: 'check-in',
  template: '<div>Mock CheckIn</div>'
})
class MockCheckInComponent {
  @Input() appUrl: string;
  @Input() hearingSummariesGroupedByCaseId: HearingSummariesGroupedByCaseId[];
  @Input() userGroups: UserGroup[];
  @Input() loggedInUser: UserDetails;
  @Input() hasApiActivity: boolean;
  @Output() onSelectCourtCentre = new EventEmitter<OrganisationUnit>();
  @Output() onAddCheckinErrors = new EventEmitter<ValidationError[]>();
  @Output() onCheckInProsecution = new EventEmitter<CheckInAsProsecutor[]>();
  @Output() onCheckInHearing = new EventEmitter<CheckInPayload>();
}

const state: Partial<{
  referencedata: {
    organisationUnits: OrganisationUnit[];
  };
  usersGroups: {
    usersGroups: UserGroup[];
    userDetails: UserDetails;
  };
  hearings: {
    summaries: HearingSummariesGroupedByCaseId[];
    checkInSummaries: CheckInHearingSummary[];
  };
  api: {
    requests: unknown[];
  };
}> = {
  referencedata: {
    organisationUnits: []
  },
  usersGroups: {
    usersGroups: [
      {
        groupId: 'groupId',
        groupName: 'defence user',
        description: 'Defence user group'
      }
    ],
    userDetails: {
      userId: 'userId',
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      prosecutingAuthorityAccess: ''
    }
  },
  hearings: {
    summaries: [],
    checkInSummaries: []
  },
  api: {
    requests: []
  }
};

describe('CheckInContainer', () => {
  let component: CheckInContainer;
  let fixture: ComponentFixture<CheckInContainer>;
  let store: MockStore;
  let dispatchSpy: jest.SpyInstance;
  const getBaseUrl = jest.fn();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CheckInContainer],
      providers: [
        provideTranslateService(),
        provideMockStore({ initialState: state }),
        { provide: AppConfigService, useValue: { getBaseUrl } }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(CheckInContainer, {
        remove: { imports: [CheckInComponent] },
        add: { imports: [MockCheckInComponent] }
      })
      .compileComponents();

    getBaseUrl.mockReturnValue('http://base-url');
    store = TestBed.inject(MockStore);
    dispatchSpy = jest.spyOn(store, 'dispatch');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckInContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should select all required data from Store upon initialization', () => {
    expect(component.userGroup$).toBeDefined();
    expect(component.hearingSummariesGroupedByCaseId$).toBeDefined();
    expect(component.hasApiActivity$).toBeDefined();
    expect(component.loggedInUser$).toBeDefined();
  });

  it('should add addCheckinErrors', () => {
    const validationErrors: ValidationError[] = [{ id: 'test-id', message: 'test-message' }];
    component.addCheckinErrors(validationErrors);
    expect(component.errors).toStrictEqual(validationErrors);
  });

  it('should dispatch loadCheckInHearingList', () => {
    const mockCourtCentre: OrganisationUnit = {
      id: 'test-court-centre-id',
      oucode: 'test-court-centre-name'
    } as OrganisationUnit;

    const mockDate = component.cppDateUtil.format(
      component.cppDateUtil.getCurrentDate(),
      component.cppDateUtil.US_DATE_FORMAT
    );

    component.selectedCourtCentre(mockCourtCentre);

    expect(dispatchSpy).toHaveBeenCalledWith(
      loadCheckInHearingList({
        date: mockDate,
        courtCentreId: 'test-court-centre-id'
      })
    );
  });

  it('should dispatch CheckInHearings action', () => {
    const mockCourtCentre: OrganisationUnit = {
      id: 'id',
      oucode: 'name',
      courtrooms: []
    } as OrganisationUnit;
    component.courtCentre = mockCourtCentre;
    fixture.detectChanges();

    const mockPayload: CheckInPayload = {
      defence: [],
      prosecution: []
    };

    component.checkInHearing(mockPayload);

    expect(dispatchSpy).toHaveBeenCalledWith(new CheckInHearings(mockPayload, mockCourtCentre));
  });

  it('should dispatch CheckInAsProsecutorAction', () => {
    const mockCourtCentre: OrganisationUnit = {
      id: 'court-id',
      oucode: 'court-name',
      courtrooms: []
    } as OrganisationUnit;
    component.courtCentre = mockCourtCentre;

    const mockProsecutionPayload: CheckInAsProsecutor[] = [
      {
        hearingId: 'hearing-1'
      } as CheckInAsProsecutor
    ];

    component.checkInProsecution(mockProsecutionPayload);

    expect(dispatchSpy).toHaveBeenCalledWith(
      new CheckInAsProsecutorAction({
        checkInAsProsecutor: mockProsecutionPayload,
        courtCentre: mockCourtCentre
      })
    );
  });

  it('should initialize observables in ngOnInit', () => {
    expect(component.userGroup$).toBeDefined();
    expect(component.hearingSummariesGroupedByCaseId$).toBeDefined();
    expect(component.hasApiActivity$).toBeDefined();
    expect(component.loggedInUser$).toBeDefined();
  });

  it('should dispatch clearCheckInHearingList on destroy', () => {
    component.ngOnDestroy();
    expect(dispatchSpy).toHaveBeenCalledWith(clearCheckInHearingList());
  });

  it('should set appUrl from config service', () => {
    expect(component.appUrl).toBe('http://base-url');
  });
});
