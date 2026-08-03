import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { reducers } from '../reducers';
import {
  canAmendApplication,
  getUserCourtCentreOuCodes,
  hasResultingAssistant
} from './user-groups';

describe('User Groups selectors', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore(reducers, { runtimeChecks: {} })],
      teardown: { destroyAfterEach: false }
    });
  });

  it('should return the court centre ou-codes', () => {
    expect(
      getUserCourtCentreOuCodes.projector([
        {
          placementId: '123'
        },
        {
          placementId: '321'
        }
      ])
    ).toMatchSnapshot();
  });

  describe('canAmendApplication', () => {
    it('should return true if amend application feature is enabled', () => {
      expect(
        canAmendApplication.projector([
          {
            title: 'Amend Application',
            key: 'AmendApplication',
            type: 'COMPONENT'
          }
        ])
      ).toBeTruthy();
    });

    it('should return false if amend application feature is not enabled', () => {
      expect(canAmendApplication.projector([])).toBeFalsy();
    });
  });

  describe('hasResultingAssistant', () => {
    it('should return true if the ResultsValidation feature is enabled', () => {
      expect(
        hasResultingAssistant.projector([
          {
            title: 'Results Validation',
            key: 'ResultsValidation',
            type: 'COMPONENT'
          }
        ])
      ).toBeTruthy();
    });

    it('should return false if the ResultsValidation feature is not enabled', () => {
      expect(hasResultingAssistant.projector([])).toBeFalsy();
    });

    it('should return false if user features are null', () => {
      expect(hasResultingAssistant.projector(null)).toBeFalsy();
    });
  });
});
