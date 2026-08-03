import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { merge, fromEvent } from 'rxjs';
import { AppState } from '../../reducers';
import { NetworkConnectivityAction } from '../../actions';
import { mapTo, distinctUntilChanged, startWith } from 'rxjs/operators';

@Injectable()
export class ConnectionService {
  constructor(private store: Store<AppState>) {}

  startConnectivityMonitor(): void {
    merge(
      fromEvent(window, 'online').pipe(mapTo(true)),
      fromEvent(window, 'offline').pipe(mapTo(false))
    )
      .pipe(startWith(navigator.onLine), distinctUntilChanged())
      .subscribe(online => this.store.dispatch(new NetworkConnectivityAction(online)));
  }
}
