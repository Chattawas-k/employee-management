import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IconComponent } from './shared/components/icon/icon.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    IconComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isMobileMenuOpen = signal(false);
  isSettingsOpen = signal(false);
  isStatusMenuOpen = signal(false);
  isAuthenticated = signal(false);
  currentUser = signal<any>(null);
  availabilityStatus = signal<'available' | 'busy' | 'break' | 'unavailable'>('available');
  isLoginPage = signal(false);

  showLayout = computed(() => this.isAuthenticated() && !this.isLoginPage());

  statusInfo = computed(() => {
    switch (this.availabilityStatus()) {
      case 'available':
        return {
          text: 'พร้อมรับงาน',
          dotClass: 'bg-green-500',
        };
      case 'busy':
        return {
          text: 'ติดลูกค้า',
          dotClass: 'bg-orange-500',
        };
      case 'break':
        return {
          text: 'พัก',
          dotClass: 'bg-yellow-500',
        };
      case 'unavailable':
        return {
          text: 'ไม่พร้อมรับงาน',
          dotClass: 'bg-gray-400',
        };
    }
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated.set(this.authService.isAuthenticated());
    this.currentUser.set(this.authService.getCurrentUser());

    // Check current route
    this.checkRoute(this.router.url);

    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.url);
      });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      this.isAuthenticated.set(this.authService.isAuthenticated());
    });
  }

  private checkRoute(url: string): void {
    this.isLoginPage.set(url.includes('/login'));
  }

  logout(): void {
    this.authService.logout();
    this.isMobileMenuOpen.set(false);
    this.isSettingsOpen.set(false);
  }

  getUserInitial(): string {
    const user = this.currentUser();
    if (user?.userName) {
      return user.userName.charAt(0).toUpperCase();
    }
    return 'A';
  }

  getUserName(): string {
    const user = this.currentUser();
    return user?.userName || 'Admin User';
  }

  getUserRole(): string {
    const user = this.currentUser();
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0];
    }
    return 'System Admin';
  }

  toggleStatusMenu(): void {
    this.isStatusMenuOpen.update(v => !v);
  }

  setStatus(status: 'available' | 'busy' | 'break' | 'unavailable'): void {
    this.availabilityStatus.set(status);
    this.isStatusMenuOpen.set(false);
  }
}

