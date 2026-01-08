import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
      // Extract base URL from apiUrl (remove /api/v1)
      const baseUrl = environment.apiUrl.replace('/api/v1', '');
      const hubUrl = `${baseUrl}/hubs/notification`;
      
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            // Get current token dynamically
            let token = this.authService.getToken();
            
            if (!token) {
              console.warn('No token available for SignalR connection');
              throw new Error('No authentication token available');
            }

            // Always check token expiration before using
            const payload = this.decodeJwtToken(token);
            if (payload && payload.exp) {
              const expirationTime = payload.exp * 1000; // Convert to milliseconds
              const currentTime = Date.now();
              const timeUntilExpiry = expirationTime - currentTime;
              
              // If token is expired or expires within 2 minutes, refresh it
              if (timeUntilExpiry < 120000) {
                const refreshToken = this.authService.getRefreshToken();
                if (refreshToken) {
                  try {
                    console.log('Token expired or expiring soon, refreshing for SignalR...');
                    const response = await firstValueFrom(this.authService.refreshToken(refreshToken));
                    if (response?.token) {
                      token = response.token;
                      console.log('Token refreshed successfully for SignalR connection');
                    } else {
                      console.warn('Token refresh returned no token');
                    }
                  } catch (refreshError) {
                    console.error('Failed to refresh token for SignalR:', refreshError);
                    // If refresh fails and token is already expired, throw error
                    if (timeUntilExpiry <= 0) {
                      throw new Error('Token expired and refresh failed');
                    }
                    // Otherwise, try to use current token (might still be valid for a short time)
                  }
                } else {
                  // No refresh token available
                  if (timeUntilExpiry <= 0) {
                    throw new Error('Token expired and no refresh token available');
                  }
                }
              }
            }
            
            return token;
          },
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

      // Handle connection closed events (e.g., due to expired token)
      this.hubConnection.onclose(async (error) => {
        if (error) {
          console.error('SignalR connection closed with error:', error);
          
          // Check if error is related to authentication
          const isAuthError = error?.message?.includes('401') || 
                             error?.message?.includes('Unauthorized') || 
                             error?.message?.includes('expired') ||
                             error?.message?.includes('authentication');
          
          if (isAuthError) {
            const refreshToken = this.authService.getRefreshToken();
            if (refreshToken) {
              try {
                console.log('Authentication error detected, refreshing token...');
                await firstValueFrom(this.authService.refreshToken(refreshToken));
                console.log('Token refreshed, attempting to reconnect SignalR...');
                
                // Reset connection promise to allow reconnection
                this.connectionPromise = undefined;
                
                // Reconnect will use the new token via accessTokenFactory
                if (this.hubConnection && this.hubConnection.state !== HubConnectionState.Connected) {
                  try {
                    await this.hubConnection.start();
                    console.log('SignalR reconnected successfully after token refresh');
                  } catch (reconnectError) {
                    console.error('Failed to reconnect SignalR after token refresh:', reconnectError);
                  }
                }
              } catch (refreshError) {
                console.error('Failed to refresh token, cannot reconnect SignalR:', refreshError);
                // Stop trying to reconnect if refresh fails
                this.connectionPromise = undefined;
              }
            } else {
              console.warn('No refresh token available for SignalR reconnection');
              this.connectionPromise = undefined;
            }
          }
        } else {
          // Connection closed without error (normal disconnection)
          this.connectionPromise = undefined;
        }
      });

      await this.hubConnection.start();
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionPromise = undefined;
      throw error;
    }
  }

  private decodeJwtToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
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

