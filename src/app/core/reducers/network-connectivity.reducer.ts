import { NetworkConnectivityActions, NETWORK_CONNECTIVITY } from '../actions';

export type OnlineState = boolean;

export function onlineReducer(state: boolean = false, action: NetworkConnectivityActions): boolean {
  switch (action.type) {
    case NETWORK_CONNECTIVITY:
      return action.online;

    default:
      return state;
  }
}
