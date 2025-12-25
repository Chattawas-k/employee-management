import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_info';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.setAuthData(response);
        }
      })
    );
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, request).pipe(
      tap(response => {
        if (response.token) {
          this.updateToken(response.token);
          if (response.refreshToken) {
            this.updateRefreshToken(response.refreshToken);
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private updateToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private updateRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  private setAuthData(response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem(this.tokenKey, response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    }
    if (response.userName || response.roles) {
      const userInfo: User = {
        userName: response.userName || '',
        roles: response.roles || []
      };
      localStorage.setItem(this.userKey, JSON.stringify(userInfo));
      this.currentUserSubject.next(userInfo);
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) {
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      // Handle corrupted localStorage data gracefully
      this.logger.error('Error parsing stored user data:', error);
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}

