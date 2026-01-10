import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const managerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if user has Manager, Admin, or SuperAdmin role
  const user = authService.getCurrentUser();
  if (!user || !user.roles) {
    router.navigate(['/my-tasks']);
    return false;
  }

  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  const hasManagerAccess = roles.some((role: string) => {
    const roleLower = role.toLowerCase();
    return roleLower === 'manager' || roleLower === 'admin' || roleLower === 'superadmin';
  });

  if (!hasManagerAccess) {
    router.navigate(['/my-tasks']);
    return false;
  }

  return true;
};
