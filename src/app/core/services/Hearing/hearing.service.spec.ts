import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import * as mockData from './mocks.json';
import {
  PleaUpdate,
  VerdictUpdate,
  ProsecutionCounsel,
  DefenceCounsel,
  CompanyRepresentative,
  HearingCaseNotes,
  ApplicantCounsel,
  IntermediaryCounsel,
  IntermediaryType,
  AttendantType
} from '../../../core';
import {
  UpdateDefendantAttendance,
  RespondentCounsel,
  EventLog,
  TierAndListType
} from '../../model';
import { HearingService } from './hearing.service';
import { AttendanceTypeEnum } from '../../model/defendants-attendance';
import { MotReason } from '../../model/mot-reason';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';

// tslint:disable:no-big-function
describe('HearingService', () => {
  let service: HearingService;
  let http: CppHttp;

  const url = '/hearing-command-api/command/api/rest/hearing/hearings/123';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn(),
            commandSync: jest.fn()
          }
        },
        HearingService
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(HearingService);
  });

  it('UpdatePleas Should send the new information and start the notification service', () => {
    const mockPlea = (mockData as any).pleaUpdateMock as PleaUpdate;
    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });
    http.commandSync = jest.fn().mockReturnValue(response$);
    const command$ = service.updatePleas('123', mockPlea);
    expect(command$).toBeObservable(expected$);
    expect(http.commandSync).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.update-plea+json',
      body: mockPlea,
      successEvent: 'public.hearing.plea-updated',
      errorEvent: 'public.hearing.update-plea-ignored'
    });
  });

  it('UpdateVerdicts Should send the new information and start the notification service', () => {
    const mockVerdict = (mockData as any).verdictUpdateMock as VerdictUpdate;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.commandSync = jest.fn().mockReturnValue(response$);

    const command$ = service.updateVerdicts('123', mockVerdict);

    expect(command$).toBeObservable(expected$);

    expect(http.commandSync).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.update-verdict+json',
      body: mockVerdict,
      successEvent: 'public.hearing.verdict-updated',
      errorEvent: 'public.hearing.update-verdict-ignored'
    });
  });

  it('updateProsecutionCounsel Should send the new information', () => {
    const mockProsecutionCounsel = (mockData as any).prosecutionCounselMock as ProsecutionCounsel;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.updateProsecutionCounsel('123', mockProsecutionCounsel);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.update-prosecution-counsel+json',
      body: { prosecutionCounsel: mockProsecutionCounsel }
    });
  });

  it('addProsecutionCounsel should send the new information', () => {
    const mockProsecutionCounsel = (mockData as any).prosecutionCounselMock as ProsecutionCounsel;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.addProsecutionCounsel('123', mockProsecutionCounsel);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.add-prosecution-counsel+json',
      body: { prosecutionCounsel: mockProsecutionCounsel }
    });
  });

  it('removeProsecutionCounsel should send the new information', () => {
    const mockProsecutionCounsel = { id: 'test-1' };

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.removeProsecutionCounsel('123', mockProsecutionCounsel);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.remove-prosecution-counsel+json',
      body: mockProsecutionCounsel
    });
  });

  it('updateDefenceCounsel Should send the new information', () => {
    const mockDefenceCounsel = (mockData as any).defenceCounselMock as DefenceCounsel;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.updateDefenceCounsel('123', mockDefenceCounsel);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.update-defence-counsel+json',
      body: { defenceCounsel: mockDefenceCounsel, hearingId: '123' }
    });
  });

  it('addDefenceCounsel should send the new information', () => {
    const mockDefenceCounsel = (mockData as any).defenceCounselMock as DefenceCounsel;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.addDefenceCounsel('123', mockDefenceCounsel);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.add-defence-counsel+json',
      body: { defenceCounsel: mockDefenceCounsel, hearingId: '123' }
    });
  });

  it('removeDefenceCounsel should send the new information', () => {
    const mockDefenceCounsel = { id: 'test-1' };

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.removeDefenceCounsel('123', mockDefenceCounsel);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.remove-defence-counsel+json',
      body: mockDefenceCounsel
    });
  });

  it('updateCompanyRepresentative Should send the new information', () => {
    const mockCompanyRepresentative = (mockData as any)
      .companyRepresentativeMock as CompanyRepresentative;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.updateCompanyRepresentative('123', mockCompanyRepresentative);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.update-company-representative+json',
      body: { companyRepresentative: mockCompanyRepresentative, hearingId: '123' }
    });
  });

  it('addCompanyRepresentative should send the new information', () => {
    const mockCompanyRepresentative = (mockData as any)
      .companyRepresentativeMock as CompanyRepresentative;

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.addCompanyRepresentative('123', mockCompanyRepresentative);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.add-company-representative+json',
      body: { companyRepresentative: mockCompanyRepresentative, hearingId: '123' }
    });
  });

  it('removeCompanyRepresentative should send the new information', () => {
    const mockCompanyRepresentative = { id: 'test-1' };

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.removeCompanyRepresentative('123', mockCompanyRepresentative);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url,
      requestType: 'application/vnd.hearing.remove-company-representative+json',
      body: mockCompanyRepresentative
    });
  });

  it('getHearingsByDate Should get the hearings for a specific date', () => {
    const response = (mockData as any).hearingList;

    const hearings$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response.hearingsSummaries });

    http.query = jest.fn().mockReturnValue(hearings$);

    const query$ = service.getHearingsByDate(
      'date',
      'courtCentreId',
      'roomId',
      'startTime',
      'endTime'
    );
    expect(query$).toBeObservable(expected$);

    const httpParams = new HttpParams()
      .set('date', 'date')
      .set('courtCentreId', 'courtCentreId')
      .set('roomId', 'roomId')
      .set('startTime', 'startTime')
      .set('endTime', 'endTime');

    expect(http.query).toHaveBeenCalledWith({
      url: '/hearing-query-api/query/api/rest/hearing/hearings',
      requestType: 'application/vnd.hearing.get.hearings+json',
      params: httpParams
    });
  });

  it('getHearingsForCheckIn should hit the minimal check-in endpoint with date and courtCentreId only', () => {
    const response = { hearingSummaries: [{ id: 'hearing-1' }] };

    const hearings$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response.hearingSummaries });

    http.query = jest.fn().mockReturnValue(hearings$);

    const query$ = service.getHearingsForCheckIn('2026-05-22', 'court-centre-id');
    expect(query$).toBeObservable(expected$);

    const httpParams = new HttpParams()
      .set('date', '2026-05-22')
      .set('courtCentreId', 'court-centre-id');

    expect(http.query).toHaveBeenCalledWith({
      url: '/hearing-query-api/query/api/rest/hearing/hearings-check-in',
      requestType: 'application/vnd.hearing.get.hearings-check-in+json',
      params: httpParams
    });
  });

  describe('getHearing', () => {
    it('should get the specified hearing with additional fields', () => {
      const appId = 'appId-1';
      const response = {
        hearing: {
          courtApplications: [
            {
              id: appId
            },
            {
              id: 'appId-2'
            }
          ]
        },
        courtApplicationAdditionalFields: {
          [appId]: {
            allowAmendment: true
          }
        }
      };
      const expected = {
        hearing: {
          courtApplications: [
            {
              id: appId,
              allowAmendment: true
            },
            {
              id: 'appId-2'
            }
          ]
        }
      } as any;

      const hearings$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expected });

      http.query = jest.fn().mockReturnValue(hearings$);
      const query$ = service.getHearing('123');

      expect(query$).toBeObservable(expected$);

      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/123',
        requestType: 'application/vnd.hearing.get.hearing+json'
      });
    });

    it('should get the specified hearing without additional fields', () => {
      const appId = 'appId-1';
      const response = {
        hearing: {
          courtApplications: [
            {
              id: appId
            },
            {
              id: 'appId-2'
            }
          ]
        }
      };

      const hearings$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.query = jest.fn().mockReturnValue(hearings$);
      const query$ = service.getHearing('123');

      expect(query$).toBeObservable(expected$);

      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/123',
        requestType: 'application/vnd.hearing.get.hearing+json'
      });
    });

    it('should handle missing courtApplications property', () => {
      const response = {
        hearing: {
          id: '123',
          courtCentre: {
            name: 'Test Court'
          }
        },
        hearingState: 'INITIALISED'
      };

      const hearings$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.query = jest.fn().mockReturnValue(hearings$);
      const query$ = service.getHearing('123');

      expect(query$).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/123',
        requestType: 'application/vnd.hearing.get.hearing+json'
      });
    });

    it('should handle API error response', () => {
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const hearings$ = cold('-#', {}, errorResponse);
      const expected$ = cold('-#', {}, errorResponse);

      http.query = jest.fn().mockReturnValue(hearings$);
      const query$ = service.getHearing('123');

      expect(query$).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/123',
        requestType: 'application/vnd.hearing.get.hearing+json'
      });
    });

    it('should handle multiple courtApplications with mixed additional fields', () => {
      const appId1 = 'appId-1';
      const appId2 = 'appId-2';
      const appId3 = 'appId-3';

      const response = {
        hearing: {
          courtApplications: [
            {
              id: appId1,
              name: 'Application 1'
            },
            {
              id: appId2,
              name: 'Application 2'
            },
            {
              id: appId3,
              name: 'Application 3'
            }
          ]
        },
        courtApplicationAdditionalFields: {
          [appId1]: {
            allowAmendment: true,
            customField: 'value1'
          },
          [appId3]: {
            allowAmendment: false,
            customField: 'value3'
          }
        }
      };

      const expected = {
        hearing: {
          courtApplications: [
            {
              id: appId1,
              name: 'Application 1',
              allowAmendment: true,
              customField: 'value1'
            },
            {
              id: appId2,
              name: 'Application 2'
            },
            {
              id: appId3,
              name: 'Application 3',
              allowAmendment: false,
              customField: 'value3'
            }
          ]
        }
      } as any;

      const hearings$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expected });

      http.query = jest.fn().mockReturnValue(hearings$);
      const query$ = service.getHearing('123');

      expect(query$).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/123',
        requestType: 'application/vnd.hearing.get.hearing+json'
      });
    });
  });

  it('getUserDetails Should get the specified user details', () => {
    const mockUserDetails = {
      userId: '123',
      firstName: 'Test',
      lastName: 'Testy',
      email: 'email',
      prosecutingAuthorityAccess: 'asd'
    };

    const userDetails$ = cold('-a|', { a: mockUserDetails });
    const expected$ = cold('-b|', { b: mockUserDetails });

    http.query = jest.fn().mockReturnValue(userDetails$);

    const query$ = service.getUserDetails('123');

    expect(query$).toBeObservable(expected$);

    expect(http.query).toHaveBeenCalledWith({
      url: `/usersgroups-query-api/query/api/rest/usersgroups/users/123`,
      requestType: 'application/vnd.usersgroups.user-details+json'
    });
  });

  it('updateDefendantAttendance should update the defendant attendance and start the notification service', () => {
    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });
    const body: UpdateDefendantAttendance = {
      hearingId: 'hearingId',
      defendantId: 'defendantId',
      attendanceDay: {
        day: '2000-01-01',
        attendanceType: AttendanceTypeEnum.IN_PERSON
      }
    };
    const expectedUrl = '/hearing-command-api/command/api/rest/hearing/hearings/';

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.updateDefendantAttendance(body);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url: expectedUrl,
      requestType: 'application/vnd.hearing.update-defendant-attendance-on-hearing-day+json',
      body
    });
  });

  it('saveNewNote method should send the note object to save in the database', () => {
    const hearingCaseNoteMock: HearingCaseNotes = {
      courtClerk: {
        id: '',
        firstName: '',
        lastName: ''
      },
      id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
      note: 'test note hearing on navihgation out yo this is another editsfdsffsdfdsfdsfsdfsdfdsf',
      noteDateTime: '',
      noteType: 'HMCTS',
      originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
      prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
    };
    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });
    http.command = jest.fn().mockReturnValue(response$);
    const command$ = service.saveNewNote(hearingCaseNoteMock.id, hearingCaseNoteMock);
    expect(command$).toBeObservable(expected$);
    expect(http.command).toHaveBeenCalledWith({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingCaseNoteMock.id}`,
      requestType: 'application/vnd.hearing.save-hearing-case-note+json',
      body: { hearingCaseNote: hearingCaseNoteMock }
    });
  });

  describe('addApplicantCounsel', () => {
    it('should add an applicant counsel', () => {
      const applicantCounsel = {
        firstName: 'James',
        lastName: 'Gray',
        status: '*'
      } as ApplicantCounsel;
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.addApplicantCounsel('hearingId', applicantCounsel);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.add-applicant-counsel+json',
        body: { applicantCounsel }
      });
    });
  });

  describe('updateApplicantCounsel', () => {
    it('should update an applicant counsel', () => {
      const applicantCounsel = {
        id: 'applicantCounselId',
        firstName: 'James',
        lastName: 'Gray',
        status: '*'
      } as ApplicantCounsel;
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.updateApplicantCounsel('hearingId', applicantCounsel);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.update-applicant-counsel+json',
        body: { applicantCounsel }
      });
    });
  });

  describe('removeApplicantCounsel', () => {
    it('should remove an applicant counsel', () => {
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.removeApplicantCounsel('hearingId', 'applicantCounselId');

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.remove-applicant-counsel+json',
        body: { id: 'applicantCounselId' }
      });
    });
  });

  describe('addRespondentCounsel', () => {
    it('should add a respondent counsel', () => {
      const respondentCounsel = <RespondentCounsel>{
        firstName: 'James',
        lastName: 'Gray',
        status: '*'
      };
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.addRespondentCounsel('hearingId', respondentCounsel);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.add-respondent-counsel+json',
        body: { respondentCounsel }
      });
    });
  });

  describe('setTrialType', () => {
    it('should set a trial type', () => {
      const body = {
        trialTypeId: 'test-type-id'
      };

      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.setTrialType('hearingId', body);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.set-trial-type+json',
        body
      });
    });
  });

  describe('setTierAndListType', () => {
    // These strings are the whole contract with the backend command handler —
    // if the media type changes, this is the assertion that has to change with it.
    it('should set the tier and list type against the hearing', () => {
      const body = {
        tier: 'TIER_2',
        tier2Subcategory: 'WITNESS_FROM_ABROAD',
        listType: 'TYPE_1',
        fixedDateReason: 'Witness only available in June'
      } as TierAndListType;

      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.setTierAndListType('hearingId', body);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.set-tier-and-list-type+json',
        body
      });
    });

    it('should send a tier on its own when no list type was chosen', () => {
      const body = { tier: 'TIER_5' } as TierAndListType;

      http.command = jest.fn().mockReturnValue(cold('--(a|)', { a: { status: 202 } }));
      service.setTierAndListType('hearingId', body);

      expect(http.command).toHaveBeenCalledWith(expect.objectContaining({ body }));
    });
  });

  describe('updateRespondentCounsel', () => {
    it('should update a respondent counsel', () => {
      const respondentCounsel = {
        id: 'respondentCounselId',
        firstName: 'James',
        lastName: 'Gray',
        status: '*'
      } as RespondentCounsel;
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.updateRespondentCounsel('hearingId', respondentCounsel);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.update-respondent-counsel+json',
        body: { respondentCounsel }
      });
    });
  });

  describe('removeRespondentCounsel', () => {
    it('should remove a respondent counsel', () => {
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.removeRespondentCounsel('hearingId', 'respondentCounselId');

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.remove-respondent-counsel+json',
        body: { id: 'respondentCounselId' }
      });
    });
  });

  describe('addIntermediaryCounsel', () => {
    it('should add an intermedirary counsel', () => {
      const interpreterIntermediary: IntermediaryCounsel = {
        id: 'uuid',
        firstName: 'james',
        lastName: 'smith',
        attendanceDays: ['2019-05-01'],
        role: IntermediaryType.INTERMEDIARY,
        attendant: {
          defendantId: '',
          name: 'witness name',
          attendantType: AttendantType.WITNESS
        }
      };
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.addIntermediaryCounsel('hearingId', interpreterIntermediary);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.add-interpreter-intermediary+json',
        body: { interpreterIntermediary }
      });
    });
  });

  describe('updateIntermediaryCounsel', () => {
    it('should update an intermediary counsel', () => {
      const interpreterIntermediary: IntermediaryCounsel = {
        id: 'uuid',
        firstName: 'james',
        lastName: 'smith',
        attendanceDays: ['2019-05-01'],
        role: IntermediaryType.INTERPRETER,
        attendant: {
          defendantId: 'defendant Id',
          name: '',
          attendantType: AttendantType.DEFENDANTS
        }
      };
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.updateIntermediaryCounsel('hearingId', interpreterIntermediary);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.update-interpreter-intermediary+json',
        body: { interpreterIntermediary }
      });
    });
  });

  describe('removeIntermediaryCounsel', () => {
    it('should remove an intermdediary counsel', () => {
      const response = { status: 202 };
      const response$ = cold('--(a|)', { a: response });
      const expected$ = cold('--(b|)', { b: response });

      const intermediaryCounselId = 'intermediaryIdToRemove';

      http.command = jest.fn().mockReturnValue(response$);
      const command$ = service.removeIntermediaryCounsel('hearingId', intermediaryCounselId);

      expect(command$).toBeObservable(expected$);
      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId`,
        requestType: 'application/vnd.hearing.remove-interpreter-intermediary+json',
        body: { id: intermediaryCounselId }
      });
    });
  });

  describe('getMotReasons', () => {
    it('Should fetch reference data with mot reasons', () => {
      const response = { modeOfTrialReasons: [] as MotReason[] };
      const expected: MotReason[] = [];
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expected });

      http.query = jest.fn().mockReturnValue(response$);

      const query$ = service.getMotReasons();

      expect(query$).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledWith({
        url: '/referencedata-query-api/query/api/rest/referencedata/mode-of-trial-reasons',
        requestType: 'application/vnd.referencedata.mode-of-trial-reasons+json'
      });
    });
  });

  describe('checkIn', () => {
    it('#checkInAsDefence should send information with command sync', () => {
      const response = { body: '*' };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.commandSync = jest.fn().mockReturnValue(response$);

      const command$ = service.checkInAsDefence('123', (mockData as any).mockDefenceCounsel);

      expect(command$).toBeObservable(expected$);

      expect(http.commandSync).toHaveBeenCalledWith({
        url,
        requestType: 'application/vnd.hearing.add-defence-counsel+json',
        body: { defenceCounsel: (mockData as any).mockDefenceCounsel, hearingId: '123' },
        successEvent: 'public.hearing.defence-counsel-added',
        errorEvent: 'public.hearing.defence-counsel-change-ignored'
      });
    });

    it('#checkInAsProsecution should send information with command sync', () => {
      const response = { body: '*' };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.commandSync = jest.fn().mockReturnValue(response$);

      const command$ = service.checkInAsProsecution(
        '123',
        (mockData as any).mockProsecutionCounsel
      );

      expect(command$).toBeObservable(expected$);

      expect(http.commandSync).toHaveBeenCalledWith({
        url,
        requestType: 'application/vnd.hearing.add-prosecution-counsel+json',
        body: { prosecutionCounsel: (mockData as any).mockProsecutionCounsel },
        successEvent: 'public.hearing.prosecution-counsel-added',
        errorEvent: 'public.hearing.prosecution-counsel-change-ignored'
      });
    });
  });

  describe('vacate trial', () => {
    it('should update the hearing with the vacate trial reason id', () => {
      const response = { body: '*' };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.commandSync = jest.fn().mockReturnValue(response$);
      const command$ = service.vacateTrial({
        hearingId: 'mock-hearing-id',
        vacatedTrialReasonId: 'mock-vacate-trial-reason-id'
      });
      expect(command$).toBeObservable(expected$);
      expect(http.commandSync).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/mock-hearing-id`,
        requestType: 'application/vnd.hearing.set-trial-type+json',
        body: {
          vacatedTrialReasonId: 'mock-vacate-trial-reason-id'
        },
        successEvent: 'public.hearing.trial-vacated'
      });
    });
  });

  describe('getDefendantsTrackingStatus', () => {
    it('should get the defendant tracking status', () => {
      const expectedValue = [
        {
          defendantId: 'defendant-id',
          trackingStatus: [
            {
              offenceId: 'offence-id',
              emStatus: true,
              lastModifiedTime: '2021-08-06T00:00Z'
            }
          ]
        }
      ];

      const response = { defendants: expectedValue };

      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expectedValue });

      http.query = jest.fn().mockReturnValue(response$);

      const query$ = service.getDefendantsTrackingStatus(['defendant-id']);

      expect(query$).toBeObservable(expected$);

      expect(http.query).toHaveBeenCalledWith({
        url: '/results-query-api/query/api/rest/results/defendants?defendantIds=defendant-id',
        requestType: 'application/vnd.results.get-defendants-tracking-status+json'
      });
    });
  });

  it('logEventForHearing should send the new information', () => {
    const eventLog: EventLog = { hearingEventId: 'someid' };
    const hearingId = 'some-hearing-Id';

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.commandSync = jest.fn().mockReturnValue(response$);

    const command$ = service.logEventForHearing(hearingId, eventLog);

    expect(command$).toBeObservable(expected$);

    expect(http.commandSync).toHaveBeenCalledWith({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/event`,
      requestType: `application/vnd.hearing.log-hearing-event+json`,
      body: eventLog,
      successEvent: 'public.hearing.event-logged'
    });
  });

  it('correctEventForHearing should send the updated information', () => {
    const eventLog: Omit<EventLog, 'hearingEventId'> = { latestHearingEventId: 'some updatedId' };
    const hearingEventId = 'someid';
    const hearingId = 'some-hearing-Id';

    const response = { body: '*' };
    const response$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response });

    http.command = jest.fn().mockReturnValue(response$);

    const command$ = service.correctEventForHearing(hearingId, hearingEventId, eventLog);

    expect(command$).toBeObservable(expected$);

    expect(http.command).toHaveBeenCalledWith({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/event/${hearingEventId}`,
      requestType: 'application/vnd.hearing.correct-hearing-event+json',
      body: eventLog
    });
  });

  describe('#unlockHearing', () => {
    it('#unlockHearing should send information with command sync', () => {
      const hearingId = 'hearingId';
      const hearingDay = 'hearingDay';
      const response$ = cold('-a|', { a: {} });
      const expected$ = cold('-b|', { b: {} });

      http.commandSync = jest.fn().mockReturnValue(response$);

      const command$ = service.unlockHearing(hearingId, hearingDay);

      expect(command$).toBeObservable(expected$);

      expect(http.commandSync).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
        requestType: 'application/vnd.hearing.unlock-hearing+json',
        successEvent: 'public.hearing.result-amendments-cancelled',
        errorEvent: 'public.hearing.manage-results-failed',
        body: { hearingDay }
      });
    });
  });

  describe('addWitness', () => {
    it('should add witness', () => {
      const hearingId = 'hearingId';
      const response$ = cold('-a|', { a: {} });
      const expected$ = cold('-b|', { b: {} });

      http.commandSync = jest.fn().mockReturnValue(response$);

      const command$ = service.addWitness(hearingId, 'witness');

      expect(command$).toBeObservable(expected$);

      expect(http.commandSync).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
        requestType: 'application/vnd.hearing.add-witness+json',
        successEvent: 'public.hearing.hearing-witness-added',
        body: { witness: 'witness' }
      });
    });
  });

  describe('HearingEventsLogCount', () => {
    it('should get the hearing events log count', () => {
      const expectedValue = {
        eventLogCountByHearingIdAndDate: 1,
        eventLogCountByHearingId: 1
      };

      const response = expectedValue;

      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expectedValue });

      http.query = jest.fn().mockReturnValue(response$);

      const query$ = service.getHearingEventsLogCount('hearingId123', 'date');

      expect(query$).toBeObservable(expected$);

      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/event-log-count?hearingId=hearingId123&hearingDate=date',
        requestType: 'application/vnd.hearing.get-hearing-event-log-count+json'
      });
    });
  });

  describe('DownloadTodayEventLog', () => {
    it('should download todays hearing event logs', () => {
      const response$ = cold('-a|', { a: new Blob(['textstream']) });
      const expected$ = cold('-b|', { b: new Blob(['textstream']) });

      http.query = jest.fn().mockReturnValue(response$);

      const query$ = service.getDownloadTodayEventLog('hearingId123', 'date');

      expect(query$).toBeObservable(expected$);

      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/event-log/extract?hearingId=hearingId123&hearingDate=date',
        requestType: 'application/vnd.hearing.get-hearing-event-log-extract-for-documents+json',
        responseType: 'blob'
      });
    });
  });

  describe('DownloadFullEventLog', () => {
    it('should download full hearing event logs', () => {
      const response$ = cold('-a|', { a: new Blob(['textstream']) });
      const expected$ = cold('-b|', { b: new Blob(['textstream']) });

      http.query = jest.fn().mockReturnValue(response$);

      const query$ = service.getDownloadFullEventLog('hearingId123');

      expect(query$).toBeObservable(expected$);

      expect(http.query).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/hearings/event-log/extract?hearingId=hearingId123',
        requestType: 'application/vnd.hearing.get-hearing-event-log-extract-for-documents+json',
        responseType: 'blob'
      });
    });
  });
});
