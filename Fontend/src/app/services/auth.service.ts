import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_info';

  private currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
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
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      return false;
    }
    
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isTokenExpired(token?: string): boolean {
    if (!token) {
      token = this.getToken() || '';
    }
    
    if (!token) {
      return true;
    }

    try {
      const payload = this.decodeToken(token);
      if (!payload) {
        console.warn('Failed to decode token payload');
        return true;
      }

      // If token doesn't have exp field, consider it valid (don't block the request)
      if (!payload.exp) {
        console.warn('Token does not have exp field, allowing request');
        return false;
      }

      // Check if token is expired (with 60 second buffer)
      const expirationDate = payload.exp * 1000;
      const now = Date.now();
      const isExpired = expirationDate < (now + 60000);
      const secondsRemaining = Math.floor((expirationDate - now) / 1000);
      
      if (isExpired) {
        console.warn('⚠️ Token is expired or expiring soon:', {
          expiresAt: new Date(expirationDate).toLocaleString(),
          now: new Date(now).toLocaleString(),
          secondsRemaining: secondsRemaining
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // If we can't check expiration, allow the request and let the backend reject it if needed
      return false;
    }
  }

  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format: expected 3 parts, got', parts.length);
        return null;
      }

      const payload = parts[1];
      // Properly handle base64url decoding
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const decoded = atob(base64);
      const parsed = JSON.parse(decoded);
      
      return parsed;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  updateToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    
    // Log token refresh information
    const payload = this.decodeToken(token);
    if (payload?.exp) {
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const minutesUntilExpiry = Math.floor((expirationDate.getTime() - now.getTime()) / 60000);
      
      console.log('🔄 Token refreshed:');
      console.log('  New token expires at:', expirationDate.toLocaleString());
      console.log('  Current time:', now.toLocaleString());
      console.log('  Valid for:', minutesUntilExpiry, 'minutes');
    }
  }

  updateRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    console.log('🔄 Refresh token updated');
  }

  private setAuthData(response: LoginResponse): void {
    if (response.token) {
      localStorage.setItem(this.tokenKey, response.token);
      
      // Log token expiration information
      const payload = this.decodeToken(response.token);
      if (payload?.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();
        const minutesUntilExpiry = Math.floor((expirationDate.getTime() - now.getTime()) / 60000);
        
        console.log('✅ Login successful - Token information:');
        console.log('  Token expires at:', expirationDate.toLocaleString());
        console.log('  Current time:', now.toLocaleString());
        console.log('  Valid for:', minutesUntilExpiry, 'minutes');
        console.log('  Token payload:', payload);
      } else {
        console.log('✅ Login successful - Token stored (no expiration info)');
      }
    }
    if (response.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
      console.log('✅ Refresh token stored');
    }
    if (response.userName || response.roles) {
      const userInfo = {
        userName: response.userName,
        roles: response.roles
      };
      localStorage.setItem(this.userKey, JSON.stringify(userInfo));
      this.currentUserSubject.next(userInfo);
      console.log('✅ User info stored:', userInfo);
    }
  }

  private getStoredUser(): any {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * ดึง EmployeeId จาก JWT token
   * @returns EmployeeId หรือ null ถ้าไม่พบ
   */
  getCurrentEmployeeId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);
    if (!payload || !payload.EmployeeId) {
      return null;
    }

    return payload.EmployeeId;
  }

  /**
   * ดึง roles จาก JWT token
   * .NET Identity ใช้ full claim name: http://schemas.microsoft.com/ws/2008/06/identity/claims/role
   * @returns Array of role strings หรือ empty array
   */
  getCurrentUserRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }

    const payload = this.decodeToken(token);
    if (!payload) {
      return [];
    }

    // .NET Identity uses full claim name
    const roleClaimName = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    const roles = payload[roleClaimName] || payload.role || payload.Role || payload.roles || payload.Roles || [];
    
    // Convert to array if it's a string
    return Array.isArray(roles) ? roles : [roles];
  }

  /**
   * ตรวจสอบว่า user มี role ที่ระบุหรือไม่
   * @param role Role ที่ต้องการตรวจสอบ (case-insensitive)
   * @returns true ถ้ามี role นั้น
   */
  hasRole(role: string): boolean {
    const userRoles = this.getCurrentUserRoles();
    return userRoles.some(r => r && r.toLowerCase() === role.toLowerCase());
  }

  /**
   * ตรวจสอบว่า user เป็น Admin หรือ SuperAdmin หรือไม่
   * @returns true ถ้าเป็น Admin หรือ SuperAdmin
   */
  isAdmin(): boolean {
    return this.hasRole('Admin') || this.hasRole('SuperAdmin');
  }

  /**
   * ตรวจสอบว่า user เป็น SuperAdmin หรือไม่
   * @returns true ถ้าเป็น SuperAdmin
   */
  isSuperAdmin(): boolean {
    return this.hasRole('SuperAdmin');
  }

  /**
   * ตรวจสอบว่า user มี role ใดๆ จาก list ที่ระบุหรือไม่
   * @param roles Array of roles ที่ต้องการตรวจสอบ
   * @returns true ถ้ามีอย่างน้อย 1 role
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * ตรวจสอบว่า user มีทุก role ที่ระบุหรือไม่
   * @param roles Array of roles ที่ต้องการตรวจสอบ
   * @returns true ถ้ามีครบทุก role
   */
  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  /**
   * ดึงข้อมูล user จาก JWT token
   * @returns Object ที่มี employeeId, roles, และ isAdmin
   */
  getCurrentUserInfo(): { employeeId: string | null; roles: string[]; isAdmin: boolean } {
    return {
      employeeId: this.getCurrentEmployeeId(),
      roles: this.getCurrentUserRoles(),
      isAdmin: this.isAdmin()
    };
  }
}

