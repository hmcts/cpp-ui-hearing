/**/
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import { CppHttp } from '@cpp/core';
import { constructApiEndPointUrl } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class CrackedIneffectiveSubReasonService {
  constructor(private http: CppHttp) {}

  getSubReasons(): Observable<CrackedIneffectiveSubReason[]> {
    return this.http
      .query<{ crackedIneffectiveSubReasons: CrackedIneffectiveSubReason[] }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'cracked-ineffective-sub-reasons'),
        requestType: 'application/vnd.referencedata.query.cracked-ineffective-sub-reasons+json'
      })
      .pipe(map(response => response.crackedIneffectiveSubReasons || []));
  }

  getSubReasonById(subReasonId: string): Observable<CrackedIneffectiveSubReason> {
    return this.http
      .query<{ crackedIneffectiveSubReason: CrackedIneffectiveSubReason }>({
        url: constructApiEndPointUrl('referenceDataQuery', 'cracked-ineffective-sub-reasons'),
        requestType: 'application/vnd.referencedata.query.cracked-ineffective-sub-reason+json',
        params: new HttpParams().set('subReasonId', subReasonId)
      })
      .pipe(map(response => response.crackedIneffectiveSubReason));
  }
}
