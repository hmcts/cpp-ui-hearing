import { TestBed, inject } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import { reducers } from '../../';

import { ConnectionService } from './connection';

describe('ConnectionService', () => {
  let dispatch: jest.Mock;
  let selectMock: jest.Mock;

  beforeEach(() => {
    dispatch = jest.fn();
    selectMock = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        ConnectionService,
        {
          provide: Store,
          useValue: {
            dispatch,
            select: selectMock,
          },
        },
      ],
      teardown: { destroyAfterEach: false },
    });
  });
  describe('Initialization', () => {
    it('should be created', inject([ConnectionService], (service: ConnectionService) => {
      expect(service).toBeTruthy();
    }));
  });
});
