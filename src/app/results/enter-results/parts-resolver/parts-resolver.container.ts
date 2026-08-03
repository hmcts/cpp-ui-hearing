import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { UnresolvedPart, UnresolvedPartChoice } from '../../results.interfaces';
import { DraftResultActions, ResultsState } from '../../core/store';
import { PartsResolverComponent } from './parts-resolver.component';

@Component({
  selector: 'cpp-parts-resolver-container',
  template: `
    <cpp-parts-resolver
      [parts]="parts"
      (destroyPart)="handleDestroyPart($event)"
      (resolvePart)="handleResolvePart($event)"
    ></cpp-parts-resolver>
  `,
  imports: [PartsResolverComponent]
})
export class PartsResolverContainerComponent {
  @Input() parts: UnresolvedPart[] = [];
  @Input() resultLineId: string;
  @Input() resolvedResult = false;

  constructor(private store: Store<ResultsState>) {}

  handleResolvePart(options: { partIndex: number; choice: UnresolvedPartChoice }) {
    this.store.dispatch(
      DraftResultActions.resolveDraftResultLinePart({
        resultLineId: this.resultLineId,
        ...options
      })
    );
  }

  handleDestroyPart(partIndex: number) {
    this.store.dispatch(
      DraftResultActions.destroyDraftResultLinePart({
        resultLineId: this.resultLineId,
        partIndex
      })
    );
  }
}
