import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const user = authService.getCurrentUser();
  if (!user || !user.roles) {
    router.navigate(['/my-tasks']);
    return false;
  }

  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  const hasAdminAccess = roles.some((role: string) => {
    const roleLower = role.toLowerCase();
    return roleLower === 'admin' || roleLower === 'superadmin';
  });

  if (!hasAdminAccess) {
    router.navigate(['/my-tasks']);
    return false;
  }

  return true;
};

