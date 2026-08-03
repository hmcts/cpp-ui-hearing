import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { Observable } from 'rxjs';
import {
  IdpcIngestionParams,
  IdpcIngestionPhase,
  IdpcIngestionResponse
} from '../../core/model/idpc-ingestion';
import { ApiError, AppState, HearingService } from '../../core';
import { switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';

export interface IdpcIngestionState {
  ingestionPhase: IdpcIngestionPhase | null;
}

export const initialIdpcIngestionState: IdpcIngestionState = {
  ingestionPhase: null
};

@Injectable()
export class IdpcIngestionComponentStore extends ComponentStore<IdpcIngestionState> {
  readonly hearingService = inject(HearingService);
  readonly globalStore: Store<AppState> = inject(Store);
  readonly ingestionPhase$ = this.select(state => state.ingestionPhase);
  readonly setIngestionPhase = this.updater(
    (state, ingestionPhase: IdpcIngestionState['ingestionPhase']) => ({
      ...state,
      ingestionPhase
    })
  );

  readonly clearIngestionPhase = this.updater(state => ({
    ...state,
    ingestionPhase: null
  }));

  constructor() {
    super(initialIdpcIngestionState);
  }

  ingestIdpcs = this.effect((params$: Observable<IdpcIngestionParams>) => {
    return params$.pipe(
      switchMap(params =>
        this.hearingService.ingestIdpcs(params).pipe(
          tapResponse(
            (response: IdpcIngestionResponse) => this.setIngestionPhase(response.phase),
            (error: HttpErrorResponse) => {
              if (error.status !== 403) {
                this.logError(error);
                return;
              }
              this.setIngestionPhase(IdpcIngestionPhase.FORBIDDEN);
            }
          )
        )
      )
    );
  });

  private logError(error: HttpErrorResponse): void {
    this.globalStore.dispatch(new ApiError(error));
  }
}
