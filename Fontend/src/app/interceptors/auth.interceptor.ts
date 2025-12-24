import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Don't add token to auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  const token = authService.getToken();

  // Add token to request if available
  let clonedRequest = req;
  if (token) {
    // Always add the token if we have one
    // Let the backend validate it and return 401 if needed
    console.log(`🔐 Adding token to request: ${req.method} ${req.url}`);
    console.log(`   Token (first 20 chars): ${token.substring(0, 20)}...`);
    
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.warn(`⚠️ No token available for request: ${req.method} ${req.url}`);
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !req.url.includes('/auth/')) {
        const refreshToken = authService.getRefreshToken();
        
        // If we have a refresh token and not already refreshing, try to refresh
        if (refreshToken && !isRefreshing) {
          isRefreshing = true;
          console.log('🔄 Attempting to refresh token after 401 error...');
          
          return authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              isRefreshing = false;
              console.log('✅ Token refresh successful, retrying original request');
              
              // Retry the original request with new token
              const newToken = response.token;
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              
              return next(retryRequest);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              
              // Refresh token failed, logout user
              console.error('❌ Token refresh failed, logging out:', refreshError);
              authService.logout();
              router.navigate(['/login']);
              
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token or already refreshing, logout
          if (!isRefreshing) {
            console.warn('⚠️ No refresh token available or already refreshing, logging out');
            authService.logout();
            router.navigate(['/login']);
          }
        }
      }
      
      return throwError(() => error);
    })
  );
};

