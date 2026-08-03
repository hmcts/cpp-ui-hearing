import { TestBed } from '@angular/core/testing';
import { BootstrapService } from './bootstrap.service';
import { ConnectionService } from '../connection/connection';

describe('BootstrapService', () => {
  let service: BootstrapService;
  let connectionService: jest.Mocked<ConnectionService>;

  beforeEach(() => {
    const connectionServiceMock = {
      startConnectivityMonitor: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [BootstrapService, { provide: ConnectionService, useValue: connectionServiceMock }]
    });

    service = TestBed.inject(BootstrapService);
    connectionService = TestBed.inject(ConnectionService) as jest.Mocked<ConnectionService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startConnectivityMonitor', () => {
    it('should call ConnectionService.startConnectivityMonitor', () => {
      service.startConnectivityMonitor();
      expect(connectionService.startConnectivityMonitor).toHaveBeenCalled();
    });
  });
});
