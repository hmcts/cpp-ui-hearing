import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OffenceType } from '../../model';
import { CppHttp } from '@cpp/core';
import { map } from 'rxjs/operators';

const baseUrl = '/referencedataoffences-query-api/query/api/rest/referencedataoffences/offences/';
@Injectable({
  providedIn: 'root'
})
export class ReferenceDataOffenceService {
  constructor(private readonly api: CppHttp) {}

  searchOffenceTypes(query: string, limit: number, offenceDate: string): Observable<OffenceType[]> {
    const offenceDateQuery = `&offenceDate=${offenceDate}`;
    return this.api
      .query<{ offences: OffenceType[] }>({
        url: `${baseUrl}search?q=${query}&limit=${limit}${offenceDate ? offenceDateQuery : ''}`,
        requestType: 'application/vnd.referencedataoffences.offences-search+json'
      })
      .pipe(map(res => res.offences));
  }
}
