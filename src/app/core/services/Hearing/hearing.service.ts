/**/
import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { UserDetails } from '@cpp/users-groups';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HearingSummary as MagistratesHearingSummary } from '../../../magistrates/interfaces/magistrates-hearing.interface';
import { VacateTrialParams } from '../../../trial-outcome/vacate-trial.interfaces';
import {
  AmendmentReason,
  ApplicantCounsel,
  CheckInHearingSummary,
  CompanyRepresentative,
  CourtApplication,
  CourtApplicationResponse,
  CourtApplicationResponseType,
  DefenceCounsel,
  ElectronicMonitoringDefendant,
  EventDefinition,
  EventInfo,
  EventLog,
  EventLogCountInfo,
  ExtendMagistratesAccessPermission,
  HearingCaseNotes,
  HearingDetailResponse,
  HearingSummary,
  IntermediaryCounsel,
  PleaUpdate,
  ProsecutionCounsel,
  RespondentCounsel,
  TrialType,
  TrialTypeBody,
  UpdateDefendantAttendance,
  VerdictType,
  VerdictUpdate
} from '../../model';
import { CourtApplicationOutcomeType } from '../../model/court-application-outcome-type';
import { MotReason } from '../../model/mot-reason';
import { SentencingIndication } from '../../model/sentencing-indication';
import { constructApiEndPointUrl, downloadResponse } from '../../utils/utils';
import { MANAGE_RESULTS_FAILED_PUBLIC_EVENT } from '../..';
import { IdpcIngestionParams, IdpcIngestionResponse } from '../../model/idpc-ingestion';

@Injectable({ providedIn: 'root' })
export class HearingService {
  constructor(private api: CppHttp) {}

  getHearingsByDate(
    date: string,
    courtCentreId: string,
    roomId?: string,
    startTime?: string,
    endTime?: string
  ): Observable<HearingSummary[]> {
    let httpParams = new HttpParams().set('date', date).set('courtCentreId', courtCentreId);

    if (roomId) {
      httpParams = httpParams.set('roomId', roomId);
    }

    if (startTime) {
      httpParams = httpParams.set('startTime', startTime);
    }

    if (endTime) {
      httpParams = httpParams.set('endTime', endTime);
    }

    return this.api
      .query<{ hearingSummaries: HearingSummary[] }>({
        url: '/hearing-query-api/query/api/rest/hearing/hearings',
        requestType: 'application/vnd.hearing.get.hearings+json',
        params: httpParams
      })
      .pipe(map(res => res.hearingSummaries));
  }

  getHearingsForCheckIn(date: string, courtCentreId: string): Observable<CheckInHearingSummary[]> {
    const httpParams = new HttpParams().set('date', date).set('courtCentreId', courtCentreId);

    return this.api
      .query<{ hearingSummaries: CheckInHearingSummary[] }>({
        url: '/hearing-query-api/query/api/rest/hearing/hearings-check-in',
        requestType: 'application/vnd.hearing.get.hearings-check-in+json',
        params: httpParams
      })
      .pipe(map(res => res.hearingSummaries));
  }

  getHearing(hearingId: string): Observable<HearingDetailResponse> {
    return this.api
      .query<HearingDetailResponse>({
        url: constructApiEndPointUrl('hearingQuery', 'hearings', hearingId),
        requestType: 'application/vnd.hearing.get.hearing+json'
      })
      .pipe(
        map(hearingDetails => {
          const { courtApplicationAdditionalFields, hearing, ...hearingDetailResponse } =
            hearingDetails;
          if (courtApplicationAdditionalFields && hearing) {
            const courtApplications: CourtApplication[] = (hearing.courtApplications || []).map(
              application => {
                if (courtApplicationAdditionalFields[application.id]) {
                  return {
                    ...application,
                    ...courtApplicationAdditionalFields[application.id]
                  };
                }
                return application;
              }
            );

            return {
              ...hearingDetailResponse,
              hearing: { ...hearing, courtApplications }
            } as HearingDetailResponse;
          }

          return {
            ...hearingDetailResponse,
            hearing
          };
        })
      );
  }

  getUserDetails(userId: string): Observable<UserDetails> {
    return this.api.query<UserDetails>({
      url: `/usersgroups-query-api/query/api/rest/usersgroups/users/${userId}`,
      requestType: 'application/vnd.usersgroups.user-details+json'
    });
  }

  getHearingEventDefinitions(): Observable<EventDefinition[]> {
    return this.api
      .query<{ eventDefinitions: EventDefinition[] }>({
        url: constructApiEndPointUrl('hearingQuery', 'event-definitions'),
        requestType: 'application/vnd.hearing.hearing-event-definitions+json'
      })
      .pipe(map(res => res.eventDefinitions));
  }

  getHearingEventsLogged(hearingId: string, selectedHearingDate: string): Observable<EventInfo> {
    return this.api.query<EventInfo>({
      url: constructApiEndPointUrl('hearingQuery', 'hearings', hearingId, 'event-log'),
      requestType: 'application/vnd.hearing.hearing-event-log+json',
      params: new HttpParams().set('date', selectedHearingDate)
    });
  }

  logEventForHearing(hearingId: string, body: EventLog): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/event`,
      requestType: 'application/vnd.hearing.log-hearing-event+json',
      body,
      successEvent: 'public.hearing.event-logged'
    });
  }

  correctEventForHearing(
    hearingId: string,
    hearingEventId: string,
    body: Omit<EventLog, 'hearingEventId'>
  ): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/event/${hearingEventId}`,
      requestType: 'application/vnd.hearing.correct-hearing-event+json',
      body
    });
  }

  updatePleas(hearingId: string, body: PleaUpdate): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-plea+json',
      successEvent: 'public.hearing.plea-updated',
      errorEvent: 'public.hearing.update-plea-ignored',
      body
    });
  }

  updateVerdicts(hearingId: string, body: VerdictUpdate): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-verdict+json',
      successEvent: 'public.hearing.verdict-updated',
      errorEvent: 'public.hearing.update-verdict-ignored',
      body
    });
  }

  saveNewNote(hearingId: string, hearingCaseNote: HearingCaseNotes): Observable<unknown> {
    const body = { hearingCaseNote };
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.save-hearing-case-note+json',
      body
    });
  }

  updateDefendantAttendance(body: UpdateDefendantAttendance): Observable<unknown> {
    return this.api.command({
      url: '/hearing-command-api/command/api/rest/hearing/hearings/',
      requestType: 'application/vnd.hearing.update-defendant-attendance-on-hearing-day+json',
      body
    });
  }

  addProsecutionCounsel(hearingId: string, body: ProsecutionCounsel): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-prosecution-counsel+json',
      body: { prosecutionCounsel: body }
    });
  }

  updateProsecutionCounsel(hearingId: string, pc: ProsecutionCounsel): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-prosecution-counsel+json',
      body: { prosecutionCounsel: pc }
    });
  }

  removeProsecutionCounsel(hearingId: string, pc: { id: string }): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.remove-prosecution-counsel+json',
      body: pc
    });
  }

  addDefenceCounsel(hearingId: string, body: DefenceCounsel): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-defence-counsel+json',
      body: {
        defenceCounsel: body,
        hearingId
      }
    });
  }

  updateDefenceCounsel(hearingId: string, pc: DefenceCounsel): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-defence-counsel+json',
      body: {
        defenceCounsel: pc,
        hearingId
      }
    });
  }

  removeDefenceCounsel(hearingId: string, dc: { id: string }): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.remove-defence-counsel+json',
      body: dc
    });
  }

  addCompanyRepresentative(hearingId: string, body: CompanyRepresentative): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-company-representative+json',
      body: {
        companyRepresentative: body,
        hearingId
      }
    });
  }

  updateCompanyRepresentative(hearingId: string, rep: CompanyRepresentative): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-company-representative+json',
      body: {
        companyRepresentative: rep,
        hearingId
      }
    });
  }

  removeCompanyRepresentative(hearingId: string, rep: { id: string }): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.remove-company-representative+json',
      body: rep
    });
  }

  updateApplicationResponse(body: {
    applicationPartyId: string;
    applicationResponse: CourtApplicationResponse;
  }): Observable<unknown> {
    return this.api.command({
      url:
        '/hearing-command-api/command/api/rest/hearing/hearings/' +
        body.applicationResponse.originatingHearingId,
      requestType: 'application/vnd.hearing.save-application-response+json',
      body: body
    });
  }

  addApplicantCounsel(hearingId: string, applicantCounsel: ApplicantCounsel): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-applicant-counsel+json',
      body: { applicantCounsel }
    });
  }

  updateApplicantCounsel(hearingId: string, applicantCounsel: ApplicantCounsel): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-applicant-counsel+json',
      body: { applicantCounsel: applicantCounsel }
    });
  }

  removeIntermediaryCounsel(hearingId: string, intermediaryCounselId: string): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.remove-interpreter-intermediary+json',
      body: { id: intermediaryCounselId }
    });
  }

  addIntermediaryCounsel(
    hearingId: string,
    interpreterIntermediary: IntermediaryCounsel
  ): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-interpreter-intermediary+json',
      body: { interpreterIntermediary }
    });
  }

  updateIntermediaryCounsel(
    hearingId: string,
    intermediaryCounsel: IntermediaryCounsel
  ): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-interpreter-intermediary+json',
      body: { interpreterIntermediary: intermediaryCounsel }
    });
  }

  removeApplicantCounsel(hearingId: string, applicantCounselId: string): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.remove-applicant-counsel+json',
      body: { id: applicantCounselId }
    });
  }

  addRespondentCounsel(hearingId: string, respondentCounsel: RespondentCounsel): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-respondent-counsel+json',
      body: { respondentCounsel }
    });
  }

  setTrialType(hearingId: string, trialTypeBody: TrialTypeBody): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.set-trial-type+json',
      body: trialTypeBody
    });
  }

  vacateTrial({
    hearingId,
    vacatedTrialReasonId,
    crackedIneffectiveSubReasonId
  }: VacateTrialParams) {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.set-trial-type+json',
      body: {
        vacatedTrialReasonId,
        crackedIneffectiveSubReasonId
      },
      successEvent: 'public.hearing.trial-vacated'
    });
  }

  markAsDuplicate(hearingId: string) {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.duplicate.v2+json',
      successEvent: 'public.events.hearing.marked-as-duplicate'
    });
  }

  removeOffencesForHearing(hearingId: string, offenceIds: string[]) {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/remove-offences-from-existing-hearing`,
      requestType: 'application/vnd.hearing.remove-offences-from-existing-hearing+json',
      successEvent: 'public.hearing.selected-offences-removed-from-existing-hearing',
      body: {
        hearingId,
        offenceIds
      }
    });
  }

  updateRespondentCounsel(
    hearingId: string,
    respondentCounsel: RespondentCounsel
  ): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.update-respondent-counsel+json',
      body: { respondentCounsel: respondentCounsel }
    });
  }

  removeRespondentCounsel(hearingId: string, respondentCounselId: string): Observable<any> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.remove-respondent-counsel+json',
      body: { id: respondentCounselId }
    });
  }

  getMotReasons(): Observable<MotReason[]> {
    return this.api
      .query<{ modeOfTrialReasons: MotReason[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'mode-of-trial-reasons'),
        requestType: 'application/vnd.referencedata.mode-of-trial-reasons+json'
      })
      .pipe(map((res: { modeOfTrialReasons: MotReason[] }) => res.modeOfTrialReasons));
  }

  getSentencingIndications(): Observable<SentencingIndication[]> {
    return this.api
      .query<{ sentencingIndications: SentencingIndication[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'sentencing-indication'),
        requestType: 'application/vnd.referencedata.query.get.sentencing-indication+json'
      })
      .pipe(
        map((res: { sentencingIndications: SentencingIndication[] }) => res.sentencingIndications)
      );
  }

  downloadPDFCourtDocument(materialId: string): Observable<Blob> {
    const url = constructApiEndPointUrl(
      'progressionQuery',
      'material',
      'nows',
      materialId,
      'content'
    );
    return this.api
      .query<Blob>({
        url,
        requestType: 'application/vnd.progression.query.material-nows-content+json',
        responseType: 'blob'
      })
      .pipe(map(downloadResponse));
  }

  getLoggedInUserDetails(): Observable<UserDetails> {
    const url = constructApiEndPointUrl('userGroupsQuery', 'users', 'logged-in-user');
    return this.api.query<UserDetails>({
      url,
      requestType: 'application/vnd.usersgroups.logged-in-user-details+json'
    });
  }

  getVerdictTypes(): Observable<VerdictType[]> {
    return this.api
      .query<{ verdictTypes: VerdictType[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'verdict-types'),
        requestType: 'application/vnd.reference-data.verdict-types+json'
      })
      .pipe(map(res => res.verdictTypes));
  }

  getAmendmentReasons(): Observable<AmendmentReason[]> {
    return this.api
      .query<{ amendmentReasons: AmendmentReason[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'amendment-reasons'),
        requestType: 'application/vnd.referencedata.amendment-reasons+json'
      })
      .pipe(map(res => res.amendmentReasons));
  }

  getTrialTypes(): Observable<TrialType[]> {
    return this.api
      .query<{ crackedIneffectiveVacatedTrialTypes: TrialType[] }>({
        url: constructApiEndPointUrl(
          'referenceDataQuery',
          'cracked-ineffective-vacated-trial-types'
        ),
        requestType: 'application/vnd.referencedata.cracked-ineffective-vacated-trial-types+json'
      })
      .pipe(map(res => res.crackedIneffectiveVacatedTrialTypes));
  }

  getApplicationOutcomeTypes(id: string): Observable<CourtApplicationOutcomeType[]> {
    return this.api
      .query<{ courtApplicationOutcomeTypes: CourtApplicationOutcomeType[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'application-type-outcomes', id),
        requestType: 'application/vnd.referencedata.application-type-outcomes+json'
      })
      .pipe(map(res => res.courtApplicationOutcomeTypes));
  }

  getApplicationResponseTypes(id: string): Observable<CourtApplicationResponseType[]> {
    return this.api
      .query<{ courtApplicationResponseTypes: CourtApplicationResponseType[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'application-type-responses', id),
        requestType: 'application/vnd.reference-data.application-type-responses+json'
      })
      .pipe(map(res => res.courtApplicationResponseTypes));
  }

  checkInAsDefence(hearingId: string, body: DefenceCounsel): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-defence-counsel+json',
      successEvent: 'public.hearing.defence-counsel-added',
      errorEvent: 'public.hearing.defence-counsel-change-ignored',
      body: {
        defenceCounsel: body,
        hearingId
      }
    });
  }

  checkInAsProsecution(hearingId: string, body: ProsecutionCounsel): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-prosecution-counsel+json',
      successEvent: 'public.hearing.prosecution-counsel-added',
      errorEvent: 'public.hearing.prosecution-counsel-change-ignored',
      body: { prosecutionCounsel: body }
    });
  }

  getHearingsForToday() {
    return this.api
      .query<{ hearingSummaries: MagistratesHearingSummary[] }>({
        url: constructApiEndPointUrl('hearingQuery', 'hearings-for-today'),
        requestType: 'application/vnd.hearing.get.hearings-for-today+json'
      })
      .pipe(map(res => res.hearingSummaries));
  }

  extendMagistratesAccess(body: ExtendMagistratesAccessPermission): Observable<unknown> {
    return this.api.commandSync({
      url: '/usersgroups-command-api/command/api/rest/usersgroups/extend-permissions',
      requestType: 'application/vnd.usersgroups.extend-permissions+json',
      successEvent: 'public.usersgroups.permission-changed',
      body
    });
  }

  setYouthCourtDefendants(
    hearingId: string,
    youthCourtDefendantIds: string[]
  ): Observable<unknown> {
    return this.api.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.youth-court-defendants+json',
      body: { youthCourtDefendantIds }
    });
  }

  getDefendantsTrackingStatus(defendantIds: string[]): Observable<ElectronicMonitoringDefendant[]> {
    const ids = defendantIds.join(',');
    return this.api
      .query<{ defendants: ElectronicMonitoringDefendant[] }>({
        url: '/results-query-api/query/api/rest/results/defendants?defendantIds=' + ids,
        requestType: 'application/vnd.results.get-defendants-tracking-status+json'
      })
      .pipe(map(res => res.defendants));
  }

  unlockHearing(hearingId: string, hearingDay: string): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.unlock-hearing+json',
      successEvent: 'public.hearing.result-amendments-cancelled',
      errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      body: { hearingDay }
    });
  }

  addWitness(hearingId: string, witness: string): Observable<unknown> {
    return this.api.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.add-witness+json',
      successEvent: 'public.hearing.hearing-witness-added',
      body: {
        witness
      }
    });
  }

  getHearingEventsLogCount(
    hearingId: string,
    selectedHearingDate: string
  ): Observable<EventLogCountInfo> {
    return this.api.query<EventLogCountInfo>({
      url:
        '/hearing-query-api/query/api/rest/hearing/hearings/event-log-count?hearingId=' +
        hearingId +
        '&hearingDate=' +
        selectedHearingDate,
      requestType: 'application/vnd.hearing.get-hearing-event-log-count+json'
    });
  }

  getDownloadTodayEventLog(hearingId: string, selectedHearingDate: string): Observable<any> {
    return this.api
      .query<Blob>({
        url:
          '/hearing-query-api/query/api/rest/hearing/hearings/event-log/extract?hearingId=' +
          hearingId +
          '&hearingDate=' +
          selectedHearingDate,
        requestType: 'application/vnd.hearing.get-hearing-event-log-extract-for-documents+json',
        responseType: 'blob'
      })
      .pipe(map(response => new Blob([response], { type: response.type })));
  }

  getDownloadFullEventLog(hearingId: string): Observable<any> {
    return this.api
      .query<Blob>({
        url:
          '/hearing-query-api/query/api/rest/hearing/hearings/event-log/extract?hearingId=' +
          hearingId,
        requestType: 'application/vnd.hearing.get-hearing-event-log-extract-for-documents+json',
        responseType: 'blob'
      })
      .pipe(map(response => new Blob([response], { type: response.type })));
  }

  ingestIdpcs(ingestParams: IdpcIngestionParams): Observable<IdpcIngestionResponse> {
    return this.api
      .command({
        url: '/casedocumentknowledge-service/ingestions/start',
        requestType: 'application/vnd.casedocumentknowledge-service.ingestion-process+json',
        body: ingestParams
      })
      .pipe(
        map((response: HttpResponse<string>) => JSON.parse(response.body) as IdpcIngestionResponse)
      );
  }
}
