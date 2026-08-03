import { Action } from '@ngrx/store';

export const NETWORK_CONNECTIVITY = 'NETWORK_CONNECTIVITY';

export class NetworkConnectivityAction implements Action {
  readonly type = NETWORK_CONNECTIVITY;

  constructor(public readonly online: boolean) {}
}

export type NetworkConnectivityActions = NetworkConnectivityAction;
