import { createSelector } from '@ngrx/store';
import {
  getAllUserRolePermissionIds,
  getUserGroups,
  getUserRolePermissionsMap
} from '@cpp/users-groups';

export const getIsLegalAdviserUser = createSelector(getUserGroups, userGroups =>
  (userGroups || []).some(userGroup => userGroup.groupName === 'Legal Advisers')
);

export const getPermissionIdFromMap = (action: string, object: string, target?: string) =>
  createSelector(
    getUserRolePermissionsMap,
    getAllUserRolePermissionIds,
    (permissionsMap, permissionIds) =>
      permissionIds.find(id => {
        const permission = permissionsMap[id];
        if (permission) {
          return (
            permission.action.toLowerCase() === action.toLowerCase() &&
            permission.object.toLowerCase() === object.toLowerCase() &&
            permission.target === target
          );
        }
        return false;
      })
  );
