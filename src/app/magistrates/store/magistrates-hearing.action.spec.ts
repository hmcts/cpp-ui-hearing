import { hearingSummaryMock } from '../mock-data/test-mock-data';

import { LoadMagistratesHearingListSuccessAction } from './magistrates-hearing.action';
import { Action } from '@ngrx/store';

describe('Hearing actions', () => {
  it('Should create an LoadMagistratesHearingListSuccessAction action', () => {
    const action: Action = new LoadMagistratesHearingListSuccessAction(hearingSummaryMock);
    expect(action).toMatchSnapshot();
  });
});
