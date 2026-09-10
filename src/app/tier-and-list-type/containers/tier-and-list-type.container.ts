import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { PdkAlertComponent, PdkCore } from '@cpp/pdk';
import { TranslateModule } from '@ngx-translate/core';
import { getFlattenedParams } from '../../core/utils/utils';
import { TierAndListTypeStore } from '../store/tier-and-list-type.store';
import { FORM_PATH, formRoute, REVIEW_PATH, reviewRoute } from '../utils/tier-and-list-type.paths';

@Component({
  selector: 'tier-and-list-type',
  template: `
    @if (store.alert(); as alert) {
    <pdk-alert [type]="alert.kind" icon pdk-margin-bottom="6">
      {{ alert.messageKey | translate }}
    </pdk-alert>
    }

    <router-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TierAndListTypeStore],
  imports: [RouterOutlet, PdkAlertComponent, PdkCore, TranslateModule]
})
export class TierAndListTypeContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hearingId = getFlattenedParams(this.route.snapshot)['hearingId'];

  readonly store = inject(TierAndListTypeStore);

  constructor() {
    effect(() => {
      const detail = this.store.detail();

      if (!detail) {
        return;
      }

      const target = detail.tier ? REVIEW_PATH : FORM_PATH;
      const activeChildPath = this.route.snapshot.firstChild?.routeConfig?.path ?? REVIEW_PATH;

      if (target !== activeChildPath) {
        this.router.navigate(
          target === REVIEW_PATH ? reviewRoute(this.hearingId) : formRoute(this.hearingId)
        );
      }
    });
  }

  ngOnInit(): void {
    this.store.load(this.hearingId);
  }
}
