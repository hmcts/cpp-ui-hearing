import { UsersGroupsActions } from '@cpp/users-groups';
import { combineReducers } from '@ngrx/store';
import { reducers } from '../reducers';
import { getPermissionIdFromMap, getIsLegalAdviserUser } from './extend-magistrates-access';

describe('extend-magistrates-access selectors', () => {
  const appReducer = combineReducers(reducers);

  describe('getIsLegalAdviserUser', () => {
    it('should return true when user belongs to the `Legal Advisers` group', () => {
      const state = appReducer(
        undefined,
        UsersGroupsActions.setUserGroups({
          userGroups: [
            {
              groupId: '*',
              groupName: 'Legal Advisers',
              prosecutingAuthority: 'ALL',
              description: 'Listing Advisers description'
            }
          ]
        })
      );
      expect(getIsLegalAdviserUser(state)).toEqual(true);
    });

    it('should return false when user does not belong to the `Legal Advisers` group', () => {
      const state = appReducer(
        undefined,
        UsersGroupsActions.setUserGroups({
          userGroups: [
            {
              groupId: '*',
              groupName: 'Magistrates',
              prosecutingAuthority: 'ALL',
              description: 'Listing Advisers description'
            }
          ]
        })
      );
      expect(getIsLegalAdviserUser(state)).toEqual(false);
    });
  });

  describe('getExtendedHearingAccessPermissionId', () => {
    it('should return permissionId when user has `HearingAccess` permission', () => {
      const state = appReducer(
        undefined,
        UsersGroupsActions.setUserPermissions({
          permissions: [
            {
              action: 'Extend',
              object: 'HearingAccess',
              permissionId: 'e7f1b18b-03cc-4356-9c2e-5e069d7e8825',
              description: 'Permission to extend hearing access',
              target: '6c43d69a-b77e-4819-a6d5-b6578c21bdc6'
            }
          ]
        })
      );
      const permissionId = 'e7f1b18b-03cc-4356-9c2e-5e069d7e8825';
      expect(
        getPermissionIdFromMap(
          'Extend',
          'HearingAccess',
          '6c43d69a-b77e-4819-a6d5-b6578c21bdc6'
        )(state)
      ).toEqual(permissionId);
    });

    it('should return empty string when user does not have `HearingAccess` permission', () => {
      const state = appReducer(
        undefined,
        UsersGroupsActions.setUserPermissions({
          permissions: [
            {
              action: 'Extend',
              object: 'GrantExtendedHearingAccess',
              permissionId: 'e7f1b18b-03cc-4356-9c2e-5e069d7e8825',
              description: 'Permission to extend hearing access',
              target: 'e39210eb-6fc9-4d23-b2fa-50fed11b03f3'
            }
          ]
        })
      );
      expect(getPermissionIdFromMap('Extend', 'HearingAccess')(state)).toEqual(undefined);
    });
  });
});
