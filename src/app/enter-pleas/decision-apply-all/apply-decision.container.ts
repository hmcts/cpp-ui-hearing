import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { Defendant, Offence } from '../../core';
import { ApplyDecisionComponent } from './apply-decision.component';

@Component({
  selector: 'apply-all',
  template: `
    <apply-decision
      [currentOffence]="currentOffence"
      [hearingId]="hearingId"
      [defendant]="defendant"
      (onUpdate)="submitUpdatePlea.emit($event)"
      (cancel)="cancel.emit($event)"
    >
    </apply-decision>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApplyDecisionComponent]
})
export class ApplyDecisionContainer {
  @Input() currentOffence: Offence;
  @Input() defendant: Defendant;
  @Input() hearingId: string;
  @Output() submitUpdatePlea: EventEmitter<Defendant> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
}
