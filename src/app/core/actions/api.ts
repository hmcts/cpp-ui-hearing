import { Action } from '@ngrx/store';
import { RequestOptions } from '../services';

export const API_REQUEST = 'API_REQUEST';
export const API_RESPONSE = 'API_RESPONSE';
export const API_ERROR = 'API_ERROR ';

export class PendingApiRequest implements Action {
  readonly type = API_REQUEST;

  constructor(public readonly request: RequestOptions) {}
}

export class CompletedApiRequest implements Action {
  readonly type = API_RESPONSE;

  constructor(public readonly request: RequestOptions) {}
}

export class ApiError implements Action {
  readonly type = API_ERROR;

  constructor(public readonly response: any) {}
}

export type ApiAction = PendingApiRequest | CompletedApiRequest | ApiError;
