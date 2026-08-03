import { ChangeDetectionStrategy, Component, Input, Inject } from '@angular/core';
import { CaseAccessAlertService } from './case-access-alert.service';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppState, getNavigationId } from '../core';
import { AppConfigService } from '../config';
import { CaseAccessModalComponent } from './case-access-modal.component';
import { REDIRECT_TOKEN } from '../../bootstrap-app.config';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'case-access-alert',
  template: `
    <case-access-modal
      [urns]="urns"
      [show]="shouldShowModal && !hideModal"
      (onSubmit)="onSubmit($event)"
      (onCancel)="onCancel()"
    >
    </case-access-modal>
  `,
  imports: [CaseAccessModalComponent]
})
export class CaseAccessAlertComponent {
  @Input() urns: string[] = [];
  @Input() userId: string;
  @Input() hearingIds: string[] = [];
  @Input() selectedHearingId?: string;
  @Input() checkOneTime?: boolean;
  private navigationId$: Observable<number>;
  hideModal = false;

  get shouldShowModal(): boolean {
    return this.alertService.shouldShowModal(
      this.hearingIds,
      this.userId,
      this.selectedHearingId,
      this.checkOneTime
    );
  }

  onSubmit(decision: boolean) {
    this.alertService.saveDecision(this.hearingIds, this.userId, decision, this.checkOneTime);
    this.hideModal = true;
  }

  onCancel() {
    if (this.checkOneTime) {
      this.navigationId$.pipe(take(1)).subscribe(id => {
        this.redirectTo(this.appConfigService.cppHomeUrl);
      });
    } else {
      this.hideModal = true;
    }
  }

  constructor(
    @Inject(REDIRECT_TOKEN)
    private redirectTo: (url: string) => void,
    private appConfigService: AppConfigService,
    private alertService: CaseAccessAlertService,
    private store: Store<AppState>
  ) {
    this.navigationId$ = this.store.pipe(select(getNavigationId));
  }
}
