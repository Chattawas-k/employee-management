import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const user = authService.getCurrentUser();
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.roles ? [user.roles] : []);
  const normalized = roles.map((r: unknown) => String(r ?? '').trim().toLowerCase());

  const isSuperAdmin = normalized.includes('superadmin');
  if (!isSuperAdmin) {
    router.navigate(['/assign']);
    return false;
  }

  return true;
};

