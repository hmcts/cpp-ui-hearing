import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { getApplicantEmailForSummonsApplication } from '../../../../core';
import { PromptChoice } from '../../../results.interfaces';
import { ResultsState } from '../../store';
import { CreateResultPromptsForApplicationOptions, PromptHandler } from '../reusable-info.service';

@Injectable({ providedIn: 'root' })
export class ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler implements PromptHandler {
  constructor(private store: Store<ResultsState>) {}

  isEqual(promptChoice: PromptChoice): boolean {
    return promptChoice.promptRef === 'prosecutorsEmailAddressUsedSummonsNotification';
  }

  getValue({ applicationId }: CreateResultPromptsForApplicationOptions): Observable<unknown> {
    return this.store.pipe(select(getApplicantEmailForSummonsApplication(applicationId)), take(1));
  }
}
