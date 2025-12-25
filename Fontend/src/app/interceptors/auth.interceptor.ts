import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, Observable, filter, take } from 'rxjs';
import { Router } from '@angular/router';

// Shared state for token refresh management
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

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
        return handle401Error(req, next, authService, router);
      }
      
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<any>,
  next: (req: HttpRequest<any>) => Observable<any>,
  authService: AuthService,
  router: Router
): Observable<any> {
  const refreshToken = authService.getRefreshToken();

  if (!refreshToken) {
    // No refresh token, logout immediately
    authService.logout();
    router.navigate(['/login']);
    return throwError(() => new Error('No refresh token available'));
  }

  if (!isRefreshing) {
    // Start token refresh
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken(refreshToken).pipe(
      switchMap((response) => {
        isRefreshing = false;
        
        if (response.token) {
          // Token is already stored by AuthService.refreshToken() via tap operator
          // Notify waiting requests with new token
          refreshTokenSubject.next(response.token);
          
          // Retry the original request with new token
          return retryRequest(req, next, response.token);
        }
        
        // No token in response, logout
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('Token refresh failed: no token in response'));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        
        // Refresh token failed, logout user
        authService.logout();
        router.navigate(['/login']);
        
        return throwError(() => refreshError);
      })
    );
  } else {
    // Token refresh already in progress, wait for it to complete
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((newToken) => {
        if (newToken) {
          return retryRequest(req, next, newToken);
        }
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }
}

function retryRequest(
  req: HttpRequest<any>,
  next: (req: HttpRequest<any>) => Observable<any>,
  token: string
): Observable<any> {
  const retryRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return next(retryRequest);
}

