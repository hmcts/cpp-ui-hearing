import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { switchMap } from 'rxjs/operators';
import { AppState, Defendant } from '../core';
import { SaveCheckAndChallengeReasonAction } from './check-and-challenge.actions';
import { getDefendantsFromAllCases } from '../core/selectors/hearing';
import { Observable } from 'rxjs';
import { CheckAndChallengeComponent } from './check-and-challenge.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'check-and-challenge-container',
  template: `
    <check-and-challenge-component
      [defendants]="defendants$ | async"
      (onSaveReason)="saveReason($event)"
    >
    </check-and-challenge-component>
  `,
  imports: [CheckAndChallengeComponent, AsyncPipe]
})
export class CheckAndChallengeContainer implements OnInit {
  defendants$: Observable<Defendant[]>;
  type: string;
  target: string;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.defendants$ = this.route.params.pipe(
      switchMap(params => {
        this.type = params.type;
        this.target = params.hearingId;
        return this.store.pipe(select(getDefendantsFromAllCases));
      })
    );
  }

  saveReason(description: string) {
    this.store.dispatch(
      SaveCheckAndChallengeReasonAction({
        payload: { target: this.target, description, type: this.type }
      })
    );
  }
}
