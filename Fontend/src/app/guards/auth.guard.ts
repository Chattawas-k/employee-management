import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { decodeJwtToken } from '../utils/jwt.util';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    const payload = decodeJwtToken(token);
    // Check if token exists and is not expired
    if (payload?.exp && payload.exp * 1000 > Date.now()) {
      return true;
    }
  }

  // Redirect to login page if not authenticated or token expired
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

