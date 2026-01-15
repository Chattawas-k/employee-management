import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="text-slate-500 text-sm">กำลังนำทาง...</div>
    </div>
  `,
})
export class HomeRedirectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const roles = Array.isArray(user?.roles) ? user.roles : (user?.roles ? [user.roles] : []);
    const normalized = roles.map((r: unknown) => String(r ?? '').trim().toLowerCase());

    const hasAdmin = normalized.includes('admin') || normalized.includes('superadmin');
    if (hasAdmin) {
      this.router.navigate(['/assign']);
      return;
    }

    // Basic-only
    const hasBasicOnly =
      normalized.includes('basic') &&
      !normalized.some((role: string) => role === 'admin' || role === 'superadmin' || role === 'manager');
    if (hasBasicOnly) {
      this.router.navigate(['/my-tasks']);
      return;
    }

    // Fallback
    this.router.navigate(['/my-tasks']);
  }
}

