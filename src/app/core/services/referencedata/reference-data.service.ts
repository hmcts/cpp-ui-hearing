import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CppHttp } from '@cpp/core';
import { AlcoholLevelMethod, JudicialMember, SelectedJudiciaryOptions } from '../../model';
import { toHttpParams } from '../../utils/utils';

@Injectable()
export class ReferenceDataService {
  constructor(private readonly api: CppHttp) {}

  getJudicialMembersByIds(ids: string[]): Observable<JudicialMember[]> {
    const concatenatedIds = ids.join(',');
    return this.getJudicialMembers({ ids: concatenatedIds });
  }

  getJudicialMembersByNamePattern(namePattern: string, limit = 20): Observable<JudicialMember[]> {
    return this.getJudicialMembersWithLocation({ search: namePattern, limit });
  }

  private getJudicialMembers(options: SelectedJudiciaryOptions): Observable<JudicialMember[]> {
    const params = toHttpParams(options);
    return this.api
      .query<{ judiciaries: JudicialMember[] }>({
        url: `/referencedata-query-api/query/api/rest/referencedata/judiciaries`,
        requestType: 'application/vnd.reference-data.judiciaries+json',
        params
      })
      .pipe(map(res => res.judiciaries));
  }

  private getJudicialMembersWithLocation(
    options: SelectedJudiciaryOptions
  ): Observable<JudicialMember[]> {
    const params = toHttpParams(options);
    return this.api
      .query<{ judiciaries: JudicialMember[] }>({
        url: `/referencedata-query-api/query/api/rest/referencedata/judiciaries`,
        requestType: 'application/vnd.reference-data.judiciaries.all+json',
        params
      })
      .pipe(map(res => res.judiciaries));
  }

  getAlcoholLevelMethod(): Observable<AlcoholLevelMethod[]> {
    return this.api
      .query<{ alcoholLevelMethods: AlcoholLevelMethod[] }>({
        url: `/referencedata-query-api/query/api/rest/referencedata/alcohol-level-methods`,
        requestType: 'application/vnd.referencedata.alcohol-level-methods+json'
      })
      .pipe(map(res => res.alcoholLevelMethods));
  }
}
