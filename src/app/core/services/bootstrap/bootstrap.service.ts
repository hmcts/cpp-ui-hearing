import { Injectable } from '@angular/core';
import { ConnectionService } from '../connection/connection';

@Injectable()
export class BootstrapService {
  constructor(private connection: ConnectionService) {}

  startConnectivityMonitor() {
    this.connection.startConnectivityMonitor();
  }
}
