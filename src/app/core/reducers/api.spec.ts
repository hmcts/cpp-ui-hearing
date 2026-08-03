import { PendingApiRequest, CompletedApiRequest, ApiError } from '../actions';
import { apiReducer, ApiState } from './api';

const url = '/resultinghmps-query-api/query/api/rest/resultinghmps/people/1/hearings/1';
const requestType = 'application/vnd.resultinghmps.person-details+json';

const request1 = { url, requestType };
const request2 = { url, requestType };

describe('apiReducer', () => {
  const mockedApiState = {
    requests: [],
    errors: []
  } as ApiState;

  it('should add any pending api requests to the list of in-flight requests', () => {
    const state = mockedApiState;
    const firstState = apiReducer(state, new PendingApiRequest(request1));
    const secondState = apiReducer(firstState, new PendingApiRequest(request2));
    expect(secondState.requests).toEqual([request1, request2]);
  });

  it('should remove any completed requests from the list of in-flight requests', () => {
    const state = {
      requests: [request1, request2],
      errors: []
    } as ApiState;
    const actual = apiReducer(state, new CompletedApiRequest(request1));
    expect(actual.requests).toEqual([request2]);
  });

  it('should add any api errors to the list of errors', () => {
    const networkError = 'Network Error';
    const state = mockedApiState;
    const actual = apiReducer(state, new ApiError(networkError));
    expect(actual.errors).toEqual([networkError]);
  });
});
