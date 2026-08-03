import * as ApiActions from '../actions/api';
import { ApiAction } from '../actions/api';

export interface ApiState {
  requests: any[];
  errors: any[];
}

export const initialState: ApiState = {
  requests: [],
  errors: []
};

export function apiReducer(state: ApiState = initialState, action: ApiAction): ApiState {
  switch (action.type) {
    case ApiActions.API_REQUEST:
      return {
        ...state,
        requests: [...state.requests, action.request]
      };

    case ApiActions.API_RESPONSE:
      return {
        ...state,
        requests: state.requests.filter(req => req !== action.request)
      };

    case ApiActions.API_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.response]
      };

    default:
      return state;
  }
}
