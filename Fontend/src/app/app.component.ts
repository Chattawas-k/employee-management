import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { IconComponent } from './shared/components/icon/icon.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
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
    DashboardComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isMobileMenuOpen = signal(false);
  isSettingsOpen = signal(false);
  isAuthenticated = signal(false);
  currentUser = signal<any>(null);

  // Computed signal to check if we should show the layout (sidebar, header, etc.)
  showLayout = computed(() => this.isAuthenticated());

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this.isAuthenticated.set(this.authService.isAuthenticated());
    this.currentUser.set(this.authService.getCurrentUser());

    // Subscribe to auth state changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      this.isAuthenticated.set(this.authService.isAuthenticated());
    });
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
}
