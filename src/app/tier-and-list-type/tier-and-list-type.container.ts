import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PdkErrorSummaryComponent,
  PdkMarginDirective,
  PdkTypographyDirective,
  ValidationError
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';
import {
  AppState,
  getCurrentHearingTierAndListType,
  getFlattenedParams,
  SetTierAndListTypeAction,
  TierAndListType
} from '../core';
import { TierAndListTypeFormComponent } from './tier-and-list-type-form/tier-and-list-type-form.component';
import { TierAndListTypeSummaryComponent } from './tier-and-list-type-summary/tier-and-list-type-summary.component';

@Component({
  selector: 'tier-and-list-type',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errors?.length) {
    <pdk-error-summary [errors]="errors"></pdk-error-summary>
    } @if (isEditing$ | async) {
    <h1 pdk-typography="heading-xlarge" pdk-margin-top="8">
      {{ 'TIER_AND_LIST_TYPE.ENTER_HEADING' | translate }}
    </h1>
    <tier-and-list-type-form
      [tierAndListType]="tierAndListType$ | async"
      (formSubmit)="save($event)"
      (errors)="updateErrors($event)"
    ></tier-and-list-type-form>
    } @else {
    <h1 pdk-typography="heading-xlarge" pdk-margin-top="8">
      {{ 'TIER_AND_LIST_TYPE.HEADING' | translate }}
    </h1>
    <tier-and-list-type-summary
      [tierAndListType]="tierAndListType$ | async"
      (changeSelection)="edit()"
    ></tier-and-list-type-summary>
    }
  `,
  imports: [
    AsyncPipe,
    PdkErrorSummaryComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    TierAndListTypeFormComponent,
    TierAndListTypeSummaryComponent,
    TranslatePipe
  ]
})
export class TierAndListTypeContainer implements OnInit {
  tierAndListType$: Observable<TierAndListType>;
  isEditing$: Observable<boolean>;

  hearingId: string;
  errors: ValidationError[];

  /**
   * Set when the clerk chooses to amend an already saved decision. Cleared on save
   * so that the review state returns as soon as the store confirms the new values.
   */
  private readonly editRequested$ = new BehaviorSubject<boolean>(false);

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    @Inject('Window') private window: Window
  ) {}

  ngOnInit(): void {
    const { hearingId } = getFlattenedParams(this.activatedRoute.snapshot);
    this.hearingId = hearingId;
    this.tierAndListType$ = this.store.select(getCurrentHearingTierAndListType);

    // A hearing with no tier yet has nothing to review, so it opens on the form.
    this.isEditing$ = combineLatest([this.tierAndListType$, this.editRequested$]).pipe(
      map(([tierAndListType, editRequested]) => editRequested || !tierAndListType?.tier)
    );
  }

  save(tierAndListType: TierAndListType): void {
    this.errors = null;
    this.store.dispatch(
      new SetTierAndListTypeAction({ hearingId: this.hearingId, tierAndListType })
    );
    this.editRequested$.next(false);
    this.window.scroll(0, 0);
  }

  edit(): void {
    this.editRequested$.next(true);
  }

  updateErrors(errors: ValidationError[]): void {
    this.errors = errors;
    if (this.errors?.length) {
      this.window.scroll(0, 0);
    }
  }
}
