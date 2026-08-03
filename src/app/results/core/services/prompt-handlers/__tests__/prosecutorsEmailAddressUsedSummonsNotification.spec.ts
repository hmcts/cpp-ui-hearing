import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { PromptChoice } from '../../../../results.interfaces';
import {
  CreateResultPromptsForApplicationOptions,
  PromptHandler
} from '../../reusable-info.service';
import { ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler } from '../prosecutorsEmailAddressUsedSummonsNotification';

jest.mock('../../../../../core', () => ({
  ...(jest.requireActual('../../../../../core') as any),
  getApplicantEmailForSummonsApplication: (applicationId: string) => () =>
    `SUMMONS_FOR_${applicationId}`
}));

describe('ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler', () => {
  let promptHandler: PromptHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler, provideMockStore()],
      teardown: { destroyAfterEach: false }
    });
    promptHandler = TestBed.inject(ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler);
  });

  it('should match based on the promptRef', () => {
    const matchingPromptChoice = {
      promptRef: 'prosecutorsEmailAddressUsedSummonsNotification'
    } as PromptChoice;
    const nonMatchingPromptChoice = {
      promptRef: 'prosecutorsEmailAddress'
    } as PromptChoice;

    expect(promptHandler.isEqual(matchingPromptChoice)).toBe(true);
    expect(promptHandler.isEqual(nonMatchingPromptChoice)).toBe(false);
  });

  it('should select the applicant email', done => {
    promptHandler
      .getValue({
        hearingId: 'hearingId',
        applicationId: 'applicationId',
        orderedDate: '*',
        promptChoices: []
      } as CreateResultPromptsForApplicationOptions)
      .subscribe({
        next: value => {
          expect(value).toEqual('SUMMONS_FOR_applicationId');
        },
        complete: done
      });
  });
});
