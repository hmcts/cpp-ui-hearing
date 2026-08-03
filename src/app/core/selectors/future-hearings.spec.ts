import * as selectors from './future-hearings';
import { AppState } from '../reducers';
import { mockSummary } from '../../mock-data/test-mock-data';

describe('Future hearings selectors', () => {
  describe('getFutureHearings', () => {
    it('should return no hearings', () => {
      const state = {
        futureHearings: {
          hearings: []
        }
      } as AppState;
      expect(selectors.getFutureHearings(state)).toMatchSnapshot();
    });
    it('should return 1 hearing', () => {
      const state = {
        futureHearings: {
          hearings: [mockSummary]
        }
      } as AppState;
      expect(selectors.getFutureHearings(state)).toMatchSnapshot();
    });
  });

  describe('getHasFutureHearings', () => {
    it('should return false', () => {
      const state = {
        futureHearings: {
          hearings: []
        }
      } as AppState;
      expect(selectors.getHasFutureHearings(state)).toMatchSnapshot();
    });
    it('should return true', () => {
      const state = {
        futureHearings: {
          hearings: [mockSummary]
        }
      } as AppState;
      expect(selectors.getHasFutureHearings(state)).toMatchSnapshot();
    });
  });

  describe('getShowFutureHearingsRemovedAlert', () => {
    it('should return false', () => {
      const state = {
        futureHearings: {}
      } as AppState;
      expect(selectors.getHasFutureHearings(state)).toMatchSnapshot();
    });
    it('should return true', () => {
      const state = {
        futureHearings: {
          success: true
        }
      } as AppState;
      expect(selectors.getHasFutureHearings(state)).toMatchSnapshot();
    });
  });
});
