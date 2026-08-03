import { inject, Injectable } from '@angular/core';
import { CppHttp, HttpComandOptions, HttpCommandSyncOptions, HttpQueryOptions } from '@cpp/core';
import { Store } from '@ngrx/store';
import { Observable, OperatorFunction } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppState } from '../../reducers';
import { CompletedApiRequest, PendingApiRequest } from '../../actions';
// import { completedApiRequest } from '../../actions/api.actions';
import { cloneDeep } from 'lodash-es';

export type RequestOptions = HttpQueryOptions | HttpComandOptions | HttpCommandSyncOptions;

@Injectable()
export class CPPMonitorHttp extends CppHttp {
  readonly store = inject(Store<AppState>);

  handleRequest(request: RequestOptions) {
    if (request) {
      this.store.dispatch(new PendingApiRequest(request));
    }
  }

  handleResponse<R>(request: RequestOptions): OperatorFunction<R, R> {
    return source$ =>
      source$.pipe(
        finalize(() => {
          if (request) {
            this.store.dispatch(new CompletedApiRequest(request));
          }
        })
      );
  }

  getReadOnlyOptionsForStore(options: RequestOptions) {
    return cloneDeep(options);
  }

  override query<R>(options: HttpQueryOptions): Observable<R> {
    if (options.background) {
      return super.query<R>(options);
    }
    const reqOptionsForStore = this.getReadOnlyOptionsForStore(options);
    this.handleRequest(reqOptionsForStore);
    return super.query<R>(options).pipe(this.handleResponse<R>(reqOptionsForStore));
  }

  override command<R>(options: HttpComandOptions): Observable<R> {
    const reqOptionsForStore = this.getReadOnlyOptionsForStore(options);
    this.handleRequest(reqOptionsForStore);
    return super.command(options).pipe(this.handleResponse(reqOptionsForStore));
  }

  override commandSync<R extends object>(
    options: HttpCommandSyncOptions & { background?: boolean }
  ): Observable<R> {
    if (options.background) {
      return super.commandSync<R>(options);
    }
    const reqOptionsForStore = this.getReadOnlyOptionsForStore(options);
    this.handleRequest(reqOptionsForStore);
    return super.commandSync<R>(options).pipe(this.handleResponse(reqOptionsForStore));
  }
}
