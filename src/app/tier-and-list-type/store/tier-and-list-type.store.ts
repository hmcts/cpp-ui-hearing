import { computed, inject } from '@angular/core';
import { AlertType } from '@cpp/pdk';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { PtphDetail, SavePtphDetailPayload } from '../models/ptph-detail.model';
import { PtphDetailService } from '../services/ptph-detail.service';

export interface TierAndListTypeAlert {
  kind: Extract<AlertType, 'success' | 'warning'>;
  messageKey: string;
}

export interface TierAndListTypeState {
  detail: PtphDetail | null;
  alert: TierAndListTypeAlert | null;
}

type StatePatch = Partial<TierAndListTypeState>;

const FINALISED_SUCCESS_ALERT: TierAndListTypeAlert = {
  kind: 'success',
  messageKey: 'TIER_AND_LIST_TYPE.ALERT_FINALISED_SUCCESS'
};

const FINALISE_FAILURE_ALERT: TierAndListTypeAlert = {
  kind: 'warning',
  messageKey: 'TIER_AND_LIST_TYPE.ALERT_FINALISE_FAILURE'
};

const DELETED_SUCCESS_ALERT: TierAndListTypeAlert = {
  kind: 'success',
  messageKey: 'TIER_AND_LIST_TYPE.ALERT_DELETED_SUCCESS'
};

const DELETE_FAILURE_ALERT: TierAndListTypeAlert = {
  kind: 'warning',
  messageKey: 'TIER_AND_LIST_TYPE.ALERT_DELETE_FAILURE'
};

const SAVE_FAILURE_ALERT: TierAndListTypeAlert = {
  kind: 'warning',
  messageKey: 'TIER_AND_LIST_TYPE.ALERT_SAVE_FAILURE'
};

const LOAD_FAILURE_ALERT: TierAndListTypeAlert = {
  kind: 'warning',
  messageKey: 'TIER_AND_LIST_TYPE.ALERT_LOAD_FAILURE'
};

const initialState: TierAndListTypeState = {
  detail: null,
  alert: null
};

export const TierAndListTypeStore = signalStore(
  withState(initialState),

  withComputed(({ detail }) => ({
    canFinalise: computed(() => {
      const current = detail();
      return !!current?.tier && !!current?.listType && current.finalised !== true;
    })
  })),

  withMethods((store, service = inject(PtphDetailService)) => ({
    load: rxMethod<string>(
      pipe(
        tap(() => patchState(store, (): StatePatch => ({ alert: null }))),
        switchMap(hearingId =>
          service.getPtphDetail(hearingId).pipe(
            tapResponse({
              next: (detail: PtphDetail) => patchState(store, (): StatePatch => ({ detail })),
              error: () => patchState(store, (): StatePatch => ({ alert: LOAD_FAILURE_ALERT }))
            })
          )
        )
      )
    ),

    save: rxMethod<SavePtphDetailPayload>(
      pipe(
        tap(() => patchState(store, (): StatePatch => ({ alert: null }))),
        switchMap(payload =>
          service.savePtphDetail(payload).pipe(
            switchMap(() => service.getPtphDetail(payload.hearingId)),
            tapResponse({
              next: (detail: PtphDetail) => patchState(store, (): StatePatch => ({ detail })),
              error: () => patchState(store, (): StatePatch => ({ alert: SAVE_FAILURE_ALERT }))
            })
          )
        )
      )
    ),

    finalise: rxMethod<string>(
      pipe(
        tap(() => patchState(store, (): StatePatch => ({ alert: null }))),
        switchMap(hearingId =>
          service.finalisePtphDetail(hearingId).pipe(
            switchMap(() => service.getPtphDetail(hearingId)),
            tapResponse({
              next: (detail: PtphDetail) =>
                patchState(store, (): StatePatch => ({ detail, alert: FINALISED_SUCCESS_ALERT })),
              error: () => patchState(store, (): StatePatch => ({ alert: FINALISE_FAILURE_ALERT }))
            })
          )
        )
      )
    ),

    remove: rxMethod<string>(
      pipe(
        tap(() => patchState(store, (): StatePatch => ({ alert: null }))),
        switchMap(hearingId =>
          service.deletePtphDetail(hearingId).pipe(
            switchMap(() => service.getPtphDetail(hearingId)),
            tapResponse({
              next: (detail: PtphDetail) =>
                patchState(store, (): StatePatch => ({ detail, alert: DELETED_SUCCESS_ALERT })),
              error: () => patchState(store, (): StatePatch => ({ alert: DELETE_FAILURE_ALERT }))
            })
          )
        )
      )
    ),

    dismissAlert: () => patchState(store, (): StatePatch => ({ alert: null }))
  }))
);
