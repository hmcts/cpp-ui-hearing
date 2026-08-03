export interface UserDetails {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  prosecutingAuthorityAccess?: string;
}

export interface SelectedUsersOptions {
  groupName?: string;
  email?: string;
  userIds?: string;
}
