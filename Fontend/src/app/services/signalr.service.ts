import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { firstValueFrom, Observable, Subject, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { getEmployeeIdFromToken } from '../utils/jwt.util';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: HubConnection;
  private connectionPromise?: Promise<void>;

  // Event streams (single source of truth)
  private readonly queueUpdatedSubject = new Subject<void>();
  private readonly jobStatusChangedSubject = new Subject<void>();
  private readonly employeeStatusChangedSubject = new Subject<void>();
  private readonly jobAssignedSubject = new Subject<{ jobId: string; jobTitle: string; customer: string }>();

  // Backward-compat callback subscriptions
  private readonly queueUpdatedSubscriptions: Subscription[] = [];
  private readonly jobStatusChangedSubscriptions: Subscription[] = [];
  private readonly employeeStatusChangedSubscriptions: Subscription[] = [];
  private readonly jobAssignedSubscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  get queueUpdated$(): Observable<void> {
    return this.queueUpdatedSubject.asObservable();
  }

  get jobStatusChanged$(): Observable<void> {
    return this.jobStatusChangedSubject.asObservable();
  }

  get employeeStatusChanged$(): Observable<void> {
    return this.employeeStatusChangedSubject.asObservable();
  }

  get jobAssigned$(): Observable<{ jobId: string; jobTitle: string; customer: string }> {
    return this.jobAssignedSubject.asObservable();
  }

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

      // Ensure we don't register duplicate handlers on reconnect
      this.hubConnection.off('QueueUpdated');
      this.hubConnection.off('JobStatusChanged');
      this.hubConnection.off('EmployeeStatusChanged');
      this.hubConnection.off('ReceiveJobAssigned');

      // Register handlers ONCE: push to Subjects
      this.hubConnection.on('QueueUpdated', () => {
        this.queueUpdatedSubject.next();
      });

      this.hubConnection.on('JobStatusChanged', () => {
        this.jobStatusChangedSubject.next();
      });

      // Employee status changed (availability + account status). Payload is optional.
      this.hubConnection.on('EmployeeStatusChanged', (employeeId?: string, status?: string) => {
        // Always notify subscribers (refresh UI lists)
        this.employeeStatusChangedSubject.next();

        // Immediate kick when account disabled
        if (employeeId && status === 'accountDisabled') {
          const token = this.authService.getToken();
          const myEmployeeId = getEmployeeIdFromToken(token);
          if (myEmployeeId && myEmployeeId.toLowerCase() === employeeId.toLowerCase()) {
            this.toastService.error('โปรดติดต่อผู้ดูแลระบบ', 'บัญชีถูกปิดใช้งาน');
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });

      this.hubConnection.on('ReceiveJobAssigned', (jobId: string, jobTitle: string, customer: string) => {
        this.jobAssignedSubject.next({ jobId, jobTitle, customer });
      });

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
    this.queueUpdatedSubscriptions.push(
      this.queueUpdated$.subscribe(() => callback())
    );
  }

  onJobStatusChanged(callback: () => void): void {
    this.jobStatusChangedSubscriptions.push(
      this.jobStatusChanged$.subscribe(() => callback())
    );
  }

  onJobAssigned(callback: (jobId: string, jobTitle: string, customer: string) => void): void {
    this.jobAssignedSubscriptions.push(
      this.jobAssigned$.subscribe(({ jobId, jobTitle, customer }) => callback(jobId, jobTitle, customer))
    );
  }

  onEmployeeStatusChanged(callback: () => void): void {
    this.employeeStatusChangedSubscriptions.push(
      this.employeeStatusChanged$.subscribe(() => callback())
    );
  }

  offQueueUpdated(): void {
    while (this.queueUpdatedSubscriptions.length > 0) {
      this.queueUpdatedSubscriptions.pop()?.unsubscribe();
    }
  }

  offJobStatusChanged(): void {
    while (this.jobStatusChangedSubscriptions.length > 0) {
      this.jobStatusChangedSubscriptions.pop()?.unsubscribe();
    }
  }

  offEmployeeStatusChanged(): void {
    while (this.employeeStatusChangedSubscriptions.length > 0) {
      this.employeeStatusChangedSubscriptions.pop()?.unsubscribe();
    }
  }

  offJobAssigned(): void {
    while (this.jobAssignedSubscriptions.length > 0) {
      this.jobAssignedSubscriptions.pop()?.unsubscribe();
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }
}

