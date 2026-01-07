import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: HubConnection;
  private connectionPromise?: Promise<void>;

  constructor(private authService: AuthService) {}

  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.initializeConnection();
    return this.connectionPromise;
  }

  private async initializeConnection(): Promise<void> {
    try {
      const token = this.authService.getToken();
      if (!token) {
        console.warn('No token available for SignalR connection');
        return;
      }

      // Extract base URL from apiUrl (remove /api/v1)
      const baseUrl = environment.apiUrl.replace('/api/v1', '');
      const hubUrl = `${baseUrl}/hubs/notification`;
      
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: 1 // WebSockets
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext: { elapsedMilliseconds: number }) => {
            if (retryContext.elapsedMilliseconds < 60000) {
              return 2000; // Retry after 2 seconds for the first minute
            }
            return 10000; // Then retry every 10 seconds
          }
        })
        .build();

      await this.hubConnection.start();
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionPromise = undefined;
      throw error;
    }
  }

  stopConnection(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      return this.hubConnection.stop();
    }
    return Promise.resolve();
  }

  onQueueUpdated(callback: () => void): void {
    if (!this.hubConnection) {
      console.warn('SignalR connection not established');
      return;
    }

    this.hubConnection.on('QueueUpdated', () => {
      console.log('Queue updated notification received');
      callback();
    });
  }

  onJobStatusChanged(callback: () => void): void {
    if (!this.hubConnection) {
      console.warn('SignalR connection not established');
      return;
    }

    this.hubConnection.on('JobStatusChanged', () => {
      console.log('Job status changed notification received');
      callback();
    });
  }

  onJobAssigned(callback: (jobId: string, jobTitle: string, customer: string) => void): void {
    if (!this.hubConnection) {
      console.warn('SignalR connection not established');
      return;
    }

    this.hubConnection.on('ReceiveJobAssigned', (jobId: string, jobTitle: string, customer: string) => {
      console.log('Job assigned notification received', { jobId, jobTitle, customer });
      callback(jobId, jobTitle, customer);
    });
  }

  onEmployeeStatusChanged(callback: () => void): void {
    if (!this.hubConnection) {
      console.warn('SignalR connection not established');
      return;
    }

    this.hubConnection.on('EmployeeStatusChanged', () => {
      console.log('Employee status changed notification received');
      callback();
    });
  }

  offQueueUpdated(): void {
    if (this.hubConnection) {
      this.hubConnection.off('QueueUpdated');
    }
  }

  offJobStatusChanged(): void {
    if (this.hubConnection) {
      this.hubConnection.off('JobStatusChanged');
    }
  }

  offJobAssigned(): void {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveJobAssigned');
    }
  }

  offEmployeeStatusChanged(): void {
    if (this.hubConnection) {
      this.hubConnection.off('EmployeeStatusChanged');
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }
}

