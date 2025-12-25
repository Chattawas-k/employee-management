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
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !req.url.includes('/auth/')) {
        const refreshToken = authService.getRefreshToken();
        
        // If we have a refresh token and not already refreshing, try to refresh
        if (refreshToken && !isRefreshing) {
          isRefreshing = true;
          
          return authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              isRefreshing = false;
              
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
              authService.logout();
              router.navigate(['/login']);
              
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token or already refreshing, logout
          if (!isRefreshing) {
            authService.logout();
            router.navigate(['/login']);
          }
        }
      }
      
      return throwError(() => error);
    })
  );
};

