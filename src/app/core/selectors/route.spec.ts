import { AppState } from '../reducers';
import * as routeSelectors from './route';

const initialState = {
  router: {
    state: {
      url: '/manage/test-hearing-id/enter-results-related-hearings?jurisdictionType=CROWN',
      queryParams: {
        jurisdictionType: 'CROWN'
      },
      params: {
        hearingId: 'test-hearing-id'
      }
    }
  }
} as any as AppState;

describe('route selectors', () => {
  it('should getRouteParameters', () => {
    expect(routeSelectors.getRouteParameters(initialState)).toStrictEqual({
      hearingId: 'test-hearing-id'
    });
  });

  it('should getRouteParameter and return empty', () => {
    expect(routeSelectors.getRouteParameters({} as any as AppState)).toStrictEqual({});
  });

  it('should getRouteQueryParams', () => {
    expect(routeSelectors.getRouteQueryParams(initialState)).toStrictEqual({
      jurisdictionType: 'CROWN'
    });
  });

  it('should getRouteQueryParams and return empty', () => {
    expect(routeSelectors.getRouteQueryParams({} as any as AppState)).toStrictEqual({});
  });

  it('should getRouteUrl', () => {
    expect(routeSelectors.getRouteUrl(initialState)).toStrictEqual(
      '/manage/test-hearing-id/enter-results-related-hearings?jurisdictionType=CROWN'
    );
  });
});
