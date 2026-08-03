import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CppHttp } from '@cpp/core';
import { UserDetails, SelectedUsersOptions } from '../../model';
import { toHttpParams } from '../../utils/utils';
import { UserOrganisation } from '@cpp/users-groups';

@Injectable()
export class UserGroupsService {
  constructor(private readonly api: CppHttp) {}

  getUsersByIds(ids: string[]): Observable<UserDetails[]> {
    const concatenatedIds = ids.join(',');
    return this.getUsers({ userIds: concatenatedIds });
  }

  getUsersForGroupByGroupName(groupName: string): Observable<UserDetails[]> {
    return this.getUsers({ groupName });
  }

  // move to ui.core and define appropriate schema
  saveCheckAndChallengeReason(target: string, description: string) {
    return this.api.commandSync({
      url: `/usersgroups-query-api/command/api/rest/usersgroups/permissions`,
      requestType: 'application/vnd.usersgroups.create-permission-for-user-to-view-case+json',
      successEvent: 'public.usersgroups.permission-created',
      body: {
        caseId: target,
        description
      }
    });
  }

  private getUsers(options: SelectedUsersOptions): Observable<UserDetails[]> {
    const params = toHttpParams(options);

    return this.api
      .query<{ users: UserDetails[] }>({
        url: '/usersgroups-query-api/query/api/rest/usersgroups/users',
        requestType: 'application/vnd.usersgroups.search-users+json',
        params
      })
      .pipe(map(res => res.users));
  }

  getOrganisationDetails(organisationId: string): Observable<UserOrganisation> {
    return this.api.query<UserOrganisation>({
      url: `/usersgroups-query-api/query/api/rest/usersgroups/organisations/${organisationId}`,
      requestType: 'application/vnd.usersgroups.get-organisation-details+json'
    });
  }
}
