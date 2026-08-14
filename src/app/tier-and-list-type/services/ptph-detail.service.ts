import { inject, Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable } from 'rxjs';
import { constructApiEndPointUrl } from '../../core/utils/utils';
import { PtphDetail, SavePtphDetailPayload } from '../models/ptph-detail.model';

const SAVE_REQUEST_TYPE = 'application/vnd.hearing.save-ptph-detail+json';
const FINALISE_REQUEST_TYPE = 'application/vnd.hearing.finalise-ptph-detail+json';
const DELETE_REQUEST_TYPE = 'application/vnd.hearing.delete-ptph-detail+json';
const GET_REQUEST_TYPE = 'application/vnd.hearing.get-ptph-detail+json';

const SAVED_EVENT = 'public.hearing.ptph-detail-saved';
const FINALISED_EVENT = 'public.hearing.ptph-detail-finalised';
const DELETED_EVENT = 'public.hearing.ptph-detail-deleted';

const EMPTY_COMMAND_BODY = {};

@Injectable({ providedIn: 'root' })
export class PtphDetailService {
  private readonly api = inject(CppHttp);

  getPtphDetail(hearingId: string): Observable<PtphDetail> {
    return this.api.query<PtphDetail>({
      url: constructApiEndPointUrl('hearingQuery', 'hearings', hearingId, 'ptph-detail'),
      requestType: GET_REQUEST_TYPE
    });
  }

  savePtphDetail(payload: SavePtphDetailPayload): Observable<object> {
    return this.api.commandSync({
      url: this.hearingCommandUrl(payload.hearingId),
      requestType: SAVE_REQUEST_TYPE,
      successEvent: SAVED_EVENT,
      body: this.withoutEmptyValues(payload)
    });
  }

  finalisePtphDetail(hearingId: string): Observable<object> {
    return this.api.commandSync({
      url: this.hearingCommandUrl(hearingId),
      requestType: FINALISE_REQUEST_TYPE,
      successEvent: FINALISED_EVENT,
      body: EMPTY_COMMAND_BODY
    });
  }

  deletePtphDetail(hearingId: string): Observable<object> {
    return this.api.commandSync({
      url: this.hearingCommandUrl(hearingId),
      requestType: DELETE_REQUEST_TYPE,
      successEvent: DELETED_EVENT,
      body: EMPTY_COMMAND_BODY
    });
  }

  private hearingCommandUrl(hearingId: string): string {
    return constructApiEndPointUrl('hearingCommand', 'hearings', hearingId);
  }

  private withoutEmptyValues(payload: SavePtphDetailPayload): SavePtphDetailPayload {
    const { hearingId, tier, listType, keyReason } = payload;

    return {
      hearingId,
      tier,
      ...(listType ? { listType } : {}),
      ...(keyReason?.trim() ? { keyReason: keyReason.trim() } : {})
    };
  }
}
