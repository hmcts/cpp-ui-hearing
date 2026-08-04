import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IdpcIngestionPhase } from '../../core/model/idpc-ingestion';
import { PdkAlertComponent } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'idpc-ingestion-status',
  imports: [PdkAlertComponent, TranslatePipe],
  template: `
    @switch (phase) { @case (idpcingestionPhases.IN_PROGRESS) {
    <pdk-alert type="notice" icon="true" data-test-id="idpcIngestionInProgressBanner">
      <span>{{ 'HEARING_LIST.IDPC_INGESTION.IN_PROGRESS_MESSAGE' | translate }}</span>
    </pdk-alert>
    } @case (idpcingestionPhases.COMPLETED) {
    <pdk-alert type="confirmation" icon="true" data-test-id="idpcIngestionCompletedBanner">
      <span>{{ 'HEARING_LIST.IDPC_INGESTION.COMPLETED_MESSAGE' | translate }}</span>
    </pdk-alert>
    } @case (idpcingestionPhases.FAILED) {
    <pdk-alert type="warning" icon="true" data-test-id="idpcIngestionFailedBanner">
      <span>{{ 'HEARING_LIST.IDPC_INGESTION.FAILED_MESSAGE' | translate }}</span>
    </pdk-alert>
    } @case (idpcingestionPhases.STARTED) {
    <pdk-alert type="success" icon="true" data-test-id="idpcIngestionStartedBanner">
      <span>{{ 'HEARING_LIST.IDPC_INGESTION.STARTED_MESSAGE' | translate }}</span>
    </pdk-alert>
    } @case (idpcingestionPhases.FORBIDDEN) {
    <pdk-alert type="warning" icon="true" data-test-id="idpcIngestionForbiddenBanner">
      <span>{{ 'HEARING_LIST.IDPC_INGESTION.FORBIDDEN_MESSAGE' | translate }}</span>
    </pdk-alert>
    } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdpcIngestionStatusComponent {
  @Input() phase: IdpcIngestionPhase;
  readonly idpcingestionPhases = IdpcIngestionPhase;
}
