import { RequiredPermission } from '@cpp/users-groups';
import { InjectionToken } from '@angular/core';

export interface HearingUserPermissions<T extends RequiredPermission = RequiredPermission> {
  editCrackedIneffective: T;
  hearingAccess: T;
  viewHearingList: T;
  userGrantAccess: T;
  viewCpSearch: T;
  viewHearing: T;
  viewIntelligence: T;
}

/**
 * An injection token to hold all expected permissions for this hearing context users. Use this token
 * by simply injecting it into a component where necessary.
 * Update this token with additional permissions as per requirement.
 */
export const EXPECTED_HEARING_USER_PERMISSIONS = new InjectionToken<HearingUserPermissions>(
  'User Permissions',
  {
    providedIn: 'root',
    factory: () => userPermissions
  }
);

export const userPermissions: HearingUserPermissions = {
  editCrackedIneffective: {
    object: 'CrackedIneffective',
    action: 'Edit'
  },
  hearingAccess: {
    object: 'HearingAccess',
    action: 'Extend'
  },
  viewHearingList: {
    object: 'ViewHearingList',
    action: 'View'
  },
  userGrantAccess: {
    object: 'GrantExtendedHearingAccess',
    action: 'GrantAccess'
  },
  viewCpSearch: {
    object: 'CP Search',
    action: 'View'
  },
  viewHearing: {
    object: 'CaseAccess',
    action: 'View'
  },
  viewIntelligence: {
    action: 'View',
    object: 'AI search'
  }
};
