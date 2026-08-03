import { DraftResultActions } from '../draft-result.actions';
import { Action } from '@ngrx/store';
import { PromptEntry } from '../../../results.interfaces';

const mockData = [
  {
    applicationId: '12',
    cacheDataPath: '',
    offenceId: '',
    promptRef: '',
    type: 'NAMEADDRESS',
    value: ''
  }
] as PromptEntry[];

describe('Draft Result actions', () => {
  it('Should store reusable info action', () => {
    const action: Action = DraftResultActions.setReusableInfoSuccess({ reusableResults: mockData });
    expect(action).toMatchSnapshot();
  });
});
