import { UserService } from '@cpp/users-groups';
import { AppState } from '../reducers';

export const getFeatures = (state: AppState) =>
  (state.usersGroups.userServices &&
    mapUserServicesToUserFeatures(state.usersGroups.userServices)) ||
  null;

const mapUserServicesToUserFeatures = (services: UserService[]) =>
  services.reduce((allFeatures: string[], service: UserService) => {
    return [...allFeatures, ...service.features.map(({ key }) => key)];
  }, []);
