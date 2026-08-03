import { AppState } from '../reducers';

export const getOnlineStatus = (state: AppState) => state.online;
