import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IdpcIngestionComponentStore } from './idpc-ingestion-store';
import { HearingService, ApiError } from '../../core';
import { IdpcIngestionPhase } from '../../core/model/idpc-ingestion';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HttpErrorResponse } from '@angular/common/http';

describe('IdpcIngestionComponentStore (Angular TestBed)', () => {
  let ingestIdpcs: jest.Mock;
  let componentStore: IdpcIngestionComponentStore;
  let storeMock: MockStore;

  beforeEach(() => {
    ingestIdpcs = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        IdpcIngestionComponentStore,
        {
          provide: HearingService,
          useValue: {
            ingestIdpcs
          }
        },
        provideMockStore({})
      ]
    });

    componentStore = TestBed.inject(IdpcIngestionComponentStore);
    storeMock = TestBed.inject(MockStore);
  });

  it('should set ingestionPhase via updaters', () => {
    let observedPhase: IdpcIngestionPhase | null = null;
    const sub = componentStore.ingestionPhase$.subscribe(phase => (observedPhase = phase));

    componentStore.setIngestionPhase(IdpcIngestionPhase.STARTED);
    expect(observedPhase).toBe(IdpcIngestionPhase.STARTED);

    sub.unsubscribe();
  });

  it('should clear ingestionPhase', () => {
    let observedPhase: IdpcIngestionPhase | null = null;
    const sub = componentStore.ingestionPhase$.subscribe(phase => (observedPhase = phase));

    componentStore.setIngestionPhase(IdpcIngestionPhase.STARTED);
    expect(observedPhase).toBe(IdpcIngestionPhase.STARTED);

    componentStore.clearIngestionPhase();
    expect(observedPhase).toBeNull();

    sub.unsubscribe();
  });

  it('should set ingestionPhase on complete ingestIdpcs', () => {
    let observedPhase: IdpcIngestionPhase | null = null;
    const response = { phase: IdpcIngestionPhase.COMPLETED };
    ingestIdpcs.mockReturnValueOnce(of(response));

    const sub = componentStore.ingestionPhase$.subscribe(phase => (observedPhase = phase));

    componentStore.ingestIdpcs({ courtCentreId: '1', roomId: '1', date: '2024-01-01' });

    expect(ingestIdpcs).toHaveBeenCalled();
    expect(observedPhase).toBe(IdpcIngestionPhase.COMPLETED);

    sub.unsubscribe();
  });

  it('should dispatch ApiError for non-403 errors and not set ingestionPhase', () => {
    let observedPhase: IdpcIngestionPhase | null = null;
    const error = new HttpErrorResponse({ status: 500, statusText: 'server error' });
    ingestIdpcs.mockReturnValueOnce(throwError(new HttpErrorResponse(error)));
    const storeSpy = jest.spyOn(storeMock, 'dispatch');

    const sub = componentStore.ingestionPhase$.subscribe(phase => (observedPhase = phase));

    componentStore.ingestIdpcs({ courtCentreId: '1', roomId: '1', date: '2024-01-01' });

    expect(ingestIdpcs).toHaveBeenCalled();
    expect(storeSpy).toHaveBeenCalledWith(new ApiError(error));

    expect(observedPhase).toBeNull();

    sub.unsubscribe();
  });

  it('should set ingestionPhase to FORBIDDEN on 403 error', () => {
    let observedPhase: IdpcIngestionPhase | null = null;
    const error = new HttpErrorResponse({ status: 403, statusText: 'server error' });
    ingestIdpcs.mockReturnValueOnce(throwError(error));
    const sub = componentStore.ingestionPhase$.subscribe(phase => (observedPhase = phase));
    const storeSpy = jest.spyOn(storeMock, 'dispatch');
    componentStore.ingestIdpcs({ courtCentreId: '1', roomId: '1', date: '2024-01-01' });

    expect(ingestIdpcs).toHaveBeenCalled();
    expect(storeSpy).not.toHaveBeenCalledWith(new ApiError(error));
    expect(observedPhase).toBe(IdpcIngestionPhase.FORBIDDEN);
    sub.unsubscribe();
  });
});
