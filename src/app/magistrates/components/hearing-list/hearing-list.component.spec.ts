import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RolePermission, UsersGroupsActions } from '@cpp/users-groups';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Store, provideStore, provideState } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState, CPPDate, reducers } from '../../../core';
import { HearingListComponent } from '../../components/hearing-list/hearing-list.component';
import { MagistratesHearing } from '../../interfaces/magistrates-hearing.interface';
import { magistratesHearingReducer } from '../../store/magistrates-hearing.reducer';

const mockCppDate: CPPDate = new CPPDate();
jest.mock('../../../core', () => ({
  ...(jest.requireActual('../../../core') as any),
  getCPPDate: jest.fn(() => mockCppDate)
}));

describe('HearingListComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let permissions: RolePermission[];
  let store: Store<AppState>;
  let actions$: Observable<Actions>;
  let mockWindow: Window;

  beforeEach(() => {
    permissions = [
      {
        action: 'Extend',
        object: 'HearingAccess',
        target: 'hearing-id-test1',
        permissionId: 'test-permission-id1'
      },
      {
        action: 'View',
        object: 'ViewHearingList',
        target: 'hearing-id-test2',
        permissionId: 'test-permission-id2'
      }
    ] as RolePermission[];
  });

  const configureTest = (hearings: any) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        provideStore(reducers, { runtimeChecks: {} }),
        provideState('magistratesHearings', magistratesHearingReducer),
        { provide: 'Window', useValue: { open: jest.fn() } },
        provideMockActions(() => actions$)
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    component.magistratesHearings = hearings;
    fixture.detectChanges();
    actions$ = TestBed.inject(Actions);
    mockWindow = TestBed.inject('Window' as any);
  };

  const setUpTestPermissions = () => {
    store = TestBed.inject(Store);
    store.dispatch(UsersGroupsActions.setUserPermissions({ permissions }));
    component.userHearingAccessPermission = permissions[0];
  };

  it('should render the template with the values expected', () => {
    // mock date to ensure date of birth is constant
    jest.spyOn(mockCppDate, 'getCurrentDate').mockReturnValue(new Date('2021-12-01'));
    const hearings = buildHearings();
    configureTest(hearings);
    setUpTestPermissions();
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should display error message when no hearings are available', () => {
    const hearings = [] as any[];
    configureTest(hearings);
    const errorMessage = fixture.debugElement.query(
      By.css('[data-role="no-hearings"]')
    ).nativeElement;
    expect(errorMessage.textContent.trim()).toBe('You have no hearings today');
  });

  it('should navigate to the case materials when clicking on the table row', () => {
    const hearings = buildHearings();
    configureTest(hearings);
    setUpTestPermissions();
    fixture.detectChanges();

    const tableRow = fixture.debugElement.query(By.css('.summaries .action-link')).nativeElement;
    tableRow.click();
    const expectedUrl =
      'testProsecutionCaseFileUrl?caseId=prosecution-case-id-test&hearingId=hearing-id-test&defendantId=defendant-id-test';
    expect(mockWindow.open).toHaveBeenCalledWith(expectedUrl, '_blank');
  });

  it('should navigate to application materials when clicking on the table row', () => {
    const hearings = buildHearingsWithApplication();
    configureTest(hearings);
    setUpTestPermissions();
    fixture.detectChanges();

    const tableRow = fixture.debugElement.query(By.css('.summaries .action-link')).nativeElement;
    tableRow.click();
    const expectedUrl =
      'testProsecutionCaseFileUrl?applicationId=application-id-test&hearingId=application-hearing-id-test';
    expect(mockWindow.open).toHaveBeenCalledWith(expectedUrl, '_blank');
  });
});

@Component({
  template: `
    <hearing-list
      [magistratesHearings]="magistratesHearings"
      [hearingDate]="'2019-12-03T18:32:00.000Z'"
      [prosecutionCaseFileUrl]="'testProsecutionCaseFileUrl'"
      [userHearingAccessPermission]="userHearingAccessPermission"
      [viewHearingListPermission]="viewHearingListPermission"
    >
    </hearing-list>
  `,
  imports: [HearingListComponent]
})
class TestHostComponent {
  magistratesHearings: MagistratesHearing[] = [];
  userHearingAccessPermission = {
    action: 'Extend',
    object: 'HearingAccess',
    target: 'hearing-id-test1',
    permissionId: 'test-permission-id1'
  } as RolePermission;

  viewHearingListPermission = {
    action: 'View',
    object: 'ViewHearingList',
    target: 'hearing-id-test2',
    permissionId: 'test-permission-id2'
  } as RolePermission;
}

const buildHearings = (): MagistratesHearing[] => {
  return [
    {
      courtRoomName: 'court-room-name-test',
      courtCentreName: 'court-centre-name-test',
      summaries: [
        {
          id: 'hearing-id-test',
          courtCentreId: 'court-centre-id-test',
          sittingDay: '2019-12-03T04:53:00.000Z',
          sequence: '1',
          prosecutionCase: {
            id: 'prosecution-case-id-test',
            prosecutionAuthorityCode: 'B01BH',
            caseURN: '57GD1981019'
          },
          defendant: {
            dateOfBirth: '1994-12-02',
            firstName: 'Wilson',
            id: 'defendant-id-test',
            lastName: 'Prohaska',
            middleName: 'Vernon',
            offences: [
              {
                id: '6cb4924e-946f-4d1d-a098-648677505103',
                offenceTitle: 'Section 18 - attempt    wounding with intent',
                wording: 'Wound / inflict grievous bodily harm without intent',
                wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH'
              }
            ]
          },
          roomId: 'room2-id-test',
          typeDescription: 'First Hearing',
          totalCases: 1
        }
      ]
    }
  ];
};

const buildHearingsWithApplication = (): MagistratesHearing[] => {
  return [
    {
      courtRoomName: 'court-room-name-test',
      courtCentreName: 'court-centre-name-test',
      summaries: [
        {
          courtCentreId: 'court-centre-id-test',
          roomId: 'room2-id-test',
          sittingDay: '2019-12-03T04:53:00.000Z',
          typeDescription: 'Application',
          id: 'hearing-id-test',
          sequence: '1',
          application: {
            subject: {},
            applicationId: 'application-id-test',
            hearingId: 'application-hearing-id-test',
            type: {
              legislation: 'application-legislation-test',
              type: 'application-type-test'
            }
          }
        }
      ]
    }
  ];
};
